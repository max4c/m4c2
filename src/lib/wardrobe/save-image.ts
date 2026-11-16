import sharp from "sharp";
import { catalogPhoto } from "./catalog-photo";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ownerName,
  type ItemMetadata,
  type WardrobeOwner,
} from "../../../shared/wardrobe";
import { backend, digest, origin } from "./connection";

const limit = 15 * 1024 * 1024;
export class ImageInputError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false,
  ) {
    super(message);
  }
}

function permittedImageHost(url: URL) {
  return (
    url.hostname.endsWith(".oaiusercontent.com") ||
    // ChatGPT file parameters can contain a SAS URL for this OpenAI storage
    // account. Other Azure tenants are outside this connector's trust boundary.
    url.hostname === "oaisdmntprwestus3.blob.core.windows.net" ||
    (url.hostname === "chatgpt.com" &&
      url.pathname === "/backend-api/estuary/content") ||
    (url.hostname === "images.openai.com" &&
      /^\/static-rsc-\d+\//.test(url.pathname))
  );
}

const sizeError = () =>
  new ImageInputError("IMAGE_TOO_LARGE", "The maximum image size is 15 MiB.");
export async function readChatImage(value: string) {
  const url = URL.canParse(value) ? new URL(value) : null;
  if (
    !url ||
    url.protocol !== "https:" ||
    !permittedImageHost(url) ||
    url.username ||
    url.password ||
    url.port
  ) {
    // Report only the transport and host. Paths, query strings and file IDs are private.
    console.info(
      "wardrobe attachment destination rejected",
      url?.protocol,
      url?.hostname.slice(-120),
    );
    throw new ImageInputError(
      "UNSUPPORTED_IMAGE_REFERENCE",
      "Pass the selected ChatGPT file so ChatGPT provides its temporary download URL.",
    );
  }
  let image: Buffer;
  try {
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(18000),
      cache: "no-store",
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new ImageInputError(
        "IMAGE_DOWNLOAD_FAILED",
        `ChatGPT's image host returned HTTP ${response.status}. Request a fresh file link from ChatGPT.`,
        [401, 403, 404, 408, 410, 429].includes(response.status) ||
          response.status >= 500,
      );
    }
    if (!response.body) throw new Error();
    if (Number(response.headers.get("content-length")) > limit) {
      await response.body.cancel();
      throw sizeError();
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw sizeError();
      }
      chunks.push(value);
    }
    image = Buffer.concat(chunks);
  } catch (error) {
    if (error instanceof ImageInputError) throw error;
    throw new ImageInputError(
      "IMAGE_DOWNLOAD_FAILED",
      "Request a fresh link for the same ChatGPT file and retry.",
      true,
    );
  }
  try {
    const pipeline = sharp(image, {
      limitInputPixels: 40_000_000,
      failOn: "error",
    });
    const meta = await pipeline.metadata();
    if (
      !meta.format ||
      !["jpeg", "png", "webp"].includes(meta.format) ||
      (meta.pages ?? 1) > 1
    )
      throw new Error();
    return {
      image,
      mimeType: "image/" + meta.format,
      externalId: "chat-image-" + digest(image),
    };
  } catch {
    throw new ImageInputError(
      "UNSUPPORTED_IMAGE_TYPE",
      "Choose a still PNG, JPEG or WebP garment image under 40 megapixels.",
    );
  }
}

export async function saveChatImage(
  owner: WardrobeOwner,
  fields: ItemMetadata,
  url: string,
) {
  const { image, mimeType, externalId } = await readChatImage(url);
  const { db, token } = backend();
  const identity = { token, owner, externalId };
  let id = await db.query(api.wardrobe.imported, identity);
  let imported = false;
  if (!id) {
    let bytes: Buffer;
    try {
      bytes = await catalogPhoto(image);
    } catch {
      throw new ImageInputError(
        "UNSUPPORTED_IMAGE_TYPE",
        "Unable to decode this photo. Choose a still PNG, JPEG or WebP.",
      );
    }
    async function store(bytes: Buffer, contentType: string) {
      const uploadUrl = await db.mutation(api.wardrobe.uploadUrl, { token });
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: new Uint8Array(bytes),
        headers: { "Content-Type": contentType },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Storage unavailable");
      const { storageId } = (await response.json()) as {
        storageId: Id<"_storage">;
      };
      return storageId;
    }
    const [front, source] = await Promise.all([
      store(bytes, "image/webp"),
      store(image, mimeType),
    ]);
    const result = await db.mutation(api.wardrobe.importItem, {
      ...identity,
      fields,
      images: [
        { view: "front", storageId: front },
        { view: "source", storageId: source },
      ],
    });
    id = result.id;
    imported = result.imported;
  }
  return {
    success: true,
    itemId: id,
    imageUrl: origin() + "/wardrobe/api/image/" + id + "/front",
    closet: ownerName[owner],
    status: imported ? "saved" : "already_saved",
    url: origin() + "/#" + id,
  };
}
