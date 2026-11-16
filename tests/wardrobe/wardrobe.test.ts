import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { scryptSync } from "node:crypto";
import { NextRequest } from "next/server";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import {
  createSession,
  passwordMatches,
  sessionOwner,
  sessionSeconds,
} from "../../src/lib/wardrobe/session";
import {
  metadataSchema,
  selectItems,
  type WardrobeItem,
} from "../../shared/wardrobe";
import { proxy } from "../../src/proxy";

const modules = import.meta.glob("../../convex/**/*.ts");
const token = "wardrobe-test-token".padEnd(64, "x");
const fields = {
  name: "Black linen shirt",
  category: "Shirts",
  color: "Black",
  material: "Linen",
} as const;
beforeEach(() => {
  vi.stubEnv("WARDROBE_SERVICE_TOKEN", token);
  vi.stubEnv("WARDROBE_SESSION_SECRET", "wardrobe-secret".padEnd(64, "x"));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("signs an owner into the cookie and rejects impersonation, expiry and rotation", () => {
  const now = Date.now();
  const max = createSession("max", now),
    zhanel = createSession("zhanel", now);
  expect(sessionOwner(max, now)).toBe("max");
  expect(sessionOwner(zhanel, now)).toBe("zhanel");
  expect(sessionOwner(max.replace("max.", "zhanel."), now)).toBeNull();
  expect(sessionOwner(max + ".extra", now)).toBeNull();
  expect(sessionOwner(max, now + sessionSeconds * 1000)).toBeNull();
  expect(sessionOwner(max, now - sessionSeconds * 2000)).toBeNull();
  expect(sessionOwner("bad")).toBeNull();
  vi.stubEnv("WARDROBE_SESSION_SECRET", "rotated".padEnd(64, "x"));
  expect(sessionOwner(max, now)).toBeNull();
});
it("checks distinct password hashes without accepting unconfigured accounts", () => {
  const hash = (password: string) =>
    `salt:${scryptSync(password, "salt", 64).toString("hex")}`;
  vi.stubEnv("WARDROBE_MAX_PASSWORD_HASH", hash("max-password"));
  vi.stubEnv("WARDROBE_ZHANEL_PASSWORD_HASH", hash("zhanel-password"));
  expect(passwordMatches("max", "max-password")).toBe(true);
  expect(passwordMatches("zhanel", "max-password")).toBe(false);
  expect(passwordMatches("zhanel", "zhanel-password")).toBe(true);
  vi.stubEnv("WARDROBE_ZHANEL_PASSWORD_HASH", "");
  expect(passwordMatches("zhanel", "")).toBe(false);
});
it("isolates reads, edits and private images by owner and requires the independent service credential", async () => {
  const t = convexTest(schema, modules);
  const imageId = await t.run((ctx) =>
    ctx.storage.store(
      new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
    ),
  );
  const { id } = await t.mutation(api.wardrobe.importItem, {
    token,
    owner: "max",
    externalId: "first",
    fields,
    images: [{ view: "front", storageId: imageId }],
  });
  expect(await t.query(api.wardrobe.list, { token, owner: "zhanel" })).toEqual(
    [],
  );
  const own = await t.query(api.wardrobe.list, { token, owner: "max" });
  expect(own).toHaveLength(1);
  expect(own[0]).toMatchObject({ name: fields.name, views: ["front"] });
  expect(own[0]).not.toHaveProperty("images");
  expect(
    await t.query(api.wardrobe.image, {
      token,
      owner: "max",
      id,
      view: "front",
    }),
  ).toBeTruthy();
  expect(
    await t.query(api.wardrobe.image, {
      token,
      owner: "zhanel",
      id,
      view: "front",
    }),
  ).toBeNull();
  expect(
    await t.query(api.wardrobe.image, {
      token,
      owner: "max",
      id,
      view: "back",
    }),
  ).toBeNull();
  await expect(
    t.mutation(api.wardrobe.update, {
      token,
      owner: "zhanel",
      id,
      fields,
      expectedUpdatedAt: own[0].updatedAt,
    }),
  ).rejects.toMatchObject({ data: "Item not found" });
  await expect(
    t.query(api.wardrobe.list, { token: "wrong", owner: "max" }),
  ).rejects.toThrow("Unauthorized");
});
it("keeps blank material, protects images, rejects stale edits and does not overwrite edits on reimport", async () => {
  const t = convexTest(schema, modules);
  const input = {
    token,
    owner: "zhanel" as const,
    externalId: "first",
    fields,
    images: [],
  };
  const { id } = await t.mutation(api.wardrobe.importItem, input);
  const [before] = await t.query(api.wardrobe.list, { token, owner: "zhanel" });
  await t.mutation(api.wardrobe.update, {
    token,
    owner: "zhanel",
    id,
    fields: { ...fields, material: "", name: "My shirt" },
    expectedUpdatedAt: before.updatedAt,
  });
  await expect(
    t.mutation(api.wardrobe.update, {
      token,
      owner: "zhanel",
      id,
      fields,
      expectedUpdatedAt: before.updatedAt,
    }),
  ).rejects.toMatchObject({
    data: "This item changed. Reload before saving.",
  });
  expect(await t.mutation(api.wardrobe.importItem, input)).toEqual({
    id,
    imported: false,
  });
  const [after] = await t.query(api.wardrobe.list, { token, owner: "zhanel" });
  expect(after.name).toBe("My shirt");
  expect(after.material).toBe("");
  expect(after.views).toEqual(before.views);
  expect(metadataSchema.safeParse({ ...fields, owner: "max" }).success).toBe(
    false,
  );
  expect(
    metadataSchema.safeParse({ ...fields, category: "invented" }).success,
  ).toBe(false);
});
it("only deletes the owner's current item and photos not used elsewhere", async () => {
  const t = convexTest(schema, modules);
  const photo = (text: string) =>
    t.run((ctx) => ctx.storage.store(new Blob([text], { type: "image/png" })));
  const front = await photo("front"),
    source = await photo("source");
  const input = { token, fields, externalId: "one" };
  const { id } = await t.mutation(api.wardrobe.importItem, {
    ...input,
    owner: "max",
    images: [
      { view: "front", storageId: front },
      { view: "source", storageId: source },
    ],
  });
  const other = await t.mutation(api.wardrobe.importItem, {
    ...input,
    owner: "zhanel",
    images: [{ view: "front", storageId: source }],
  });
  const [item] = await t.query(api.wardrobe.list, { token, owner: "max" });
  const target = {
    token,
    owner: "max" as const,
    id,
    expectedUpdatedAt: item.updatedAt,
  };
  await expect(
    t.mutation(api.wardrobe.remove, { ...target, owner: "zhanel" }),
  ).rejects.toMatchObject({ data: "Item not found" });
  await expect(
    t.mutation(api.wardrobe.remove, { ...target, expectedUpdatedAt: 0 }),
  ).rejects.toThrow("Reload before deleting");
  await t.mutation(api.wardrobe.remove, target);
  expect(await t.query(api.wardrobe.list, { token, owner: "max" })).toEqual([]);
  expect(await t.run((ctx) => ctx.db.system.get(front))).toBeNull();
  expect(
    await t.query(api.wardrobe.image, {
      token,
      owner: "zhanel",
      id: other.id,
      view: "front",
    }),
  ).toBeTruthy();
});
it("rejects non-image uploads and duplicate view labels", async () => {
  const t = convexTest(schema, modules);
  const storageId = await t.run((ctx) =>
    ctx.storage.store(new Blob(["private data"], { type: "text/html" })),
  );
  const input = { token, owner: "max" as const, externalId: "first", fields };
  await expect(
    t.mutation(api.wardrobe.importItem, {
      ...input,
      images: [{ view: "front", storageId }],
    }),
  ).rejects.toThrow("Invalid image");
  await expect(
    t.mutation(api.wardrobe.importItem, {
      ...input,
      images: [
        { view: "front", storageId },
        { view: "front", storageId },
      ],
    }),
  ).rejects.toThrow("Duplicate");
});
it("limits login attempts independently of fitness and reopens after the window", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();
  vi.spyOn(Date, "now").mockReturnValue(now);
  for (let i = 0; i < 10; i++)
    expect(
      await t.mutation(api.wardrobe.loginAttempt, { token, client: "one" }),
    ).toBe(true);
  expect(
    await t.mutation(api.wardrobe.loginAttempt, { token, client: "one" }),
  ).toBe(false);
  expect(
    await t.mutation(api.wardrobe.loginAttempt, { token, client: "two" }),
  ).toBe(true);
  vi.spyOn(Date, "now").mockReturnValue(now + 900000);
  expect(
    await t.mutation(api.wardrobe.loginAttempt, { token, client: "one" }),
  ).toBe(true);
});
it("combines filters, handles unspecified materials and sorts copies deterministically", () => {
  const items: WardrobeItem[] = [
    { ...fields, _id: "1", views: [], addedAt: 1, updatedAt: 1 },
    {
      ...fields,
      _id: "2",
      name: "White tee",
      category: "Tops",
      color: "White",
      material: "Cotton",
      views: [],
      addedAt: 3,
      updatedAt: 3,
    },
    {
      ...fields,
      _id: "3",
      name: "Black tee",
      category: "Tops",
      material: "",
      views: [],
      addedAt: 2,
      updatedAt: 2,
    },
  ];
  const filters = {
    search: "",
    color: "",
    category: "",
    material: "",
    sort: "recent",
  };
  expect(selectItems(items, filters).map((item) => item._id)).toEqual([
    "2",
    "3",
    "1",
  ]);
  expect(
    selectItems(items, { ...filters, color: "Black", category: "Tops" }).map(
      (item) => item._id,
    ),
  ).toEqual(["3"]);
  expect(
    selectItems(items, { ...filters, material: "__unknown" }).map(
      (item) => item._id,
    ),
  ).toEqual(["3"]);
  expect(
    selectItems(items, { ...filters, search: " LINEN " }).map(
      (item) => item._id,
    ),
  ).toEqual(["1"]);
  expect(
    selectItems(items, { ...filters, sort: "name" }).map((item) => item._id),
  ).toEqual(["1", "3", "2"]);
  expect(items[0]._id).toBe("1");
});
it("routes wardrobe, fitness and public origins separately and fails closed without configuration", () => {
  vi.stubEnv("WARDROBE_APP_HOST", "app2.maxforsey.com");
  vi.stubEnv("FITNESS_APP_HOST", "app.maxforsey.com");
  const req = (host: string, path: string) =>
    new NextRequest(`https://${host}${path}`, { headers: { host } });
  expect(
    proxy(req("app2.maxforsey.com", "/")).headers.get("x-middleware-rewrite"),
  ).toBe("https://app2.maxforsey.com/wardrobe");
  expect(
    proxy(req("app.maxforsey.com", "/")).headers.get("x-middleware-rewrite"),
  ).toBe("https://app.maxforsey.com/fitness");
  expect(
    proxy(req("maxforsey.com", "/")).headers.get("x-middleware-rewrite"),
  ).toBeNull();
  expect(proxy(req("app2.maxforsey.com", "/fitness/api/data")).status).toBe(
    404,
  );
  expect(proxy(req("app2.maxforsey.com", "/blog")).status).toBe(404);
  expect(
    proxy(req("app2.maxforsey.com", "/wardrobe/api/items")).headers.get(
      "cache-control",
    ),
  ).toBe("no-store");
  expect(proxy(req("maxforsey.com", "/wardrobe")).headers.get("location")).toBe(
    "https://app2.maxforsey.com/wardrobe",
  );
  vi.stubEnv("WARDROBE_APP_HOST", "");
  expect(proxy(req("maxforsey.com", "/wardrobe/api/items")).status).toBe(503);
});
