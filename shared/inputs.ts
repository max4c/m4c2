import { z } from "zod";
import {
  dateSchema,
  exerciseSchema,
  nonnegative,
  planExerciseSchema,
  targetsSchema,
} from "./model";
const stamp = {
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
  })
  .refine(
    (w) => w.kind !== "cardio" || w.exercises.length === 0,
    "Cardio exercises must be empty",
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
  date: dateSchema,
  count: z.number().int().min(0).max(200000),
  requestId: stamp.requestId,
});
export const measurementsInput = z.object({
  ...stamp,
  arm: z.number().positive().max(100),
  shoulders: z.number().positive().max(200),
  chest: z.number().positive().max(200),
  waist: z.number().positive().max(200),
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
