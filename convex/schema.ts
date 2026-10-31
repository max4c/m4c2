import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
const stamp = { date: v.string(), ts: v.number() };
const exercise = v.object({
  name: v.string(),
  sets: v.array(v.object({ w: v.number(), r: v.number() })),
});
const rotation = v.union(
  v.literal("push"),
  v.literal("pull"),
  v.literal("upper"),
  v.literal("legs"),
);
const pe = v.object({
  name: v.string(),
  sets: v.number(),
  repRange: v.optional(v.object({ min: v.number(), max: v.number() })),
  setsMax: v.optional(v.number()),
  restSeconds: v.optional(v.number()),
  restMinSeconds: v.optional(v.number()),
  category: v.optional(
    v.union(
      v.literal("isolation"),
      v.literal("compound"),
      v.literal("power"),
      v.literal("carry"),
    ),
  ),
  progression: v.optional(
    v.union(
      v.literal("double"),
      v.literal("reps"),
      v.literal("quality"),
      v.literal("distance"),
    ),
  ),
  weightIncrement: v.optional(v.number()),
  distanceMetres: v.optional(v.number()),
  perSide: v.optional(v.boolean()),
  superset: v.optional(v.string()),
  aliases: v.optional(v.array(v.string())),
  note: v.optional(v.string()),
  mode: v.union(
    v.literal("weighted"),
    v.literal("bodyweight"),
    v.literal("timed"),
    v.literal("carry"),
  ),
});
export const planFields = {
  program: v.object({
    push: v.array(pe),
    pull: v.array(pe),
    upper: v.array(pe),
    legs: v.array(pe),
  }),
  goals: v.optional(v.array(v.string())),
  rotation: v.optional(v.array(rotation)),
  schedule: v.optional(
    v.array(
      v.object({
        day: v.union(
          v.literal("Mon"),
          v.literal("Tue"),
          v.literal("Wed"),
          v.literal("Thu"),
          v.literal("Fri"),
          v.literal("Sat"),
          v.literal("Sun"),
        ),
        label: v.string(),
        session: v.optional(rotation),
        detail: v.optional(v.string()),
      }),
    ),
  ),
  rules: v.optional(v.array(v.string())),
  rationale: v.string(),
  targets: v.object({
    protein: v.number(),
    calories: v.union(v.number(), v.null()),
    liftsMin: v.number(),
    liftsMax: v.number(),
    movementDays: v.number(),
    setsMin: v.number(),
    setsMax: v.number(),
  }),
  timezone: v.string(),
  bedtimeHour: v.number(),
};
export default defineSchema({
  entryDeletions: defineTable({
    entryId: v.string(),
    table: v.string(),
    date: v.string(),
  }).index("by_entry", ["entryId"]),
  rotationAdvances: defineTable({ date: v.string(), label: v.string() }).index(
    "by_date_label",
    ["date", "label"],
  ),
  loginAttempts: defineTable({
    client: v.string(),
    windowStart: v.number(),
    count: v.number(),
  })
    .index("by_client", ["client"])
    .index("by_window", ["windowStart"]),
  meals: defineTable({
    ...stamp,
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    quality: v.number(),
    note: v.string(),
    source: v.union(v.literal("estimate"), v.literal("off"), v.literal("usda")),
  }).index("by_date", ["date"]),
  workouts: defineTable({
    ...stamp,
    kind: v.union(v.literal("lift"), v.literal("cardio")),
    label: v.string(),
    intensity: v.union(v.literal("easy"), v.literal("hard")),
    exercises: v.array(exercise),
    deload: v.optional(v.boolean()),
    durationMin: v.optional(v.number()),
    distanceMi: v.optional(v.number()),
    distanceMiMax: v.optional(v.number()),
  })
    .index("by_date", ["date"])
    .index("by_ts", ["ts"])
    .index("by_date_ts", ["date", "ts"]),
  weights: defineTable({ ...stamp, lbs: v.number() }).index("by_date", [
    "date",
  ]),
  supplements: defineTable({ ...stamp, items: v.array(v.string()) }).index(
    "by_date",
    ["date"],
  ),
  steps: defineTable({
    date: v.string(),
    ts: v.optional(v.number()),
    count: v.number(),
  }).index("by_date", ["date"]),
  measurements: defineTable({
    ...stamp,
    arm: v.number(),
    shoulders: v.number(),
    chest: v.number(),
    waist: v.number(),
  }).index("by_date", ["date"]),
  photos: defineTable({ ...stamp, r2Key: v.string() }).index("by_date", [
    "date",
  ]),
  state: defineTable({
    lastLift: v.optional(v.object({ date: v.string(), ts: v.number() })),
    rotation: v.object({
      next: rotation,
    }),
    recoveryRemaining: v.number(),
    recoveryDays: v.optional(v.array(rotation)),
  }),
  plan: defineTable(planFields),
  requests: defineTable({
    requestId: v.string(),
    fingerprint: v.string(),
    result: v.any(),
  }).index("by_request", ["requestId"]),
});
