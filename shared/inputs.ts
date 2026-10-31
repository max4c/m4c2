import { z } from "zod";
import {
  dateSchema,
  exerciseSchema,
  nonnegative,
  planExerciseSchema,
  targetsSchema,
  rotationOrderSchema,
  scheduleSchema,
  rulesSchema,
} from "./model";
export const stampFields = {
  date: dateSchema.optional(),
  ts: z.number().int().nonnegative().optional(),
  requestId: z
    .string()
    .min(8)
    .max(120)
    .optional()
    .describe(
      "Stable unique ID for retries of this same log; reuse only for identical content.",
    ),
};
const stamp = stampFields;
export const loggedTables = [
  "meals",
  "workouts",
  "weights",
  "supplements",
  "steps",
  "measurements",
  "photos",
] as const;
export const deleteInput = z.object({
  table: z.enum([
    "meals",
    "workouts",
    "weights",
    "supplements",
    "steps",
    "measurements",
    "photos",
  ]),
  id: z.string().min(1),
});
export const mealInput = z.object({
  ...stamp,
  name: z.string().trim().min(1).max(200),
  calories: nonnegative.max(20000),
  protein: nonnegative.max(1000),
  carbs: nonnegative.max(2000),
  fat: nonnegative.max(2000),
  quality: z.number().int().min(1).max(10),
  note: z.string().max(4000).default(""),
  source: z.enum(["estimate", "off", "usda"]).default("estimate"),
});
export const workoutInput = z
  .object({
    ...stamp,
    label: z.string().trim().min(1).max(100),
    kind: z.enum(["lift", "cardio"]),
    intensity: z.enum(["easy", "hard"]),
    exercises: z.array(exerciseSchema).max(50).default([]),
    durationMin: nonnegative
      .max(1440)
      .optional()
      .describe(
        "Minutes for this row only. Do not repeat a whole-session duration on each live-log fragment.",
      ),
    distanceMi: nonnegative
      .max(1000)
      .optional()
      .describe(
        "Miles: exact distance or the lower bound of a reported range.",
      ),
    distanceMiMax: nonnegative
      .max(1000)
      .optional()
      .describe(
        "Upper bound when the user reported a range; e.g. 3–4 miles uses distanceMi=3 and distanceMiMax=4.",
      ),
  })
  .refine(
    (w) => w.kind !== "cardio" || w.exercises.length === 0,
    "Cardio exercises must be empty",
  )
  .refine(
    (w) =>
      w.distanceMiMax === undefined ||
      (w.distanceMi !== undefined && w.distanceMiMax >= w.distanceMi),
    "Distance upper bound requires a lower bound and must not be smaller",
  );
export const weightInput = z.object({
  ...stamp,
  lbs: z.number().finite().positive().max(1500),
});
export const supplementsInput = z.object({
  ...stamp,
  items: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
});
export const stepsInput = z.object({
  ...stamp,
  count: z.number().int().min(0).max(200000),
});
export const photoInput = z.object({
  ...stamp,
  r2Key: z.string().regex(/^progress\/[\w/-]+\.(jpg|png|webp)$/),
});
export const measurementsInput = z.object({
  ...stamp,
  arm: z.number().positive().max(100),
  shoulders: z.number().positive().max(200),
  chest: z.number().positive().max(200),
  waist: z.number().positive().max(200),
});
export const entrySchemas = {
  meals: mealInput,
  workouts: workoutInput,
  weights: weightInput,
  supplements: supplementsInput,
  steps: stepsInput,
  measurements: measurementsInput,
  photos: photoInput,
};
const editFields = z
  .object({
    date: dateSchema.optional(),
    ts: stamp.ts,
    name: mealInput.shape.name.optional(),
    calories: mealInput.shape.calories.optional(),
    protein: mealInput.shape.protein.optional(),
    carbs: mealInput.shape.carbs.optional(),
    fat: mealInput.shape.fat.optional(),
    quality: mealInput.shape.quality.optional(),
    note: z.string().max(4000).optional(),
    source: z.enum(["estimate", "off", "usda"]).optional(),
    label: workoutInput.shape.label.optional(),
    kind: workoutInput.shape.kind.optional(),
    intensity: workoutInput.shape.intensity.optional(),
    exercises: z.array(exerciseSchema).max(50).optional(),
    durationMin: nonnegative.max(1440).nullable().optional(),
    distanceMi: nonnegative.max(1000).nullable().optional(),
    distanceMiMax: nonnegative.max(1000).nullable().optional(),
    lbs: weightInput.shape.lbs.optional(),
    items: supplementsInput.shape.items.optional(),
    count: stepsInput.shape.count.optional(),
    arm: measurementsInput.shape.arm.optional(),
    shoulders: measurementsInput.shape.shoulders.optional(),
    chest: measurementsInput.shape.chest.optional(),
    waist: measurementsInput.shape.waist.optional(),
    r2Key: photoInput.shape.r2Key.optional(),
  })
  .strict()
  .refine(
    (p) => Object.keys(p).length > 0,
    "Supply at least one field to update",
  );
export const updateInput = z.object({
  id: z.string().min(1),
  fields: editFields.describe(
    "Only changed fields, with absolute replacement values; omitted fields are preserved. null clears optional duration/distance only.",
  ),
  requestId: stamp.requestId,
});
export const planPatch = z.object({
  program: z
    .object({
      push: z.array(planExerciseSchema).min(1).optional(),
      pull: z.array(planExerciseSchema).min(1).optional(),
      upper: z.array(planExerciseSchema).min(1).optional(),
      legs: z.array(planExerciseSchema).min(1).optional(),
    })
    .optional(),
  targets: targetsSchema.partial().optional(),
  goals: z.array(z.string().min(1).max(500)).max(10).optional(),
  rotation: rotationOrderSchema.optional(),
  schedule: scheduleSchema.optional(),
  rules: rulesSchema.optional(),
  rationale: z.string().min(1).max(10000).optional(),
  timezone: z.string().optional(),
  bedtimeHour: z.number().int().min(0).max(23).optional(),
});
export const queryInput = z
  .object({
    table: z.enum([
      "meals",
      "workouts",
      "weights",
      "supplements",
      "steps",
      "measurements",
      "photos",
    ]),
    start: dateSchema,
    end: dateSchema,
    filters: z
      .object({
        label: z.string().optional(),
        kind: z.enum(["lift", "cardio"]).optional(),
        intensity: z.enum(["easy", "hard"]).optional(),
        source: z.enum(["estimate", "off", "usda"]).optional(),
        name: z.string().optional(),
      })
      .default({}),
    limit: z.number().int().min(1).max(500).default(100),
    cursor: z.string().nullable().optional(),
  })
  .refine((x) => x.start <= x.end, "start must precede end");
