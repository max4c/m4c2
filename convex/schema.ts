import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
const stamp = { date: v.string(), ts: v.number() };
const loadConvention = v.union(
  v.literal("total"),
  v.literal("platesOnly"),
  v.literal("perDumbbell"),
  v.literal("addedToBodyweight"),
);
const exercise = v.object({
  name: v.string(),
  sets: v.array(
    v.object({
      w: v.number(),
      r: v.number(),
      rir: v.optional(v.number()),
      effort: v.optional(v.union(v.literal("easy"), v.literal("atLimit"))),
      note: v.optional(v.string()),
      loggedAt: v.optional(v.number()),
    }),
  ),
  replaces: v.optional(v.string()),
  loadConvention: v.optional(loadConvention),
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
  easyWeightIncrementMax: v.optional(v.number()),
  loadConvention: v.optional(loadConvention),
  station: v.optional(v.string()),
  backup: v.optional(
    v.object({
      name: v.string(),
      station: v.string(),
      mode: v.union(
        v.literal("weighted"),
        v.literal("bodyweight"),
        v.literal("timed"),
        v.literal("carry"),
      ),
      loadConvention,
      note: v.optional(v.string()),
    }),
  ),
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
  voiceSessions: defineTable({
    date: v.string(),
    label: rotation,
    workoutId: v.optional(v.id("workouts")),
    exercises: v.array(
      v.object({
        prescription: pe,
        aims: v.array(
          v.object({
            w: v.union(v.number(), v.null()),
            r: v.union(v.number(), v.null()),
            wMax: v.optional(v.number()),
          }),
        ),
        replaces: v.optional(v.string()),
        loadInstruction: v.union(v.string(), v.null()),
      }),
    ),
    notes: v.array(v.object({ name: v.string(), note: v.string() })),
    startedAt: v.number(),
    lastSetAt: v.optional(v.number()),
    lastExercise: v.optional(v.string()),
    lastSetKey: v.optional(v.string()),
  }).index("by_date", ["date"]),
  exerciseNotes: defineTable({
    name: v.string(),
    note: v.string(),
    createdDate: v.string(),
    createdAt: v.number(),
    usedDate: v.optional(v.string()),
  }).index("by_name", ["name"]),
  foodDays: defineTable({
    date: v.string(),
    complete: v.boolean(),
    updatedAt: v.number(),
    invalidatedAt: v.optional(v.number()),
  }).index("by_date", ["date"]),
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
  restDevices: defineTable({
    deviceId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    endsAt: v.optional(v.number()),
    version: v.optional(v.string()),
    scheduledId: v.optional(v.id("_scheduled_functions")),
    updatedAt: v.number(),
  }).index("by_device", ["deviceId"]),
  requests: defineTable({
    requestId: v.string(),
    fingerprint: v.string(),
    result: v.any(),
  }).index("by_request", ["requestId"]),
});
