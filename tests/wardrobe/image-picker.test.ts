import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";
import { pickerHtml } from "../../src/lib/wardrobe/chat-image-picker";

it("initializes the embedded card and saves the existing attachment through the host", async () => {
  const parent = { postMessage: vi.fn() };
  const elements = new Map<
    string,
    { textContent: string; querySelector: () => object }
  >();
  const document = {
    getElementById(id: string) {
      if (!elements.has(id))
        elements.set(id, { textContent: "", querySelector: () => ({}) });
      return elements.get(id);
    },
  };
  const callbacks = new Map();
  const image = {
    file_id: "file-hat",
    download_url: "https://files.oaiusercontent.com/hat",
  };
  const fields = {
    name: "Cap",
    category: "Accessories",
    color: "Navy",
    material: "",
  };
  const openai = {
    getFileDownloadUrl: vi
      .fn()
      .mockResolvedValue({ downloadUrl: image.download_url }),
    callTool: vi.fn().mockResolvedValue({
      structuredContent: {
        success: true,
        status: "saved",
        closet: "Max",
        itemId: "cap-id",
      },
    }),
  };
  const window = {
    openai,
    parent,
    addEventListener: (event: string, callback: () => void) =>
      callbacks.set(event, callback),
  };
  runInNewContext(pickerHtml.match(/<script>([\s\S]+)<\/script>/)![1], {
    window,
    document,
  });
  const init = parent.postMessage.mock.calls[0][0];
  expect(init.method).toBe("ui/initialize");
  const message = (data: object) =>
    callbacks.get("message")({
      source: parent,
      data: { jsonrpc: "2.0", ...data },
    });
  message({ id: init.id, result: { protocolVersion: "2026-01-26" } });
  expect(parent.postMessage.mock.calls[1][0].method).toBe(
    "ui/notifications/initialized",
  );
  message({
    method: "ui/notifications/tool-result",
    params: {
      structuredContent: {
        status: "needs_image",
        fields,
        closet: "Max",
        fileId: image.file_id,
      },
    },
  });
  await vi.waitFor(() =>
    expect(document.getElementById("status")?.textContent).toContain("cap-id"),
  );
  expect(openai.getFileDownloadUrl).toHaveBeenCalledWith({
    fileId: image.file_id,
  });
  expect(openai.callTool).toHaveBeenCalledWith("save_selected_wardrobe_photo", {
    ...fields,
    downloadUrl: image.download_url,
  });
});
