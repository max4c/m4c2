import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { metadataSchema } from "../shared/wardrobe";

import {
  wardrobeWeek,
  wardrobeOwner,
  wardrobeView,
  wardrobeImage,
} from "./wardrobeValidators";
const auth = { token: v.string(), owner: wardrobeOwner };
const fields = {
  name: v.string(),
  category: v.string(),
  color: v.string(),
  material: v.string(),
};
function authorize(actual: string) {
  const expected = process.env.WARDROBE_SERVICE_TOKEN;
  if (!expected || expected.length < 32 || actual.length !== expected.length)
    throw new Error("Unauthorized");
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff) throw new Error("Unauthorized");
}

export const list = query({
  args: { ...auth, includeRetired: v.optional(v.boolean()) },
  handler: async (ctx, { token, owner, includeRetired }) => {
    authorize(token);
    const items = await ctx.db
      .query("wardrobeItems")
      .withIndex("by_owner", (q) => q.eq("owner", owner))
      .collect();
    return items.filter((item) => includeRetired || !item.retirement).map(
      ({
        _id,
        name,
        category,
        color,
        material,
        addedAt,
        updatedAt,
        images,
        retirement,
      }) => ({
        _id,
        name,
        category,
        color,
        material,
        addedAt,
        updatedAt,
        ...(retirement && { retirement }),
        views: images.map((image) => image.view),
      }),
    );
  },
});
export const update = mutation({
  args: {
    ...auth,
    id: v.id("wardrobeItems"),
    fields: v.object(fields),
    retirement: v.optional(v.union(v.null(), v.object({ note: v.string() }))),
    expectedUpdatedAt: v.number(),
  },
  handler: async (ctx, { token, owner, id, fields, retirement, expectedUpdatedAt }) => {
    authorize(token);
    const item = await ctx.db.get(id);
    if (!item || item.owner !== owner) throw new ConvexError("Item not found");
    if (item.updatedAt !== expectedUpdatedAt)
      throw new ConvexError("This item changed. Reload before saving.");
    const metadata = metadataSchema.parse(fields);
    if (retirement && retirement.note.length > 600) throw new ConvexError("Retirement note is too long");
    await ctx.db.patch(id, {
      ...metadata,
      ...(retirement !== undefined && { retirement: retirement ?? undefined }),
      updatedAt: Math.max(Date.now(), item.updatedAt + 1),
    });
    return { ok: true };
  },
});
export const remove = mutation({
  args: { ...auth, id: v.id("wardrobeItems"), expectedUpdatedAt: v.number() },
  handler: async (ctx, { token, owner, id, expectedUpdatedAt }) => {
    authorize(token);
    const item = await ctx.db.get(id);
    if (!item || item.owner !== owner) throw new ConvexError("Item not found");
    if (item.updatedAt !== expectedUpdatedAt)
      throw new ConvexError("This item changed. Reload before deleting.");
    await ctx.db.delete(id);
    const unused = new Set(item.images.map((image) => image.storageId));
    if (unused.size) {
      // Imports may reuse a photo, including in the other closet.
      for await (const other of ctx.db.query("wardrobeItems")) {
        for (const image of other.images) unused.delete(image.storageId);
        if (!unused.size) break;
      }
      for (const storageId of unused) await ctx.storage.delete(storageId);
    }
  },
});
export const image = query({
  args: { ...auth, id: v.id("wardrobeItems"), view: wardrobeView },
  handler: async (ctx, { token, owner, id, view }) => {
    authorize(token);
    const item = await ctx.db.get(id);
    if (!item || item.owner !== owner) return null;
    const image = item.images.find((image) => image.view === view);
    return image ? ctx.storage.getUrl(image.storageId) : null;
  },
});
// Only the trusted import script receives the service credential. Browser routes
// expose metadata edits, never uploads, owner changes, or image replacement.
export const uploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    authorize(token);
    return ctx.storage.generateUploadUrl();
  },
});
export const imported = query({
  args: { ...auth, externalId: v.string() },
  handler: async (ctx, { token, owner, externalId }) => {
    authorize(token);
    const item = await ctx.db
      .query("wardrobeItems")
      .withIndex("by_owner_external", (q) =>
        q.eq("owner", owner).eq("externalId", externalId),
      )
      .unique();
    return item?._id ?? null;
  },
});
export const importItem = mutation({
  args: {
    ...auth,
    externalId: v.string(),
    fields: v.object(fields),
    images: v.array(wardrobeImage),
  },
  handler: async (ctx, { token, owner, externalId, fields, images }) => {
    authorize(token);
    if (!externalId.trim() || externalId.length > 160)
      throw new Error("Invalid import identity");
    if (
      new Set(images.map((image) => image.view)).size !== images.length ||
      images.length > 5
    )
      throw new Error("Duplicate or invalid views");
    for (const image of images) {
      const file = await ctx.db.system.get(image.storageId);
      if (
        !file ||
        !["image/jpeg", "image/png", "image/webp"].includes(
          file.contentType ?? "",
        ) ||
        file.size > 15 * 1024 * 1024
      )
        throw new Error("Invalid image file");
    }
    const metadata = metadataSchema.parse(fields);
    const existing = await ctx.db
      .query("wardrobeItems")
      .withIndex("by_owner_external", (q) =>
        q.eq("owner", owner).eq("externalId", externalId),
      )
      .unique();
    // Retrying a completed import cannot overwrite later user edits.
    if (existing) return { id: existing._id, imported: false };
    // These outer layers share a closet section regardless of fabric.
    // Apply the default at import, so later manual edits are respected.
    if (
      ["Tops", "Shirts", "Jackets & coats", "Activewear", "Other"].includes(metadata.category) &&
      /\b(hoodies?|hoodys?|hooded sweatshirts?|sweatshirts?|cardigans?|sweaters?|ponchos?)\b/i.test(metadata.name) &&
      !/\b(jackets?|coats?|parkas?|raincoats?|windbreakers?|dresses?)\b/i.test(metadata.name)
    ) {
      metadata.category = "Knitwear";
    }
    const now = Date.now();
    return {
      id: await ctx.db.insert("wardrobeItems", {
        ...metadata,
        owner,
        externalId,
        images,
        addedAt: now,
        updatedAt: now,
      }),
      imported: true,
    };
  },
});
export const loginAttempt = mutation({
  args: { token: v.string(), client: v.string() },
  handler: async (ctx, { token, client }) => {
    authorize(token);
    const now = Date.now();
    const row = await ctx.db
      .query("wardrobeLoginAttempts")
      .withIndex("by_client", (q) => q.eq("client", client))
      .unique();
    const stale = await ctx.db
      .query("wardrobeLoginAttempts")
      .withIndex("by_window", (q) => q.lt("windowStart", now - 86400000))
      .take(50);
    for (const old of stale)
      if (old._id !== row?._id) await ctx.db.delete(old._id);
    if (!row)
      await ctx.db.insert("wardrobeLoginAttempts", {
        client,
        count: 1,
        windowStart: now,
      });
    else if (now - row.windowStart >= 900000)
      await ctx.db.patch(row._id, { count: 1, windowStart: now });
    else if (row.count >= 10) return false;
    else await ctx.db.patch(row._id, { count: row.count + 1 });
    return true;
  },
});

// Connection credentials are hashed before they reach Convex. A single
// transaction consumes the code or refresh token and installs its successor.
export const issueConnectionCode = mutation({
  args: {
    ...auth,
    code: v.string(),
    challenge: v.string(),
    resource: v.string(),
    offline: v.boolean(),
  },
  handler: async (ctx, { token, ...grant }) => {
    authorize(token);
    const now = Date.now();
    const expired = await ctx.db
      .query("wardrobeConnections")
      .withIndex("by_expires", (q) => q.lt("expires", now))
      .take(25);
    for (const row of expired) await ctx.db.delete(row._id);
    await ctx.db.insert("wardrobeConnections", {
      ...grant,
      expires: now + 300_000,
    });
  },
});

export const exchangeConnection = mutation({
  args: {
    token: v.string(),
    resource: v.string(),
    presented: v.string(),
    challenge: v.optional(v.string()),
    access: v.string(),
    refresh: v.string(),
  },
  handler: async (ctx, args) => {
    authorize(args.token);
    const query = ctx.db.query("wardrobeConnections");
    const grant =
      args.challenge === undefined
        ? await query
            .withIndex("by_refresh", (q) => q.eq("refresh", args.presented))
            .unique()
        : await query
            .withIndex("by_code", (q) => q.eq("code", args.presented))
            .unique();
    const now = Date.now();
    if (
      !grant ||
      grant.resource !== args.resource ||
      grant.expires <= now ||
      (args.challenge !== undefined && args.challenge !== grant.challenge)
    )
      return null;
    const accessExpires = now + 3600_000;
    await ctx.db.patch(grant._id, {
      code: undefined,
      access: args.access,
      accessExpires,
      refresh: grant.offline ? args.refresh : undefined,
      expires: grant.offline ? now + 30 * 86400_000 : accessExpires,
    });
    return { offline: grant.offline };
  },
});

export const connectedOwner = query({
  args: { token: v.string(), access: v.string(), resource: v.string() },
  handler: async (ctx, { token, access, resource }) => {
    authorize(token);
    const grant = await ctx.db
      .query("wardrobeConnections")
      .withIndex("by_access", (q) => q.eq("access", access))
      .unique();
    return grant &&
      grant.resource === resource &&
      (grant.accessExpires ?? 0) > Date.now()
      ? grant.owner
      : null;
  },
});

export const latestWeek = query({
  args: auth,
  handler: async (ctx, { token, owner }) => {
    authorize(token);
    const week = await ctx.db.query("wardrobeWeeks")
      .withIndex("by_owner_week", q => q.eq("owner", owner)).order("desc").first();
    if (!week) return null;
    const { _id, weekOf, city, forecastIssued, forecastUrl, looks } = week;
    return { _id, weekOf, city, forecastIssued, forecastUrl,
      looks: looks.map(({ title, high, nightLow, weather, why, items }) =>
        ({ title, high, nightLow, weather, why, items })) };
  },
});

export const weeklyImage = query({
  args: { ...auth, id: v.id("wardrobeWeeks"), day: v.number() },
  handler: async (ctx, { token, owner, id, day }) => {
    authorize(token);
    const week = await ctx.db.get(id);
    const look = week?.owner === owner ? week.looks[day] : null;
    return look ? ctx.storage.getUrl(look.image) : null;
  },
});

export const publishWeek = internalMutation({
  args: wardrobeWeek,
  handler: async (ctx, week) => {
    const monday = new Date(week.weekOf + "T12:00:00Z");
    if (!/^\d{4}-\d\d-\d\d$/.test(week.weekOf) || monday.getUTCDay() !== 1 || week.looks.length !== 5)
      throw new Error("A wardrobe week starts on Monday and contains five outfits");
    for (const look of week.looks) {
      const photo = await ctx.db.system.get(look.image);
      if (!photo?.contentType?.startsWith("image/") || !look.items.length)
        throw new Error("Each outfit needs a photo and garments");
      for (const id of look.items) {
        const garment = await ctx.db.get(id);
        if (!garment || garment.owner !== week.owner || garment.retirement)
          throw new Error("Choose garments from the active closet");
      }
    }
    const existing = await ctx.db.query("wardrobeWeeks").withIndex("by_owner_week",
      q => q.eq("owner", week.owner).eq("weekOf", week.weekOf)).unique();
    if (existing) {
      await ctx.db.replace(existing._id, week);
      return existing._id;
    }
    return ctx.db.insert("wardrobeWeeks", week);
  },
});
