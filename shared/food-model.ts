import { z } from "zod";

export const foodSource = z.enum([
  "estimate",
  "off",
  "usda",
  "label",
  "restaurant",
  "photo",
  "library",
]);
export const confidenceSchema = z.enum(["high", "medium", "low"]);
export const macroFields = {
  calories: z.number().finite().nonnegative().max(20000),
  protein: z.number().finite().nonnegative().max(1000),
  carbs: z.number().finite().nonnegative().max(2000),
  fat: z.number().finite().nonnegative().max(2000),
};
export const macrosSchema = z.object(macroFields).strict();
export type Macros = z.infer<typeof macrosSchema>;
export const foodFields = {
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(200).default(""),
  barcode: z
    .string()
    .regex(/^\d{8,14}$/)
    .optional(),
  servingSize: z.string().trim().min(1).max(200),
  gramsPerServing: z.number().finite().positive().max(10000).optional(),
  millilitresPerServing: z.number().finite().positive().max(10000).optional(),
  unitsPerServing: z
    .object({
      count: z.number().finite().positive().max(10000),
      unit: z.string().trim().min(1).max(40),
    })
    .optional(),
  packageSize: z.string().max(200).optional(),
  packageQuantity: z
    .object({
      value: z.number().finite().positive().max(100000),
      unit: z.enum(["g", "ml"]),
    })
    .optional(),
  servingIsReference: z
    .boolean()
    .default(false)
    .describe(
      "True when this is a 100g/100ml reference basis rather than a known household serving.",
    ),
  macrosPerServing: macrosSchema,
  source: foodSource,
  confidence: confidenceSchema.optional(),
  aliases: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  needsRecheck: z.boolean().default(false),
};
export const savedFoodSchema = z
  .object(foodFields)
  .strict()
  .refine(
    (f) => !(f.gramsPerServing && f.millilitresPerServing),
    "Use mass or volume, not both",
  );
export const saveFoodInput = savedFoodSchema
  .safeExtend({
    foodId: z.string().min(1).optional(),
  })
  .describe(
    "Save a confirmed food or replace an existing library food by foodId. Macros are for ONE stated serving. Existing meal snapshots are unchanged.",
  );
export type SavedFood = z.infer<typeof savedFoodSchema>;
export const mealItemSchema = z
  .object({
    id: z.string().min(1).max(120).optional(),
    name: foodFields.name,
    quantity: z.number().finite().positive().max(10000),
    unit: z.string().trim().min(1).max(100).default("serving"),
    macros: macrosSchema.describe(
      "Macros for ONE unit. The server multiplies by quantity; never put whole-item totals here unless quantity=1.",
    ),
    source: foodSource.default("estimate"),
    foodId: z.string().min(1).optional(),
    confidence: confidenceSchema.optional(),
    needsRecheck: z.boolean().optional(),
    estimateConfirmed: z
      .boolean()
      .optional()
      .describe(
        "True only when the user confirms this estimate; saves it as a reusable food without upgrading confidence.",
      ),
  })
  .strict();
export type MealItem = z.infer<typeof mealItemSchema>;
export const itemChangeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), item: mealItemSchema }),
  z.object({
    action: z.literal("replace"),
    id: z.string().min(1),
    item: mealItemSchema
      .omit({ id: true })
      .partial()
      .extend({
        source: foodSource.optional(),
        unit: z.string().trim().min(1).max(100).optional(),
      })
      .refine((x) => Object.keys(x).length > 0, "Supply item changes"),
  }),
  z.object({ action: z.literal("remove"), id: z.string().min(1) }),
]);
export const roundNutrition = (n: number) => Math.round(n * 100) / 100;
export function defaultConfidence(source?: string): "high" | "medium" | "low" {
  return ["off", "usda", "label"].includes(source ?? "")
    ? "high"
    : source === "restaurant"
      ? "medium"
      : "low";
}
export function sumMealItems(items: MealItem[]): Macros {
  return macrosSchema.parse(
    Object.fromEntries(
      Object.keys(macroFields).map((key) => [
        key,
        roundNutrition(
          items.reduce(
            (n, item) => n + item.quantity * item.macros[key as keyof Macros],
            0,
          ),
        ),
      ]),
    ),
  );
}
export type ConfidenceMeal = {
  date: string;
  calories: number;
  source?: string;
  confidence?: "high" | "medium" | "low";
  needsRecheck?: boolean;
  items?: MealItem[];
};
export function intakeConfidence(meals: ConfidenceMeal[]) {
  const result = {
    highCalories: 0,
    mediumCalories: 0,
    lowCalories: 0,
    recheckCalories: 0,
    totalCalories: 0,
    lowConfidencePercent: 0,
  };
  for (const meal of meals) {
    const items = meal.items ?? [
      {
        calories: meal.calories,
        confidence: meal.confidence ?? defaultConfidence(meal.source),
        needsRecheck: meal.needsRecheck,
      },
    ];
    for (const item of items) {
      const calories =
        "macros" in item ? item.macros.calories * item.quantity : item.calories;
      const confidence =
        item.confidence ??
        defaultConfidence("source" in item ? item.source : meal.source);
      result[`${confidence}Calories`] += calories;
      result.totalCalories += calories;
      if (item.needsRecheck || meal.needsRecheck)
        result.recheckCalories += calories;
    }
  }
  result.lowConfidencePercent = result.totalCalories
    ? (100 * result.lowCalories) / result.totalCalories
    : 0;
  return Object.fromEntries(
    Object.entries(result).map(([k, v]) => [k, roundNutrition(v)]),
  ) as typeof result;
}
export const foodNameKey = (name: string) =>
  name.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");

export const barcodeKey = (barcode: string) => barcode.padStart(14, "0");
