import { v } from "convex/values";
import { query, mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireToken } from "./auth";
import {
  savedFoodSchema,
  saveFoodInput,
  foodNameKey,
  barcodeKey,
  defaultConfidence,
  type SavedFood,
} from "../shared/food-model";
import { z } from "zod";
const auth = { token: v.string() };

export const find = query({
  args: {
    ...auth,
    barcode: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { token, barcode, name }) => {
    requireToken(token);
    if (barcode) {
      const matches = await ctx.db
        .query("foods")
        .withIndex("by_barcode", (q) => q.eq("barcode", barcodeKey(barcode)))
        .collect();
      if (matches.length) return matches;
    }
    if (!name) return [];
    const key = foodNameKey(name);
    // Exact canonical names or explicit aliases only; broad searches must not silently choose a variant.
    const foods = await ctx.db.query("foods").collect();
    return foods
      .filter(
        (f) =>
          f.nameKey === key ||
          foodNameKey(`${f.brand} ${f.name}`) === key ||
          f.aliases.some((a) => foodNameKey(a) === key),
      )
      .slice(0, 10);
  },
});

export async function saveFood(
  ctx: MutationCtx,
  raw: SavedFood,
  options: { foodId?: string; externalKey?: string; automatic?: boolean } = {},
) {
  const food = savedFoodSchema.parse(raw);
  if (food.barcode) food.barcode = barcodeKey(food.barcode);
  let id: Id<"foods"> | null = null;
  if (options.foodId) {
    id = ctx.db.normalizeId("foods", options.foodId);
    if (!id || !(await ctx.db.get(id)))
      throw new Error("Library food not found");
  } else {
    const barcodeMatch = food.barcode
      ? await ctx.db
          .query("foods")
          .withIndex("by_barcode", (q) => q.eq("barcode", food.barcode))
          .first()
      : null;
    const externalMatch = options.externalKey
      ? await ctx.db
          .query("foods")
          .withIndex("by_external", (q) =>
            q.eq("externalKey", options.externalKey),
          )
          .first()
      : null;
    // Provider candidates with different IDs must not collapse merely because their names match.
    const nameMatches =
      !options.externalKey && !food.barcode
        ? await ctx.db
            .query("foods")
            .withIndex("by_name", (q) =>
              q.eq("nameKey", foodNameKey(food.name)),
            )
            .collect()
        : [];
    id =
      barcodeMatch?._id ??
      externalMatch?._id ??
      nameMatches.find((f) => foodNameKey(f.brand) === foodNameKey(food.brand))
        ?._id ??
      null;
    if (id && options.automatic) return id; // Never overwrite a user's portion correction on a later lookup.
    if (id)
      throw new Error(
        "Food already saved; supply foodId to explicitly replace it",
      );
  }
  const value = {
    ...food,
    nameKey: foodNameKey(food.name),
    confidence: food.confidence ?? defaultConfidence(food.source),
    updatedAt: Date.now(),
  };
  if (id) {
    const old = await ctx.db.get(id);
    if (food.barcode) {
      const duplicate = await ctx.db
        .query("foods")
        .withIndex("by_barcode", (q) => q.eq("barcode", food.barcode))
        .first();
      if (duplicate && duplicate._id !== id)
        throw new Error("Barcode belongs to another library food");
    }
    await ctx.db.replace(id, {
      ...value,
      ...(old?.externalKey ? { externalKey: old.externalKey } : {}),
    });
    return id;
  }
  return ctx.db.insert("foods", {
    ...value,
    ...(options.externalKey ? { externalKey: options.externalKey } : {}),
  });
}
export const save = mutation({
  args: { ...auth, input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const { foodId, ...food } = saveFoodInput.parse(input);
    const id = await saveFood(ctx, food, { foodId });
    return {
      foodId: id,
      food: await ctx.db.get(id),
      historicalMealsChanged: false,
    };
  },
});
export const cache = mutation({
  args: { ...auth, input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const entries = z
      .array(
        z.object({
          food: savedFoodSchema,
          externalKey: z.string().min(1).max(200),
        }),
      )
      .max(5)
      .parse(input);
    const result = [];
    for (const entry of entries) {
      const id = await saveFood(ctx, entry.food, {
        externalKey: entry.externalKey,
        automatic: true,
      });
      result.push({ externalKey: entry.externalKey, foodId: id });
    }
    return result;
  },
});
