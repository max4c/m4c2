import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import sharp from "sharp";
import { POST as wardrobeMcp } from "../../src/app/wardrobe/mcp/route";
import { catalogPhoto } from "../../src/lib/wardrobe/catalog-photo";
import { ConvexHttpClient } from "convex/browser";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import {
  callback,
  clientId,
  credential,
  digest,
  resource,
  validConsent,
} from "../../src/lib/wardrobe/connection";
import {
  readChatImage,
  saveChatImage,
} from "../../src/lib/wardrobe/save-image";

const modules = import.meta.glob("../../convex/**/*.ts");
const token = "wardrobe-service-token".padEnd(48, "x");
const file = "https://files.oaiusercontent.com/example";
const chatAttachment =
  "https://oaisdmntprwestus3.blob.core.windows.net/files/hat?sig=test";
beforeEach(() => {
  vi.stubEnv("WARDROBE_SERVICE_TOKEN", token);
  vi.stubEnv("CONVEX_URL", "https://example.convex.cloud");
  vi.stubEnv("WARDROBE_ORIGIN", "https://wardrobe.example");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("accepts only the registered ChatGPT callback, resource, scope and S256 challenge", () => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callback,
    scope: "wardrobe.upload offline_access",
    resource: resource(),
    code_challenge: digest(credential()),
    code_challenge_method: "S256",
  });
  expect(validConsent(params)).toBe(true);
  for (const [key, value] of Object.entries({
    client_id: "wrong",
    redirect_uri: "https://other.example",
    resource: "https://other.example",
    scope: "read",
    code_challenge_method: "plain",
  })) {
    const bad = new URLSearchParams(params);
    bad.set(key, value);
    expect(validConsent(bad)).toBe(false);
  }
});
it("binds the connection to its authorizing owner, consumes codes once and rotates refresh tokens", async () => {
  const t = convexTest(schema, modules);
  for (const owner of ["max", "zhanel"] as const) {
    const code = credential(),
      challenge = digest(credential());
    await t.mutation(api.wardrobe.issueConnectionCode, {
      token,
      owner,
      code: digest(code),
      challenge,
      resource: resource(),
      offline: true,
    });
    const input = {
      token,
      resource: resource(),
      challenge,
      presented: digest(code),
      access: digest(credential()),
      refresh: digest(credential()),
    };
    expect(
      await t.mutation(api.wardrobe.exchangeConnection, {
        ...input,
        challenge: digest("wrong"),
      }),
    ).toBeNull();
    expect(await t.mutation(api.wardrobe.exchangeConnection, input)).toEqual({
      offline: true,
    });
    expect(await t.mutation(api.wardrobe.exchangeConnection, input)).toBeNull();
    const check = { token, resource: resource(), access: input.access };
    expect(await t.query(api.wardrobe.connectedOwner, check)).toBe(owner);
    expect(
      await t.query(api.wardrobe.connectedOwner, {
        ...check,
        resource: "wrong",
      }),
    ).toBeNull();
    const refresh = {
      token,
      resource: resource(),
      presented: input.refresh,
      access: digest(credential()),
      refresh: digest(credential()),
    };
    expect(await t.mutation(api.wardrobe.exchangeConnection, refresh)).toEqual({
      offline: true,
    });
    expect(
      await t.mutation(api.wardrobe.exchangeConnection, refresh),
    ).toBeNull();
    expect(await t.query(api.wardrobe.connectedOwner, check)).toBeNull();
    expect(
      await t.query(api.wardrobe.connectedOwner, {
        ...check,
        access: refresh.access,
      }),
    ).toBe(owner);
  }
});
it("saves a real PNG as a private front image, deduplicates retries and permits the same image in the other closet", async () => {
  const t = convexTest(schema, modules);
  vi.spyOn(ConvexHttpClient.prototype, "query").mockImplementation(
    (...[ref, args]) => t.query(ref as typeof api.wardrobe.imported, args),
  );
  vi.spyOn(ConvexHttpClient.prototype, "mutation").mockImplementation(
    (...[ref, args]) => t.mutation(ref as typeof api.wardrobe.importItem, args),
  );
  const png = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "white" },
  })
    .composite([
      {
        input: {
          create: { width: 4, height: 5, channels: 3, background: "navy" },
        },
      },
    ])
    .png()
    .toBuffer();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (
        String(input) === file ||
        String(input) === chatAttachment ||
        String(input) === "https://images.openai.com/static-rsc-4/hat"
      )
        return new Response(new Uint8Array(png));
      if (init?.method !== "POST") throw Error("Unexpected network request");
      const blob = await new Response(init.body, {
        headers: init.headers,
      }).blob();
      const bytes = Buffer.from(await blob.arrayBuffer());
      expect(blob.type).toBe("image/" + (await sharp(bytes).metadata()).format);
      if (blob.type === "image/png") expect(bytes).toEqual(png);
      return Response.json({
        storageId: await t.run((ctx) => ctx.storage.store(blob)),
      });
    }),
  );
  const fields = {
    name: "Navy hoodie",
    category: "Tops",
    color: "Navy",
    material: "",
  } as const;
  const access = credential(),
    challenge = digest(credential()),
    code = digest(credential());
  await t.mutation(api.wardrobe.issueConnectionCode, {
    token,
    owner: "max",
    code,
    challenge,
    resource: resource(),
    offline: false,
  });
  await t.mutation(api.wardrobe.exchangeConnection, {
    token,
    resource: resource(),
    presented: code,
    challenge,
    access: digest(access),
    refresh: digest(credential()),
  });
  async function rpc(method: string, params: Record<string, unknown>) {
    const response = await wardrobeMcp(
      new Request(resource(), {
        method: "POST",
        headers: {
          authorization: "Bearer " + access,
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      }),
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.error).toBeUndefined();
    return payload.result;
  }
  const [tool, pickerSave] = (await rpc("tools/list", {})).tools;
  expect(pickerSave.name).toBe("save_selected_wardrobe_photo");
  expect(pickerSave._meta.ui.visibility).toEqual(["app"]);
  expect(tool._meta["openai/fileParams"]).toEqual(["image"]);
  expect(tool.inputSchema.properties.image).toMatchObject({
    type: "object",
    required: ["download_url", "file_id"],
    properties: {
      download_url: { type: "string" },
      file_id: { type: "string" },
      mime_type: { type: "string" },
      file_name: { type: "string" },
    },
  });
  const call = (image: unknown) =>
    rpc("tools/call", { name: tool.name, arguments: { ...fields, image } });
  const attachment = { file_id: "file-hat", download_url: file };
  for (const ref of [
    "file-hat",
    "file-service://file-hat",
    "sediment://file_hat",
    "/mnt/data/hat.png",
    "sandbox:/mnt/data/hat.png",
  ]) {
    expect((await call(ref)).structuredContent).toMatchObject({
      status: "needs_image",
      success: false,
      error: { code: "ATTACHMENT_NOT_RESOLVED", retryable: true },
      closet: "Max",
      fields,
    });
  }
  expect(
    await t.query(api.wardrobe.list, { owner: "max", token }),
  ).toHaveLength(0);
  const picker = await rpc("resources/read", {
    uri: tool._meta.ui.resourceUri,
  });
  expect(picker.contents[0].mimeType).toBe("text/html;profile=mcp-app");
  const first = (
    await call({
      ...attachment,
      download_url: chatAttachment,
    })
  ).structuredContent;
  expect(first).toMatchObject({
    success: true,
    status: "saved",
    closet: "Max",
    itemId: expect.any(String),
  });
  expect(first.imageUrl).toBe(
    "https://wardrobe.example/wardrobe/api/image/" + first.itemId + "/front",
  );
  for (const ref of [
    file,
    "https://images.openai.com/static-rsc-4/hat",
    attachment,
    JSON.stringify(attachment),
  ]) {
    expect((await call(ref)).structuredContent).toEqual({
      ...first,
      status: "already_saved",
    });
  }
  expect(
    (
      await rpc("tools/call", {
        name: pickerSave.name,
        arguments: { ...fields, downloadUrl: file },
      })
    ).structuredContent,
  ).toMatchObject({
    success: true,
    status: "already_saved",
    itemId: first.itemId,
  });
  expect(
    await t.query(api.wardrobe.list, { owner: "max", token }),
  ).toHaveLength(1);
  expect((await call("https://example.com/image.png")).isError).toBe(true);
  expect(await t.query(api.wardrobe.list, { owner: "zhanel", token })).toEqual(
    [],
  );
  const other = await saveChatImage("zhanel", fields, file);
  expect(other.url).not.toBe(first.url);
  expect(
    (await t.query(api.wardrobe.list, { owner: "zhanel", token }))[0],
  ).toMatchObject({ name: fields.name, views: ["front", "source"] });
});
it("requires a supported ChatGPT file and reports unreadable files", async () => {
  const remote = vi.fn(async () => new Response("not an image"));
  vi.stubGlobal("fetch", remote);
  await expect(readChatImage("https://example.com/image")).rejects.toThrow(
    "Pass the selected ChatGPT file",
  );
  await expect(
    readChatImage("https://another-tenant.blob.core.windows.net/files/hat"),
  ).rejects.toMatchObject({ code: "UNSUPPORTED_IMAGE_REFERENCE" });
  expect(remote).not.toHaveBeenCalled();
  await expect(readChatImage(file)).rejects.toThrow("still PNG");
});

it.each(["#f2ece5", "transparent"])(
  "places %s studio shots on white without tinting the subject",
  async (background) => {
    const source = await sharp({
      create: { width: 120, height: 90, channels: 4, background },
    })
      .composite([
        {
          input: {
            create: {
              width: 66,
              height: 50,
              channels: 3,
              background: "#423e50",
            },
          },
        },
      ])
      .png()
      .toBuffer();
    const out = await catalogPhoto(source);
    const { data, info } = await sharp(out)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(info.width / info.height).toBe(0.8);
    for (const [x, y] of [
      [0, 0],
      [10, info.height / 2],
    ]) {
      const i = (y * info.width + x) * 3;
      expect(Math.min(...data.subarray(i, i + 3))).toBeGreaterThanOrEqual(253);
    }
    const center = ((info.height / 2) * info.width + info.width / 2) * 3;
    [66, 62, 80].forEach((value, c) =>
      expect(Math.abs(data[center + c] - value)).toBeLessThan(4),
    );
  },
);
it("preserves the original scene inside the white catalog frame", async () => {
  const image = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "navy" },
  })
    .png()
    .toBuffer();
  const { data, info } = await sharp(await catalogPhoto(image))
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(Math.min(...data.subarray(0, 3))).toBeGreaterThanOrEqual(253);
  const center = 3 * (info.width * (info.height / 2) + info.width / 2);
  expect(data[center]).toBeLessThan(5);
  expect(data[center + 2]).toBeGreaterThan(120);
});

it("reports expired links and oversized files without exposing their URLs", async () => {
  const remote = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 403 }))
    .mockResolvedValueOnce(
      new Response("bytes", {
        headers: { "content-length": String(16 * 1024 * 1024) },
      }),
    );
  vi.stubGlobal("fetch", remote);
  await expect(readChatImage(file)).rejects.toMatchObject({
    code: "IMAGE_DOWNLOAD_FAILED",
    retryable: true,
    message: expect.stringContaining("403"),
  });
  await expect(readChatImage(file)).rejects.toMatchObject({
    code: "IMAGE_TOO_LARGE",
  });
  expect(remote.mock.calls[0][1].redirect).toBe("error");
});
