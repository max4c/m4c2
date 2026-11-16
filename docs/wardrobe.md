# Outfits

Mobile wardrobe at `app2.maxforsey.com`, served by the existing Next.js/Vercel project. Max and Zhanel have separate username/password accounts. All catalogue reads, edits and image requests derive the owner from a signed HttpOnly session. The browser cannot choose an owner. Fitness sessions and credentials cannot access the wardrobe.

The catalogue supports combined category/color/material filters, text search, and sorting by newest, name, category, color or material. Item details show available front/side/back/detail views and an optional original frame. Metadata can be edited; images cannot. Material is optional. The Outfits tab shows the latest published week with try-on photos, links to garments, and the forecast for each day. The wardrobe MCP connector lets ChatGPT add garments to the signed-in user’s closet.

## Local development

Use Node 24, then `npm ci`. Start `CONVEX_AGENT_MODE=anonymous npx convex dev` and leave it running. This configures a local backend and generates types. Run `node scripts/wardrobe/setup-local.mjs`, then `npm run dev`. Open `http://app2.localhost:3000`. The local usernames are `max` and `zhanel`; generated local passwords are saved in ignored `.vercel/wardrobe-local.json`.

Run `npm run check:wardrobe`, `npm run check:fitness`, `npm run lint`, and `npm run build`. The browser check `node scripts/wardrobe/check-local.mjs` expects the synthetic sample catalogue from `node scripts/wardrobe/fixture.mjs`; run it in a disposable local database before importing personal garments. Repeated login tests may reach the local 10-attempt/15-minute limit.

## Initial curated import

Extract and review video frames offline. Generate faithful catalogue views from those actual frames; do not invent unseen views, fabric, brands or details. Keep unknown material as an empty string. Clothing should have observed front/side/back views, while other items use meaningful category-specific views.

Create a private JSON manifest beside the processed images:

```json
{
  "owner": "zhanel",
  "items": [
    {
      "externalId": "video-01-item-001",
      "name": "Black linen shirt",
      "category": "Shirts",
      "color": "Black",
      "material": "Linen",
      "images": {
        "front": "001-front.png",
        "side": "001-side.png",
        "back": "001-back.png",
        "source": "001-frame.jpg"
      }
    }
  ]
}
```

Run `node scripts/wardrobe/import.mjs /absolute/path/to/manifest.json`. Category/color choices are defined in `shared/wardrobe.ts`. File uploads use Convex storage. The website streams authorized images through its server rather than disclosing storage URLs. Stable owner/externalId pairs make imports repeatable without overwriting later metadata corrections. Completed items are skipped on retry; interrupted uploads may leave unused storage files for later cleanup. Keep private videos, manifests and images outside git.

## Production configuration

Set the following on the existing Vercel project, preserving Supermedium/public-site variables:

- `WARDROBE_APP_HOST=app2.maxforsey.com`
- `WARDROBE_ORIGIN=https://app2.maxforsey.com`
- `WARDROBE_SESSION_SECRET`: a separate random secret of at least 32 characters
- `WARDROBE_SERVICE_TOKEN`: a separate random secret of at least 32 characters, also set in the production Convex environment
- `WARDROBE_MAX_PASSWORD_HASH`, `WARDROBE_ZHANEL_PASSWORD_HASH`: `salt:hex-scrypt-hash`, generated using Node's `scryptSync(password, salt, 64)` with distinct random salts
- `CONVEX_URL`: existing backend URL

Add the hostname to Vercel and configure its DNS record. Deploy the additive Convex schema/functions, then deploy Next.js. Verify both real accounts, persistent sessions, wrong-password rejection, cross-account item/image denial, metadata editing, app hostname separation, and existing Supermedium/public-site behavior. Never seed test items into production. The wardrobe has its own Home Screen manifest/icon and does not cache private data offline.

Production credentials, environment values, additive Convex functions and schema, and the Outfits website have been deployed. `app2.maxforsey.com` has its own Vercel alias and a Namecheap A record pointing to `76.76.21.21`. The existing public and Supermedium domain aliases were preserved. Account credentials are stored privately in ignored `.vercel/wardrobe-production.json`; they are not checked into git.

## Connect ChatGPT to a closet

In ChatGPT on the web, open **Plugins → + → Add custom MCP server**. Name it **Outfits** and enter `https://app2.maxforsey.com/wardrobe/mcp`. Choose **OAuth** and **Client ID Metadata Document** (CIMD, public client). Create and install the connection. Each person signs in to their own wardrobe account and confirms the closet name. The connection grants permission to add garments. Each access token lasts one hour. ChatGPT can request offline access for rotating refresh tokens.

Attach a photo and ask “Add this hat to my closet.” ChatGPT passes the original file through the native image parameter. It can also pass a generated image when requested. If only a file ID is available, the image card tries to resolve it and offers the conversation file picker. The closet keeps the original and creates a 4:5 catalog view on white. Uniform light backdrops are corrected and ordinary photo backgrounds are preserved. A successful save returns the item ID and private image link. Retrying the same bytes in the same closet returns the existing item.
