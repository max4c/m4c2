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
it("resolves 5 pieces and fractions from explicit serving labels and exposes label data", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          product_name: "Bites",
          serving_size: "2 pieces (30 g)",
          serving_quantity: 30,
          serving_quantity_unit: "g",
          nutriments: { "energy-kcal_100g": 400, proteins_100g: 10 },
        },
      }),
    ),
  );
  const r = await lookupFood({
    query: "bites",
    packaged: true,
    count: 5,
    unit: "pieces",
  });
  expect(r.matches[0]).toMatchObject({
    servingSize: "2 pieces (30 g)",
    gramsPerServing: 30,
    caloriesPerPiece: 60,
    portion: { grams: 75, servings: 2.5, resolved: true },
    calories: 300,
    protein: 7.5,
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          serving_size: "1/2 cup (100 g)",
          nutriments: { "energy-kcal_100g": 80 },
        },
      }),
    ),
  );
  expect(
    (
      await lookupFood({
        query: "yogurt",
        packaged: true,
        count: 1,
        unit: "cup",
      })
    ).matches[0].calories,
  ).toBe(160);
});
it("resolves half a carton using package mass or volume without pretending ml are grams", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          serving_size: "250 ml",
          serving_quantity: 250,
          serving_quantity_unit: "ml",
          quantity: "1 L",
          product_quantity: 1000,
          product_quantity_unit: "ml",
          nutriments: { "energy-kcal_100g": 45, proteins_100g: 3 },
        },
      }),
    ),
  );
  const r = await lookupFood({
    query: "milk",
    packaged: true,
    count: 0.5,
    unit: "carton",
  });
  expect(r.matches[0]).toMatchObject({
    gramsPerServing: null,
    millilitresPerServing: 250,
    portion: { grams: null, millilitres: 500, servings: 2, resolved: true },
    calories: 225,
    protein: 15,
  });
  expect(
    (await lookupFood({ query: "milk", packaged: true, portionGrams: 500 }))
      .matches[0],
  ).toMatchObject({ portion: { resolved: false }, calories: null });
});
it("does not invent piece weights or multipack container sizes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          serving_size: "30g",
          serving_quantity: 30,
          quantity: "6 x 30g",
          product_quantity: 180,
          product_quantity_unit: "g",
          nutriments: { "energy-kcal_100g": 400 },
        },
      }),
    ),
  );
  for (const unit of ["pieces", "carton"]) {
    expect(
      (await lookupFood({ query: "snack", packaged: true, count: 0.5, unit }))
        .matches[0],
    ).toMatchObject({
      portion: { resolved: false, grams: null },
      calories: null,
    });
  }
});
it("flags calorie-per-piece differences between frozen and freeze-dried variants", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        products: [
          {
            product_name: "Frozen berries",
            serving_size: "5 pieces (50 g)",
            nutriments: { "energy-kcal_100g": 40 },
          },
          {
            product_name: "Freeze-dried berries",
            serving_size: "5 pieces (10 g)",
            nutriments: { "energy-kcal_100g": 400 },
          },
        ],
      }),
    ),
  );
  const r = await lookupFood({
    query: "berries",
    packaged: true,
    count: 5,
    unit: "pieces",
  });
  expect(r.matches.map((x) => x.calories)).toEqual([20, 40]);
  expect(r.warnings.some((x) => x.includes("twofold"))).toBe(true);
});
it("accepts only one complete portion form and leaves unverified USDA household macros null", async () => {
  await expect(
    lookupFood({ query: "rice", packaged: false, count: 1 }),
  ).rejects.toThrow("count and unit");
  await expect(
    lookupFood({
      query: "rice",
      packaged: false,
      count: 1,
      unit: "cup",
      portionGrams: 100,
    }),
  ).rejects.toThrow("either portionGrams");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        foods: [
          {
            fdcId: 123,
            description: "Rice",
            foodNutrients: [{ nutrientId: 1008, value: 130, unitName: "KCAL" }],
          },
        ],
      }),
    ),
  );
  const r = await lookupFood(
    { query: "rice", packaged: false, count: 1, unit: "cup" },
    "test",
  );
  expect(r.matches[0]).toMatchObject({
    calories: null,
    portionResolved: false,
  });
  expect(r.warnings[0]).toContain("Supply grams");
});
it("handles mixed fractions and decimal commas without consuming numeric suffixes", async () => {
  for (const serving_size of ["1 1/2 cups (60 g)", "1½ cups (60 g)"]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          product: { serving_size, nutriments: { "energy-kcal_serving": 240 } },
        }),
      ),
    );
    expect(
      (
        await lookupFood({
          query: "oats",
          packaged: true,
          count: 1,
          unit: "cup",
        })
      ).matches[0],
    ).toMatchObject({ calories: 160, portion: { grams: 40 } });
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: { quantity: "1,5 l", nutriments: { "energy-kcal_100g": 40 } },
      }),
    ),
  );
  expect(
    (
      await lookupFood({
        query: "milk",
        packaged: true,
        count: 0.5,
        unit: "carton",
      })
    ).matches[0],
  ).toMatchObject({
    calories: 300,
    portion: { millilitres: 750, grams: null },
  });
});
it("rejects conflicting package/serving units instead of scaling volume as mass", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: {
          quantity: "1 l",
          serving_size: "100 g",
          nutriments: { "energy-kcal_100g": 100 },
        },
      }),
    ),
  );
  expect(
    (
      await lookupFood({
        query: "food",
        packaged: true,
        count: 1,
        unit: "carton",
      })
    ).matches[0],
  ).toMatchObject({ calories: null, portion: { resolved: false } });
});
it("leaves ambiguous ranges, leading decimals and named multipacks unresolved", async () => {
  for (const quantity of [
    ".5 l",
    "30-40 g",
    "6 bottles of 250 ml",
    "pack of 6",
  ]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          product: {
            quantity,
            ...(quantity.includes("bottles")
              ? { product_quantity: 1500, product_quantity_unit: "ml" }
              : {}),
            nutriments: { "energy-kcal_100g": 40 },
          },
        }),
      ),
    );
    expect(
      (
        await lookupFood({
          query: "drink",
          packaged: true,
          count: 1,
          unit: "bottle",
        })
      ).matches[0],
    ).toMatchObject({ calories: null, portion: { resolved: false } });
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        product: { quantity: "1/2 l", nutriments: { "energy-kcal_100g": 40 } },
      }),
    ),
  );
  expect(
    (
      await lookupFood({
        query: "drink",
        packaged: true,
        count: 1,
        unit: "bottle",
      })
    ).matches[0],
  ).toMatchObject({ calories: 200, portion: { millilitres: 500 } });
});
it("rejects larger multipacks and incomplete numeric tokens", async () => {
  for (const quantity of [
    "pack of 12",
    "pack of 100",
    "1 500 g",
    "30 to 40 g",
  ]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          product: {
            quantity,
            ...(quantity.startsWith("pack")
              ? { product_quantity: 3960, product_quantity_unit: "ml" }
              : {}),
            nutriments: { "energy-kcal_100g": 40 },
          },
        }),
      ),
    );
    expect(
      (
        await lookupFood({
          query: "food",
          packaged: true,
          count: 1,
          unit: "bottle",
        })
      ).matches[0],
    ).toMatchObject({ calories: null, portion: { resolved: false } });
  }
});
it("does not collapse household count ranges or incomplete tokens into exact piece counts", async () => {
  for (const serving_size of [
    "2 to 3 pieces (30 g)",
    "2—3 pieces (30 g)",
    "1 500 pieces (30 g)",
  ]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          product: { serving_size, nutriments: { "energy-kcal_serving": 120 } },
        }),
      ),
    );
    expect(
      (
        await lookupFood({
          query: "food",
          packaged: true,
          count: 1,
          unit: "piece",
        })
      ).matches[0],
    ).toMatchObject({ calories: null, portion: { resolved: false } });
  }
});
