import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { lookupFood } from "../../src/lib/fitness/food";
import { addDays } from "../../shared/model";
const modules = import.meta.glob("../../convex/**/*.ts");
const token = "food-library-service".padEnd(64, "x");
const date = "2026-11-03";
const macros = { calories: 100, protein: 5, carbs: 15, fat: 2 };
const toast = {
  name: "Toast",
  quantity: 2,
  unit: "slice",
  macros,
  source: "label",
};
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-03T20:00:00Z"));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  return t;
}
const log = (t: Awaited<ReturnType<typeof setup>>, input: unknown) =>
  t.mutation(api.fitness.log, { token, operation: "log_meal", input });
const edit = (t: Awaited<ReturnType<typeof setup>>, input: unknown) =>
  t.mutation(api.fitness.update_entry, { token, input });

it("computes item totals, appends once on retry, patches a quantity and removes by stable id", async () => {
  const t = await setup();
  const saved = await log(t, {
    date,
    name: "Breakfast",
    quality: 8,
    calories: 999,
    items: [toast],
  });
  expect(saved.entry).toMatchObject({
    calories: 200,
    protein: 10,
    confidence: "high",
  });
  const id = saved.entry!.items![0].id;
  expect(saved.day.maintenance.stillNeeded.consecutiveCompleteDays).toBe(14);
  await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { date },
  });
  const addition = {
    id: saved.id,
    requestId: "add-egg-001",
    itemChange: {
      action: "add",
      item: {
        name: "Egg",
        quantity: 1,
        macros,
        source: "estimate",
        needsRecheck: true,
      },
    },
  };
  const added = await edit(t, addition);
  const repeated = await edit(t, addition);
  expect(repeated.day.totals.calories).toBe(300);
  expect(repeated.day.foodLog.complete).toBe(false);
  expect(added.day.confidence).toMatchObject({
    highCalories: 200,
    lowCalories: 100,
    lowConfidencePercent: 33.33,
    recheckCalories: 100,
  });
  const changed = await edit(t, {
    id: saved.id,
    itemChange: { action: "replace", id, item: { quantity: 3 } },
  });
  expect(changed.entry!.items![0]).toMatchObject({
    id,
    source: "label",
    unit: "slice",
    quantity: 3,
  });
  expect(changed.day.totals.calories).toBe(400);
  const removed = await edit(t, {
    id: saved.id,
    itemChange: { action: "remove", id },
  });
  expect(removed.day.totals.calories).toBe(100);
  const summary = await t.query(api.fitness.get_summary, {
    token,
    period: "day",
    asOf: date,
  });
  expect(summary.nutrition.confidenceByDay[0]).toMatchObject({
    date,
    lowCalories: 100,
    lowConfidencePercent: 100,
  });
  await expect(
    edit(t, { id: saved.id, fields: { calories: 900 } }),
  ).rejects.toThrow("computed");
  await expect(
    edit(t, { id: saved.id, itemChange: { action: "remove", id: "missing" } }),
  ).rejects.toThrow("not found");
});

it("preserves legacy totals on first append and leaves aggregate-only meals editable", async () => {
  const t = await setup();
  const saved = await log(t, {
    date,
    name: "Old breakfast",
    quality: 7,
    ...macros,
  });
  await edit(t, { id: saved.id, fields: { calories: 150 } });
  const added = await edit(t, {
    id: saved.id,
    itemChange: { action: "add", item: toast },
  });
  expect(added.day.totals.calories).toBe(350);
  expect(added.entry!.items).toHaveLength(2);
  expect(added.entry!.items![0].macros.calories).toBe(150);
  const empty = await edit(t, { id: saved.id, fields: { items: [] } });
  expect(empty.day.totals.calories).toBe(0);
  await expect(
    edit(t, {
      id: saved.id,
      fields: {
        items: [
          { ...toast, id: "same" },
          { ...toast, id: "same" },
        ],
      },
    }),
  ).rejects.toThrow("Duplicate");
});

it("saves confirmed restaurant estimates, reuses aliases offline, edits future servings only", async () => {
  const t = await setup();
  const saved = await log(t, {
    date,
    name: "Lunch",
    quality: 7,
    items: [
      {
        name: "Local Roots Harvest Bowl + steak",
        quantity: 1,
        unit: "bowl",
        macros,
        source: "restaurant",
        estimateConfirmed: true,
      },
    ],
  });
  const foodId = saved.entry!.items![0].foodId!;
  const food = (
    await t.query(api.foods.find, {
      token,
      name: "Local Roots Harvest Bowl + steak",
    })
  )[0];
  expect(food.confidence).toBe("medium");
  await t.mutation(api.foods.save, {
    token,
    input: {
      foodId,
      name: food.name,
      brand: "Local Roots",
      servingSize: "1 bowl",
      unitsPerServing: { count: 1, unit: "bowl" },
      macrosPerServing: { ...macros, calories: 650 },
      source: "restaurant",
      aliases: ["my harvest bowl"],
    },
  });
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const result = await lookupFood(
    { query: "my harvest bowl", count: 0.5, unit: "bowl", packaged: false },
    undefined,
    {
      find: (input) => t.query(api.foods.find, { token, ...input }),
      cache: (input) => t.mutation(api.foods.cache, { token, input }),
    },
  );
  expect(result).toMatchObject({
    status: "ok",
    source: "library",
    matches: [{ calories: 325, confidence: "medium", foodId }],
  });
  expect(fetcher).not.toHaveBeenCalled();
  const rows = await t.query(api.fitness.query_entries, {
    token,
    input: { table: "meals", start: date, end: date },
  });
  expect(rows.page[0]).toMatchObject({
    calories: 100,
    items: [{ macros: { calories: 100 } }],
  });
});

it("caches complete provider candidates once, then finds by barcode without external access", async () => {
  const t = await setup();
  const fetcher = vi.fn(async () =>
    Response.json({
      product: {
        code: "12345678",
        product_name: "Test bread",
        serving_size: "2 slices (50 g)",
        nutriments: {
          "energy-kcal_serving": 100,
          proteins_serving: 5,
          carbohydrates_serving: 15,
          fat_serving: 2,
        },
      },
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  const library = {
    find: (input: { barcode?: string; name?: string }) =>
      t.query(api.foods.find, { token, ...input }),
    cache: (input: unknown) => t.mutation(api.foods.cache, { token, input }),
  };
  const input = {
    barcode: "12345678",
    count: 1,
    unit: "slice",
    packaged: true,
  };
  const first = await lookupFood(input, undefined, library);
  expect(first.matches[0]).toMatchObject({
    calories: 50,
    foodId: expect.any(String),
  });
  const second = await lookupFood(input, undefined, library);
  expect(second.source).toBe("library");
  expect(second.matches[0]).toMatchObject({ calories: 50 });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(await t.run((ctx) => ctx.db.query("foods").collect())).toHaveLength(1);
});

it("shows ready maintenance as a provisional budget and keeps chosen targets authoritative", async () => {
  const t = await setup();
  await t.run(async (ctx) => {
    for (let n = 14; n > 0; n--) {
      const day = addDays(date, -n);
      await ctx.db.insert("meals", {
        date: day,
        ts: 1,
        name: "Complete day",
        calories: 2500,
        protein: 150,
        carbs: 300,
        fat: 80,
        source: "estimate",
        quality: 8,
        note: "",
      });
      await ctx.db.insert("foodDays", {
        date: day,
        complete: true,
        updatedAt: 1,
      });
      await ctx.db.insert("weights", { date: day, ts: 1, lbs: 170 });
    }
  });
  const saved = await log(t, {
    date,
    name: "Breakfast",
    quality: 8,
    items: [toast],
  });
  expect(saved.day).toMatchObject({
    targets: { calories: null },
    calorieBudget: {
      calories: 2500,
      basis: "maintenance_estimate",
      provisional: true,
    },
    remaining: { calories: 2300 },
  });
  expect(saved.day.maintenance).toMatchObject({
    status: "provisional",
    stillNeeded: { consecutiveCompleteDays: 0 },
  });
  const summary = await t.query(api.fitness.get_summary, {
    token,
    period: "week",
    asOf: date,
  });
  expect(summary.calorieBudget.basis).toBe("maintenance_estimate");
  expect(
    (await t.query(api.fitness.get_remaining, { token })).remaining.calories,
  ).toBe(2300);
  expect(
    (await t.query(api.fitness.get_plan, { token })).targets.calories,
  ).toBeNull();
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { targets: { calories: 2200 } },
  });
  expect(await t.query(api.fitness.get_remaining, { token })).toMatchObject({
    calorieBudget: { basis: "target", calories: 2200 },
    remaining: { calories: 2000 },
  });
});

it("preserves historical food snapshots and resets confidence on a new estimate", async () => {
  const t = await setup();
  const { foodId } = await t.mutation(api.foods.save, {
    token,
    input: {
      name: "Bowl",
      servingSize: "1 bowl",
      macrosPerServing: macros,
      source: "restaurant",
    },
  });
  const saved = await log(t, {
    date,
    name: "Lunch",
    quality: 7,
    items: [{ name: "Bowl", quantity: 1, macros, foodId }],
  });
  const id = saved.entry!.items![0].id;
  await t.mutation(api.foods.save, {
    token,
    input: {
      foodId,
      name: "Bowl",
      servingSize: "1 bowl",
      macrosPerServing: macros,
      source: "photo",
    },
  });
  const noted = await edit(t, { id: saved.id, fields: { note: "A note" } });
  expect(noted.entry!.items![0]).toMatchObject({
    source: "restaurant",
    confidence: "medium",
  });
  const estimated = await edit(t, {
    id: saved.id,
    itemChange: {
      action: "replace",
      id,
      item: { macros: { ...macros, calories: 250 } },
    },
  });
  expect(estimated.entry!.items![0]).toMatchObject({
    source: "estimate",
    confidence: "low",
  });
  expect(estimated.day.confidence.lowCalories).toBe(250);
  const old = await log(t, {
    date,
    name: "Label meal",
    quality: 7,
    source: "label",
    ...macros,
  });
  const photo = await edit(t, { id: old.id, fields: { source: "photo" } });
  expect(photo.entry!.confidence).toBe("low");
});

it("preserves USDA serving sizes and equivalent barcodes across provider then library lookups", async () => {
  const t = await setup();
  const fetcher = vi.fn(async (url: string) =>
    url.includes("openfoodfacts")
      ? new Response("", { status: 404 })
      : Response.json({
          foods: [
            {
              fdcId: 20,
              description: "Snack",
              gtinUpc: "00123456789012",
              servingSize: 30,
              servingSizeUnit: "g",
              householdServingFullText: "1 bar",
              foodNutrients: [
                { nutrientId: 1008, value: 400, unitName: "KCAL" },
                { nutrientId: 1003, value: 10, unitName: "G" },
                { nutrientId: 1005, value: 40, unitName: "G" },
                { nutrientId: 1004, value: 20, unitName: "G" },
              ],
            },
          ],
        }),
  );
  vi.stubGlobal("fetch", fetcher);
  const library = {
    find: (input: { barcode?: string; name?: string }) =>
      t.query(api.foods.find, { token, ...input }),
    cache: (input: unknown) => t.mutation(api.foods.cache, { token, input }),
  };
  const input = {
    barcode: "123456789012",
    count: 1,
    unit: "serving",
    packaged: true,
  };
  const first = await lookupFood(input, "test", library);
  const second = await lookupFood(input, "test", library);
  expect(first.matches[0].calories).toBe(120);
  expect(second.matches[0].calories).toBe(120);
  expect(second.source).toBe("library");
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("retains normalized OFF container quantities and never turns a reference basis into a serving", async () => {
  const t = await setup();
  const library = {
    find: (input: { barcode?: string; name?: string }) =>
      t.query(api.foods.find, { token, ...input }),
    cache: (input: unknown) => t.mutation(api.foods.cache, { token, input }),
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          code: "12345678",
          product_name: "Milk",
          product_quantity: 1000,
          product_quantity_unit: "ml",
          nutriments: {
            "energy-kcal_100g": 50,
            proteins_100g: 3,
            carbohydrates_100g: 5,
            fat_100g: 2,
          },
        },
      }),
    ),
  );
  const input = {
    barcode: "12345678",
    count: 0.5,
    unit: "carton",
    packaged: true,
  };
  expect(
    (await lookupFood(input, undefined, library)).matches[0].calories,
  ).toBe(250);
  expect(
    (await lookupFood(input, undefined, library)).matches[0].calories,
  ).toBe(250);
  expect(
    (
      await lookupFood(
        { ...input, count: 1, unit: "serving" },
        undefined,
        library,
      )
    ).matches[0].calories,
  ).toBeNull();
});

it("retains both original package text and normalized package measures in the cache", async () => {
  const t = await setup();
  const library = {
    find: (input: { barcode?: string; name?: string }) =>
      t.query(api.foods.find, { token, ...input }),
    cache: (input: unknown) => t.mutation(api.foods.cache, { token, input }),
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          code: "22222222",
          product_name: "Drink",
          quantity: "16 fl oz",
          product_quantity: 473,
          product_quantity_unit: "ml",
          nutriments: {
            "energy-kcal_100g": 50,
            proteins_100g: 3,
            carbohydrates_100g: 5,
            fat_100g: 2,
          },
        },
      }),
    ),
  );
  const input = {
    barcode: "22222222",
    count: 1,
    unit: "bottle",
    packaged: true,
  };
  expect(
    (await lookupFood(input, undefined, library)).matches[0].calories,
  ).toBe(236.5);
  expect(
    (await lookupFood(input, undefined, library)).matches[0].calories,
  ).toBe(236.5);
  const found = (
    await t.query(api.foods.find, { token, barcode: "22222222" })
  )[0];
  expect(found.packageSize).toBe("16 fl oz");
  expect(found.packageQuantity).toEqual({ value: 473, unit: "ml" });
  await expect(
    t.query(api.foods.find, { token: "wrong", name: "Drink" }),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.foods.save, {
      token: "wrong",
      input: {
        name: "No",
        servingSize: "1 serving",
        macrosPerServing: macros,
        source: "estimate",
      },
    }),
  ).rejects.toThrow();
});
