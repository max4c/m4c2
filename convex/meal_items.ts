import { mealInput } from "../shared/inputs";
import {
  defaultConfidence,
  macrosSchema,
  mealItemSchema,
  sumMealItems,
  type MealItem,
  type Macros,
} from "../shared/food-model";
import { saveFood } from "./foods";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { z } from "zod";

export async function prepareMeal(
  ctx: MutationCtx,
  raw: z.infer<typeof mealInput>,
  previous?: Doc<"meals">,
) {
  const p = mealInput.parse(raw);
  let items = p.items;
  if (items) {
    items = [];
    const seen = new Set<string>();
    for (const original of p.items!) {
      const item: MealItem = {
        ...original,
        id: original.id ?? crypto.randomUUID(),
      };
      if (seen.has(item.id!)) throw new Error("Duplicate meal item id");
      seen.add(item.id!);
      const priorItem = previous?.items?.find((i) => i.id === item.id);
      if (item.foodId && item.foodId !== priorItem?.foodId) {
        const id = ctx.db.normalizeId("foods", item.foodId);
        const food = id ? await ctx.db.get(id) : null;
        if (!food) throw new Error("Library food not found");
        const matches = Object.keys(food.macrosPerServing).every(
          (k) =>
            item.macros[k as keyof Macros] ===
            food.macrosPerServing[k as keyof Macros],
        );
        if (matches) {
          item.source = food.source as MealItem["source"];
          item.confidence ??= food.confidence;
          item.needsRecheck ??= food.needsRecheck;
        } else if (item.confidence === undefined) {
          item.source = "estimate";
          item.confidence = "low";
        }
      }
      item.confidence ??= defaultConfidence(item.source);
      if (item.estimateConfirmed && !item.foodId) {
        item.foodId = await saveFood(
          ctx,
          {
            name: item.name,
            brand: "",
            servingSize: `1 ${item.unit}`,
            unitsPerServing: { count: 1, unit: item.unit },
            macrosPerServing: item.macros,
            source: item.source,
            confidence: item.confidence,
            aliases: [],
            servingIsReference: false,
            needsRecheck: item.needsRecheck ?? false,
          },
          { automatic: true },
        );
      }
      items.push(item);
    }
  }
  const totals = items
    ? sumMealItems(items)
    : macrosSchema.parse({
        calories: p.calories,
        protein: p.protein,
        carbs: p.carbs,
        fat: p.fat,
      });
  const confidence = items?.length
    ? items.some((i) => i.confidence === "low")
      ? "low"
      : items.some((i) => i.confidence === "medium")
        ? "medium"
        : "high"
    : (p.confidence ?? defaultConfidence(p.source));
  if (!items && p.estimateConfirmed) {
    await saveFood(
      ctx,
      {
        name: p.name,
        brand: "",
        servingSize: "1 meal",
        unitsPerServing: { count: 1, unit: "meal" },
        macrosPerServing: totals,
        source: p.source,
        confidence,
        aliases: [],
        servingIsReference: false,
        needsRecheck: p.needsRecheck ?? false,
      },
      { automatic: true },
    );
  }
  const { requestId: _, items: _items, ...fields } = p;
  return {
    ...fields,
    ...totals,
    confidence,
    ...(items
      ? {
          items: items.map((item) => ({
            ...item,
            id: item.id!,
            confidence: item.confidence!,
            foodId: item.foodId
              ? ctx.db.normalizeId("foods", item.foodId)!
              : undefined,
          })),
        }
      : {}),
  };
}

export function existingItems(meal: Doc<"meals">): MealItem[] {
  if (meal.items) return meal.items as MealItem[];
  // Preserve an aggregate legacy meal as a single item when appending the first new food.
  return [
    mealItemSchema.parse({
      id: crypto.randomUUID(),
      name: meal.name,
      quantity: 1,
      macros: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
      source: meal.source,
      confidence: meal.confidence ?? defaultConfidence(meal.source),
      needsRecheck: meal.needsRecheck,
    }),
  ];
}
