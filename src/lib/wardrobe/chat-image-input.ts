import { z } from "zod";

const fileObject = z.strictObject({
  download_url: z.string(),
  file_id: z.string(),
  mime_type: z.string().optional(),
  file_name: z.string().optional(),
});

// ChatGPT discovers a file-object field, but a client can forward the
// pre-hydration string. Normalize it before MCP validates the tool arguments.
export const chatImageInput = z.preprocess((input) => {
  if (typeof input !== "string") return input;
  const value = input.trim();
  if (value.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch {
      /* Report an attachment error below. */
    }
  }
  if (value.startsWith("https://")) return { download_url: value, file_id: "" };
  const handle =
    /^(?:(?:sediment|file-service):\/\/)?(file[-_][a-zA-Z0-9_-]+)$/.exec(value);
  if (handle) return { file_id: handle[1], download_url: "" };
  // An unresolved conversation handle cannot be fetched by the server. Give
  // the host a chance to select that same file without reading a local path.
  return { file_id: "", download_url: "" };
}, fileObject.describe("Use the selected ChatGPT file. ChatGPT supplies its file_id and temporary download_url."));
