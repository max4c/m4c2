import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { addDays, seedPlan } from "../../shared/model";
import { estimateMaintenance } from "../../shared/maintenance";
import { exerciseNameMatches } from "../../shared/exercise-matching";
const modules = import.meta.glob("../../convex/**/*.ts");
const token = "maintenance-service".padEnd(64, "x"),
  readToken = "maintenance-read".padEnd(64, "y");
const start = "2026-10-01",
  end = "2026-10-14";
function fixture(slope = 0) {
  return {
    meals: Array.from({ length: 14 }, (_, i) => ({
      date: addDays(start, i),
      calories: 2500,
    })),
    foodDays: Array.from({ length: 14 }, (_, i) => ({
      date: addDays(start, i),
      complete: true,
    })),
    weights: [0, 2, 4, 7, 9, 13].map((i) => ({
      date: addDays(start, i),
      lbs: 170 + slope * i,
    })),
  };
}
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.stubEnv("DASHBOARD_TOKEN", readToken);
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-01T17:00:00Z"));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
const setup = async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  return t;
};
const meal = (date = start) => ({
  date,
  name: "Breakfast",
  calories: 500,
  protein: 30,
  carbs: 50,
  fat: 15,
  quality: 8,
});
it("estimates stable/gaining/losing trends with the correct sign and transparent low confidence", () => {
  for (const [slope, expected] of [
    [0, 2500],
    [0.5 / 7, 2250],
    [-0.5 / 7, 2750],
  ]) {
    const result = estimateMaintenance(fixture(slope), end, 14);
    expect(result).toMatchObject({
      status: "provisional",
      estimateKcalPerDay: expected,
      confidence: "low",
      averageLoggedKcalPerDay: 2500,
    });
    expect(result.coverage).toMatchObject({
      completeDays: 14,
      consecutiveCompleteDays: 14,
      weighInDays: 6,
      firstWeekWeighInDays: 3,
      lastWeekWeighInDays: 3,
      weightSpanDays: 13,
    });
  }
});
it("never treats missing, partial, or merely high-calorie days as complete or fills their intake with zero", () => {
  const data = fixture();
  expect(estimateMaintenance({ ...data, foodDays: [] }, end, 14)).toMatchObject(
    {
      status: "insufficient_data",
      estimateKcalPerDay: null,
      averageLoggedKcalPerDay: null,
    },
  );
  data.foodDays[6].complete = false;
  const result = estimateMaintenance(data, end, 14);
  expect(result).toMatchObject({
    status: "insufficient_data",
    estimateKcalPerDay: null,
    averageLoggedKcalPerDay: 2500,
  });
  expect(result.coverage.missingOrIncompleteDates).toEqual(["2026-10-07"]);
  expect(result.coverage.consecutiveCompleteDays).toBe(7);
});
it("multiple same-day weigh-ins count once; sparse or clustered weights do not qualify", () => {
  const data = fixture();
  data.weights = Array.from({ length: 20 }, () => ({ date: start, lbs: 170 }));
  const r = estimateMaintenance(data, end, 14);
  expect(r.estimateKcalPerDay).toBeNull();
  expect(r.coverage.weighInDays).toBe(1);
  data.weights = Array.from({ length: 6 }, (_, i) => ({
    date: addDays(start, i),
    lbs: 170,
  }));
  expect(estimateMaintenance(data, end, 14).status).toBe("insufficient_data");
});
it("uses daily medians and robust slopes so one duplicate/outlier does not invent a large calorie adjustment", () => {
  const data = fixture(0.5 / 7);
  data.weights.push({ date: start, lbs: 170 }, { date: start, lbs: 180 });
  data.weights[2].lbs += 10;
  expect(estimateMaintenance(data, end, 14)).toMatchObject({
    status: "provisional",
    estimateKcalPerDay: 2250,
    coverage: { weighInDays: 6 },
  });
});
it("returns no estimate for unusually fast weight changes or impossible implied calories", () => {
  expect(estimateMaintenance(fixture(1), end, 14)).toMatchObject({
    status: "unreliable_trend",
    estimateKcalPerDay: null,
  });
  const data = fixture();
  data.meals.forEach((m) => (m.calories = 0));
  expect(estimateMaintenance(data, end, 14).estimateKcalPerDay).toBeNull();
});
it("uses the most recent eligible complete period, never spans a gap, and reports staleness", () => {
  const data = fixture();
  data.foodDays.push(
    ...Array.from({ length: 5 }, (_, i) => ({
      date: addDays(end, i + 2),
      complete: true,
    })),
  );
  data.meals.push({ date: addDays(end, 2), calories: 9000 });
  const r = estimateMaintenance(data, addDays(end, 8), 28);
  expect(r).toMatchObject({
    estimateKcalPerDay: 2500,
    window: { selectedStart: start, selectedEnd: end, daysSinceSelectedEnd: 8 },
  });
});
it("completion defaults to local today, returns totals, requires explicit zero intake, and can reopen", async () => {
  const t = await setup();
  await expect(
    t.mutation(api.fitness.mark_food_day_complete, { token, input: {} }),
  ).rejects.toThrow("empty log");
  const zero = await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { confirmZeroIntake: true },
  });
  expect(zero).toMatchObject({
    date: "2026-11-01",
    day: { totals: { calories: 0 }, foodLog: { complete: true } },
  });
  const r = await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { complete: false },
  });
  expect(r.day.foodLog.complete).toBe(false);
  const saved = await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: meal(),
  });
  const complete = await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { date: start },
  });
  expect(complete.day.totals.calories).toBe(saved.day.totals.calories);
  expect(
    (
      await t.query(api.fitness.get_summary, {
        token,
        period: "day",
        asOf: start,
      })
    ).day,
  ).toEqual(complete.day);
  await expect(
    t.mutation(api.fitness.mark_food_day_complete, {
      token,
      input: { date: "2026-11-02" },
    }),
  ).rejects.toThrow("Future");
});
it("meal additions, edits, date moves and deletions reopen affected complete days; retries do not re-close them", async () => {
  const t = await setup();
  const saved = await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: meal(),
  });
  const mark = { date: start, requestId: "mark-original-1" };
  await t.mutation(api.fitness.mark_food_day_complete, { token, input: mark });
  const edit = await t.mutation(api.fitness.update_entry, {
    token,
    input: { id: saved.id, fields: { calories: 650 } },
  });
  expect(edit.day.foodLog).toMatchObject({
    complete: false,
    needsReconfirmation: true,
  });
  expect(
    (
      await t.mutation(api.fitness.mark_food_day_complete, {
        token,
        input: mark,
      })
    ).day.foodLog.complete,
  ).toBe(false);
  await expect(
    t.mutation(api.fitness.mark_food_day_complete, {
      token,
      input: { ...mark, complete: false },
    }),
  ).rejects.toThrow("requestId");
  await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { date: start },
  });
  const addition = await t.mutation(api.fitness.log, {
    token,
    operation: "log_meal",
    input: meal(),
  });
  expect(addition.day.foodLog.complete).toBe(false);
  const otherDate = addDays(start, 1);
  await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { date: start },
  });
  await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { date: otherDate, confirmZeroIntake: true },
  });
  const moved = await t.mutation(api.fitness.update_entry, {
    token,
    input: { id: saved.id, fields: { date: otherDate } },
  });
  expect(moved.day.foodLog.complete).toBe(false);
  expect(moved.previousDay?.foodLog.complete).toBe(false);
  await t.mutation(api.fitness.mark_food_day_complete, {
    token,
    input: { date: otherDate },
  });
  const deleted = await t.mutation(api.fitness.delete_entry, {
    token,
    input: { table: "meals", id: saved.id },
  });
  expect(deleted.day.foodLog).toMatchObject({
    complete: false,
    needsReconfirmation: true,
  });
});
it("persistent estimation is read-only, honors timezone/finished days, and get_remaining directs to it", async () => {
  const t = await setup();
  const data = fixture();
  await t.run(async (ctx) => {
    for (const m of data.meals)
      await ctx.db.insert("meals", {
        ...meal(m.date),
        calories: m.calories,
        note: "",
        source: "estimate",
        ts: Date.parse(m.date),
      });
    for (const w of data.weights)
      await ctx.db.insert("weights", { ...w, ts: Date.parse(w.date) });
    for (const f of data.foodDays)
      await ctx.db.insert("foodDays", { ...f, updatedAt: Date.now() });
  });
  const before = await t.query(api.fitness.get_plan, { token });
  expect(
    await t.query(api.fitness.estimate_maintenance, {
      token,
      input: { asOf: end, days: 14 },
    }),
  ).toMatchObject({
    estimateKcalPerDay: 2500,
    targetChanged: false,
    currentCalorieTarget: null,
  });
  expect(await t.query(api.fitness.get_plan, { token })).toEqual(before);
  expect(
    (await t.query(api.fitness.estimate_maintenance, { token, input: {} }))
      .window.end,
  ).toBe("2026-10-31");
  await expect(
    t.query(api.fitness.estimate_maintenance, {
      token,
      input: { asOf: "2026-11-01" },
    }),
  ).rejects.toThrow("finished calendar days");
  const remaining = await t.query(api.fitness.get_remaining, { token });
  expect(remaining.nextAction).toEqual({
    tool: "estimate_maintenance",
    arguments: {},
  });
  expect(remaining.note).toContain("estimate_maintenance");
  expect(remaining.remaining.calories).toBeNull();
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { targets: { calories: 2500 } },
  });
  expect(
    (await t.query(api.fitness.get_remaining, { token })).nextAction,
  ).toBeNull();
  for (const name of [
    "estimate_maintenance",
    "mark_food_day_complete",
  ] as const) {
    if (name === "estimate_maintenance")
      await expect(
        t.query(api.fitness[name], { token: readToken, input: {} }),
      ).rejects.toThrow("Unauthorized");
    else
      await expect(
        t.mutation(api.fitness[name], { token: readToken, input: {} }),
      ).rejects.toThrow("Unauthorized");
  }
});
it("suggests spelling/equipment abbreviations but keeps genuinely different movements unmerged", () => {
  const original = JSON.stringify(seedPlan);
  const result = exerciseNameMatches(
    [
      "Incline dumbbell curls",
      "Preacher curl",
      "standing bicep curl",
      "Pull-ups heavy",
    ],
    seedPlan,
    [
      {
        date: start,
        ts: 1,
        label: "Pull",
        kind: "lift",
        intensity: "hard",
        exercises: [{ name: "Standing biceps curl", sets: [{ w: 30, r: 10 }] }],
      },
    ],
  );
  expect(result[0]).toMatchObject({
    match: "similar",
    canonicalName: null,
    requiresConfirmation: true,
  });
  expect(result[0].suggestions[0].name).toBe("Incline DB curl");
  expect(result[1]).toMatchObject({
    match: "exact",
    canonicalName: "Preacher curl",
    requiresConfirmation: false,
  });
  expect(result[2].suggestions[0].name).toBe("Standing biceps curl");
  expect(result[2].canonicalName).toBeNull();
  expect(result[3].canonicalName).toBeNull();
  expect(result[3].requiresConfirmation).toBe(true);
  expect(JSON.stringify(seedPlan)).toBe(original);
});
it("workout writes return prior names without the just-logged spelling masking suggestions, and preserve saved sets", async () => {
  const t = await setup();
  const input = {
    date: start,
    kind: "lift",
    label: "Pull",
    intensity: "hard",
    exercises: [{ name: "Incline dumbbell curls", sets: [{ w: 30, r: 10 }] }],
  };
  const result = await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input,
  });
  expect(result.exerciseNameMatches?.[0]).toMatchObject({
    loggedName: "Incline dumbbell curls",
    match: "similar",
    requiresConfirmation: true,
  });
  expect(result.exerciseNameMatches?.[0].suggestions[0].name).toBe(
    "Incline DB curl",
  );
  expect(result.entry).toMatchObject({ exercises: input.exercises });
  const corrected = await t.mutation(api.fitness.update_entry, {
    token,
    input: {
      id: result.id,
      fields: {
        exercises: [{ ...input.exercises[0], name: "Incline DB curl" }],
      },
    },
  });
  expect(corrected.exerciseNameMatches?.[0].canonicalName).toBe(
    "Incline DB curl",
  );
});
