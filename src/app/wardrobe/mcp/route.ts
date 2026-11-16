import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { chatImageInput } from "../../../lib/wardrobe/chat-image-input";
import {
  pickerHtml,
  pickerUri,
  widgetMime,
} from "../../../lib/wardrobe/chat-image-picker";
import { api } from "../../../../convex/_generated/api";
import {
  metadataSchema,
  ownerName,
  type ItemMetadata,
  type WardrobeOwner,
} from "../../../../shared/wardrobe";
import {
  backend,
  digest,
  origin,
  resource,
  scope,
} from "../../../lib/wardrobe/connection";
import {
  ImageInputError,
  saveChatImage,
} from "../../../lib/wardrobe/save-image";

export const maxDuration = 60;
export async function POST(request: Request) {
  const caller = request.headers.get("origin");
  if (caller && caller !== "https://chatgpt.com" && caller !== origin())
    return new Response(null, { status: 403 });
  const raw = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(
    request.headers.get("authorization") ?? "",
  )?.[1];
  const { db, token } = backend();
  const owner =
    raw &&
    (await db.query(api.wardrobe.connectedOwner, {
      token,
      access: digest(raw),
      resource: resource(),
    }));
  if (!owner)
    return new Response(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${origin()}/.well-known/oauth-protected-resource/wardrobe/mcp", scope="${scope}"`,
      },
    });
  const server = new McpServer(
    { name: "outfits-wardrobe", version: "1.3.4" },
    {
      instructions:
        "Use the original uploaded photo unless the user requests an edited or generated image.",
    },
  );
  server.registerResource(
    "wardrobe-image-picker",
    pickerUri,
    { mimeType: widgetMime },
    async () => ({
      contents: [{ uri: pickerUri, mimeType: widgetMime, text: pickerHtml }],
    }),
  );
  server.registerTool(
    "save_wardrobe_item",
    {
      title: "Save a garment to my closet",
      description: `Save a clothing item or accessory to ${ownerName[owner]}’s closet using the selected ChatGPT file. Pass the original photo directly unless the user chose an edited or generated image. ChatGPT supplies the file object. Infer category and color when clear, use Unknown for uncertain color and leave uncertain material blank. Report a save only after success is true. For needs_image, use the card with the existing attachment.`,
      inputSchema: metadataSchema.extend({ image: chatImageInput }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        "openai/fileParams": ["image"],
        ui: { resourceUri: pickerUri, visibility: ["model", "app"] },
        "openai/outputTemplate": pickerUri,
        "openai/widgetAccessible": true,
        securitySchemes: [{ type: "oauth2", scopes: [scope] }],
      },
    },
    async ({ image, ...fields }) => {
      if (image.download_url.startsWith("https://")) {
        const result = await save(owner, fields, image.download_url);
        if (
          !image.file_id ||
          !("error" in result.structuredContent) ||
          result.structuredContent.error?.code !== "UNSUPPORTED_IMAGE_REFERENCE"
        )
          return result;
      }
      const message =
        "ChatGPT supplied a reference without a downloadable file. Use the existing conversation photo in the image card.";
      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        structuredContent: {
          success: false,
          error: {
            code: "ATTACHMENT_NOT_RESOLVED",
            message,
            retryable: true,
          },
          status: "needs_image",
          closet: ownerName[owner],
          fields,
          fileId: image.file_id,
        },
      };
    },
  );
  // The picker already has a temporary URL issued by ChatGPT. Send it through
  // an app-only tool so the host does not interpret it as a new file parameter.
  server.registerTool(
    "save_selected_wardrobe_photo",
    {
      title: "Save selected closet photo",
      description:
        "Finish an already requested save using the photo selected in the Outfits card.",
      inputSchema: metadataSchema.extend({ downloadUrl: z.string().url() }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: { visibility: ["app"] },
        "openai/visibility": "private",
        "openai/widgetAccessible": true,
        securitySchemes: [{ type: "oauth2", scopes: [scope] }],
      },
    },
    ({ downloadUrl, ...fields }) => save(owner, fields, downloadUrl),
  );
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}
async function save(owner: WardrobeOwner, fields: ItemMetadata, url: string) {
  try {
    const receipt = await saveChatImage(owner, fields, url);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(receipt) }],
      structuredContent: receipt,
    };
  } catch (error) {
    const failure =
      error instanceof ImageInputError
        ? error
        : new ImageInputError(
            "SAVE_UNCONFIRMED",
            "Unable to confirm the save. Retry with the same image.",
            true,
          );
    const { code, message, retryable } = failure;
    return {
      isError: true,
      structuredContent: {
        success: false,
        error: { code, message, retryable },
      },
      content: [{ type: "text" as const, text: message }],
    };
  }
}
export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
