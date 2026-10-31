import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { planSchema, seedPlan } from "../../shared/model";
import { workoutInput, updateInput } from "../../shared/inputs";
import { toolAnnotations } from "../../shared/tool-annotations";
const modules = import.meta.glob("../../convex/**/*.ts");
const token = "entry-service".padEnd(64, "x"),
  readToken = "entry-read".padEnd(64, "y");
const date = "2026-10-30";
const breakfast = {
  date,
  name: "Breakfast",
  calories: 400,
  protein: 30,
  carbs: 35,
  fat: 15,
  quality: 8,
  note: "home cooked",
  source: "estimate",
};
const setup = async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  return t;
};
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.stubEnv("DASHBOARD_TOKEN", readToken);
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-31T19:00:00Z"));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("adds toast with one patch, retains one breakfast row and returns live targets/totals", async () => {
  const t = await setup();
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { targets: { calories: 2400, protein: 150 } },
  });
  const saved = await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: breakfast,
  });
  const updated = await t.mutation(api.fitness.update_entry, {
    token,
    input: {
      id: saved.id,
      fields: {
        name: "Breakfast + 2 slices toast",
        calories: 560,
        protein: 36,
        carbs: 65,
        fat: 17,
      },
    },
  });
  expect(updated.entry).toMatchObject({
    _id: saved.id,
    name: "Breakfast + 2 slices toast",
    quality: 8,
    note: "home cooked",
    source: "estimate",
    ts: saved.entry?.ts,
  });
  expect(updated.day).toMatchObject({
    date,
    mealEntries: 1,
    totals: { calories: 560, protein: 36, carbs: 65, fat: 17 },
    targets: { calories: 2400, protein: 150, carbs: null, fat: null },
    remaining: { protein: 114, calories: 1840 },
  });
  expect(
    (
      await t.query(api.fitness.get_summary, {
        token,
        period: "day",
        asOf: date,
      })
    ).day,
  ).toEqual(updated.day);
  expect(await t.run((ctx) => ctx.db.query("meals").collect())).toHaveLength(1);
});
it("fresh totals on log/edit/delete retries; an old edit cannot overwrite a later correction", async () => {
  const t = await setup();
  const input = { ...breakfast, requestId: "breakfast-original" };
  const first = await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input,
  });
  const edit = {
    id: first.id,
    fields: { calories: 500 },
    requestId: "breakfast-corrected",
  };
  await t.mutation(api.fitness.update_entry, { token, input: edit });
  await t.mutation(api.fitness.update_entry, {
    token,
    input: { id: first.id, fields: { calories: 600 } },
  });
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: { ...breakfast, name: "Lunch" },
  });
  expect(
    (await t.mutation(api.fitness.log, { token, operation: "log_meal", input }))
      .day.totals.calories,
  ).toBe(1000);
  const retried = await t.mutation(api.fitness.update_entry, {
    token,
    input: edit,
  });
  expect(retried.entry).toMatchObject({ calories: 600 });
  expect(retried.day.totals.calories).toBe(1000);
  await expect(
    t.mutation(api.fitness.update_entry, {
      token,
      input: { ...edit, fields: { calories: 900 } },
    }),
  ).rejects.toThrow("requestId");
  const deleted = await t.mutation(api.fitness.delete_entry, {
    token,
    input: { table: "meals", id: first.id },
  });
  expect(deleted).toMatchObject({
    deleted: true,
    entry: null,
    day: { date, mealEntries: 1, totals: { calories: 400 } },
  });
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: breakfast,
  });
  const deletionRetry = await t.mutation(api.fitness.delete_entry, {
    token,
    input: { table: "meals", id: first.id },
  });
  expect(deletionRetry).toMatchObject({
    deleted: false,
    day: { date, mealEntries: 2, totals: { calories: 800 } },
  });
  expect(
    (await t.mutation(api.fitness.log, { token, operation: "log_meal", input }))
      .day.totals.calories,
  ).toBe(800);
});
it("returns both dates' totals when an entry moves, and rejects wrong-table/protected fields", async () => {
  const t = await setup();
  const saved = await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: { ...breakfast, requestId: "date-moved-original" },
  });
  const r = await t.mutation(api.fitness.update_entry, {
    token,
    input: { id: saved.id, fields: { date: "2026-10-29" } },
  });
  expect(r.day).toMatchObject({
    date: "2026-10-29",
    totals: { calories: 400 },
  });
  expect(r.previousDay).toMatchObject({ date, totals: { calories: 0 } });
  const retry = await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: { ...breakfast, requestId: "date-moved-original" },
  });
  expect(retry.date).toBe("2026-10-29");
  expect(retry.entry?.date).toBe(retry.day.date);
  for (const fields of [
    { count: 5000 },
    { deload: true },
    { _id: "other" },
    { quality: -1 },
    { date: "2026-02-30" },
    {},
  ])
    await expect(
      t.mutation(api.fitness.update_entry, {
        token,
        input: { id: saved.id, fields },
      }),
    ).rejects.toThrow();
  await expect(
    t.mutation(api.fitness.update_entry, {
      token: readToken,
      input: { id: saved.id, fields: { note: "x" } },
    }),
  ).rejects.toThrow("Unauthorized");
  const plan = await t.query(api.fitness.get_plan, { token });
  await expect(
    t.mutation(api.fitness.update_entry, {
      token,
      input: { id: plan._id, fields: { note: "x" } },
    }),
  ).rejects.toThrow("logged entry");
});
it("patches every log table while preserving omitted fields and refusing duplicate steps dates", async () => {
  const t = await setup();
  for (const [operation, input, fields] of [
    ["log_weight", { lbs: 170 }, { lbs: 169 }],
    ["log_supplements", { items: ["creatine"] }, { items: ["creatine", "D3"] }],
    [
      "log_measurements",
      { arm: 14, shoulders: 45, chest: 40, waist: 32 },
      { arm: 14.5 },
    ],
    ["log_steps", { count: 3000 }, { count: 4000 }],
  ] as const) {
    const saved = await t.mutation(api.fitness.log, {
      token,
      operation,
      input: { ...input, date },
    });
    expect(saved.day.date).toBe(date);
    const r = await t.mutation(api.fitness.update_entry, {
      token,
      input: { id: saved.id, fields },
    });
    expect(r.entry).toMatchObject(fields);
    if (operation === "log_steps") {
      await t.mutation(api.fitness.log, {
        token,
        operation,
        input: { date: "2026-10-29", count: 2 },
      });
      await expect(
        t.mutation(api.fitness.update_entry, {
          token,
          input: { id: saved.id, fields: { date: "2026-10-29" } },
        }),
      ).rejects.toThrow("Steps already exist");
    }
  }
  const photo = await t.mutation(api.fitness.add_photo, {
    token,
    date,
    r2Key: "progress/test.jpg",
  });
  expect(
    (
      await t.mutation(api.fitness.update_entry, {
        token,
        input: { id: photo, fields: { date: "2026-10-29" } },
      })
    ).entry,
  ).toMatchObject({ r2Key: "progress/test.jpg", date: "2026-10-29" });
});
it("stores numeric walks/hike ranges, counts fragmented lifts once and leaves unknown durations null", async () => {
  const t = await setup();
  const log = (input: object) =>
    t.mutation(api.fitness.log, {
      token,
      operation: "log_workout",
      input: { date, kind: "cardio", intensity: "easy", ...input },
    });
  const walk = await log({ label: "Walk", durationMin: 50 });
  expect(walk.day.movement).toMatchObject({
    sessions: 1,
    minutes: 50,
    distanceMi: null,
  });
  const hike = await log({ label: "Hike", distanceMi: 3, distanceMiMax: 4 });
  expect(hike.entry).toMatchObject({ distanceMi: 3, distanceMiMax: 4 });
  await log({
    kind: "lift",
    label: "Curls",
    exercises: [{ name: "Curl", sets: [{ w: 20, r: 12 }] }],
  });
  const secondLift = await log({
    kind: "lift",
    label: "Pull",
    exercises: [{ name: "Curl", sets: [{ w: 20, r: 10 }] }],
  });
  expect(secondLift.day.movement).toMatchObject({
    sessions: 3,
    liftDays: 1,
    cardioSessions: 2,
    minutes: 50,
    distanceMi: 3,
    distanceMiMax: 4,
    coverage: { workoutRows: 4, rowsWithDuration: 1 },
  });
  const summary = await t.query(api.fitness.get_summary, {
    token,
    period: "week",
    asOf: date,
  });
  expect(summary.movement).toEqual(secondLift.day.movement);
  expect(summary.training).toMatchObject({
    cardioMinutes: 50,
    cardioDistanceMi: 3,
    cardioDistanceMiMax: 4,
  });
  const cleared = await t.mutation(api.fitness.update_entry, {
    token,
    input: { id: walk.id, fields: { durationMin: null } },
  });
  expect(cleared.day.movement.minutes).toBeNull();
  expect(cleared.entry).not.toHaveProperty("durationMin");
  for (const fields of [
    { durationMin: -1 },
    { distanceMi: 4, distanceMiMax: 3 },
    { distanceMiMax: 4 },
  ])
    expect(
      workoutInput.safeParse({
        label: "Walk",
        kind: "cardio",
        intensity: "easy",
        ...fields,
      }).success,
    ).toBe(false);
  expect(
    updateInput.parse({ id: walk.id, fields: { label: "Walk outdoors" } })
      .fields,
  ).toEqual({ label: "Walk outdoors" });
});
it("workout edits preserve rotation/recovery, exercises, and the once-per-date/label guard", async () => {
  const t = await setup();
  const input = {
    date,
    kind: "lift",
    label: "Push",
    intensity: "hard",
    exercises: [{ name: "Dips", sets: [{ w: 45, r: 10 }] }],
  };
  const saved = await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input,
  });
  const before = await t.run((ctx) => ctx.db.query("state").unique());
  const edited = await t.mutation(api.fitness.update_entry, {
    token,
    input: { id: saved.id, fields: { label: "Pull", durationMin: 55 } },
  });
  expect(edited.entry).toMatchObject({
    exercises: input.exercises,
    deload: false,
    durationMin: 55,
  });
  const after = await t.run((ctx) => ctx.db.query("state").unique());
  expect(after?.rotation).toEqual(before?.rotation);
  expect(after?.recoveryRemaining).toBe(before?.recoveryRemaining);
  expect(
    (
      await t.mutation(api.fitness.log, {
        token,
        operation: "log_workout",
        input: { ...input, label: "Pull" },
      })
    ).rotationAdvanced,
  ).toBe(false);
  expect(
    (
      await t.mutation(api.fitness.log, {
        token,
        operation: "log_workout",
        input,
      })
    ).rotationAdvanced,
  ).toBe(false);
});
it("uses server time and local dates across Pacific midnight, DST, and a timezone change", async () => {
  for (const [instant, expected] of [
    ["2026-10-31T06:59:59Z", "2026-10-30"],
    ["2026-10-31T07:00:00Z", "2026-10-31"],
    ["2026-11-01T08:30:00Z", "2026-11-01"],
    ["2026-11-01T09:30:00Z", "2026-11-01"],
  ]) {
    vi.mocked(Date.now).mockReturnValue(Date.parse(instant));
    const t = await setup();
    const r = await t.mutation(api.fitness.log, {
      token,
      operation: "log_steps",
      input: { count: 1234 },
    });
    expect(r.entry?.date).toBe(expected);
    expect(r.entry?.ts).toBeGreaterThanOrEqual(Date.parse(instant));
    expect(r.entry?.ts).toBeLessThan(Date.parse(instant) + 10);
  }
  vi.mocked(Date.now).mockReturnValue(Date.parse("2026-10-31T06:30:00Z"));
  const t = await setup();
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { timezone: "America/Denver" },
  });
  const r = await t.mutation(api.fitness.log, {
    token,
    operation: "log_weight",
    input: { lbs: 170 },
  });
  expect(r.entry?.date).toBe("2026-10-31");
  expect(r.entry?.ts).toBeGreaterThanOrEqual(Date.now());
  expect(r.entry?.ts).toBeLessThan(Date.now() + 10);
  expect(r.day.timezone).toBe("America/Denver");
  expect(planSchema.parse({ ...seedPlan, timezone: undefined }).timezone).toBe(
    "America/Los_Angeles",
  );
  await expect(
    t.mutation(api.fitness.update_plan, { token, patch: { timezone: "Mars" } }),
  ).rejects.toThrow();
});
it("uses matching non-destructive annotations on all logs and edits; only deletion is destructive", () => {
  const reads = [
    "query_entries",
    "get_summary",
    "get_plan",
    "get_next_session",
    "get_exercise_history",
    "get_remaining",
    "get_sleep",
    "lookup_food",
  ];
  for (const name of reads)
    expect(toolAnnotations(name, true)).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
    });
  for (const name of [
    "log_meal",
    "log_workout",
    "log_weight",
    "log_supplements",
    "log_steps",
    "log_measurements",
    "update_entry",
  ])
    expect(toolAnnotations(name, false)).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
  expect(toolAnnotations("delete_entry", false).destructiveHint).toBe(true);
  expect(toolAnnotations("update_plan", false).destructiveHint).toBe(false);
});
