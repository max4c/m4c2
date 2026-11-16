import { readFileSync, statSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { api } from "../../convex/_generated/api.js";
import { metadataSchema } from "../../shared/wardrobe.ts";
if (!process.env.CONVEX_URL) process.loadEnvFile(".env.local");
if (!process.argv[2])
  throw new Error(
    "Usage: node scripts/wardrobe/import.mjs path/to/manifest.json [--production]",
  );
const manifestPath = resolve(process.argv[2]);
const manifest = z
  .object({
    owner: z.enum(["max", "zhanel"]),
    items: z
      .array(
        z
          .object({
            externalId: z.string().trim().min(1).max(160),
            name: z.string().trim().min(1).max(120),
            category: z.string(),
            color: z.string(),
            material: z.string().max(120).default(""),
            images: z
              .object({
                front: z.string().optional(),
                side: z.string().optional(),
                back: z.string().optional(),
                detail: z.string().optional(),
                source: z.string().optional(),
              })
              .strict(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .parse(JSON.parse(readFileSync(manifestPath, "utf8")));
const url = process.env.CONVEX_URL;
if (!url || !process.env.WARDROBE_SERVICE_TOKEN)
  throw new Error("Set CONVEX_URL and WARDROBE_SERVICE_TOKEN.");
if (
  !["127.0.0.1", "localhost"].includes(new URL(url).hostname) &&
  !process.argv.includes("--production")
)
  throw new Error(
    "Nonlocal imports require --production and explicit production credentials.",
  );
const mime = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const ids = new Set();
// Preflight every file and field before uploading anything.
for (const item of manifest.items) {
  if (ids.has(item.externalId)) throw new Error("Duplicate manifest identity");
  ids.add(item.externalId);
  metadataSchema.parse({
    name: item.name,
    category: item.category,
    color: item.color,
    material: item.material,
  });
  for (const file of Object.values(item.images)) {
    const path = resolve(dirname(manifestPath), file);
    if (
      !mime[extname(path).toLowerCase()] ||
      statSync(path).size > 15 * 1024 * 1024
    )
      throw new Error(`Invalid image: ${file}`);
  }
}
const db = new ConvexHttpClient(url);
const auth = {
  token: process.env.WARDROBE_SERVICE_TOKEN,
  owner: manifest.owner,
};
for (const item of manifest.items) {
  const { externalId, images: files, ...fields } = item;
  if (await db.query(api.wardrobe.imported, { ...auth, externalId })) {
    console.log(`Already imported: ${fields.name}`);
    continue;
  }
  const images = [];
  for (const [view, file] of Object.entries(files)) {
    const path = resolve(dirname(manifestPath), file);
    const uploadUrl = await db.mutation(api.wardrobe.uploadUrl, {
      token: auth.token,
    });
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": mime[extname(path).toLowerCase()] },
      body: readFileSync(path),
    });
    if (!response.ok)
      throw new Error(`Upload failed for ${fields.name}, ${view}`);
    const { storageId } = await response.json();
    images.push({ view, storageId });
  }
  await db.mutation(api.wardrobe.importItem, {
    ...auth,
    externalId,
    fields,
    images,
  });
  console.log(`Imported: ${fields.name}`);
}
