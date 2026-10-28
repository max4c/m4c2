import { afterEach, expect, it, vi } from "vitest";
import { lookupFood } from "../../src/lib/fitness/food";
afterEach(() => vi.unstubAllGlobals());
it("scales OFF macros by grams and keeps missing values null", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          code: "12345678",
          product_name: "Yogurt",
          nutriments: {
            "energy-kcal_100g": 90,
            proteins_100g: 10,
            fat_100g: 3,
          },
        },
      }),
    ),
  );
  const r = await lookupFood({
    barcode: "12345678",
    packaged: true,
    portionGrams: 150,
  });
  expect(r.matches[0]).toMatchObject({
    calories: 135,
    protein: 15,
    carbs: null,
    fat: 4.5,
  });
});
it("scales USDA generic foods and preserves attribution", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        foods: [
          {
            fdcId: 123,
            description: "Rice cooked",
            foodNutrients: [
              { nutrientId: 1008, value: 130, unitName: "KCAL" },
              { nutrientId: 1003, value: 2.7, unitName: "G" },
            ],
          },
        ],
      }),
    ),
  );
  const r = await lookupFood(
    { query: "rice cooked", packaged: false, portionGrams: 200 },
    "test",
  );
  expect(r.source).toBe("usda");
  expect(r.matches[0]).toMatchObject({
    calories: 260,
    protein: 5.4,
    carbs: null,
  });
});
it("does not fabricate values without credentials or on provider errors", async () => {
  await expect(
    lookupFood({ query: "rice", packaged: false, portionGrams: 100 }),
  ).rejects.toThrow("USDA_API_KEY");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 429 })),
  );
  await expect(
    lookupFood({ barcode: "12345678", packaged: true, portionGrams: 100 }),
  ).rejects.toThrow("429");
});
