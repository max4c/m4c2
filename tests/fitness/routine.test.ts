import { beforeEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { nextSession } from "../../shared/analytics";
import { exerciseHistory } from "../../shared/exercise-history";
import {
  seedPlan,
  planSchema,
  muscle,
  type Plan,
  type Workout,
} from "../../shared/model";
import { octoberRoutine } from "../../shared/routine-october";
import { exerciseAims } from "../../shared/progression";
import { remainingSeconds, restoreTimer } from "../../shared/rest-timer";

const modules = import.meta.glob("../../convex/**/*.ts");
const token = "routine-service".padEnd(64, "x");
const readToken = "routine-read".padEnd(64, "y");
const plan: Plan = { ...seedPlan, ...octoberRoutine };
const date = "2026-10-28";
const workout = (
  name: string,
  reps: number[],
  weight = 20,
  label = "Pull",
): Workout => ({
  date,
  ts: 1,
  kind: "lift",
  intensity: "hard",
  label,
  exercises: [{ name, sets: reps.map((r) => ({ w: weight, r })) }],
});
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.stubEnv("DASHBOARD_TOKEN", readToken);
});

it("persists the full routine, preserves goals/targets and advances Upper → Legs → Push once per day/label", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { goals: ["Stronger abs"], targets: { calories: 2400 } },
  });
  const before = await t.query(api.fitness.get_plan, { token });
  await t.mutation(api.fitness.update_plan, { token, patch: octoberRoutine });
  const saved = await t.query(api.fitness.get_plan, { token });
  expect(saved.program).toEqual(octoberRoutine.program);
  expect(saved.schedule).toEqual(octoberRoutine.schedule);
  expect(saved.rules).toEqual(octoberRoutine.rules);
  expect(saved.targets).toEqual(before.targets);
  expect(saved.goals).toEqual(before.goals);
  const log = (label: string, ts: number) =>
    t.mutation(api.fitness.log, {
      token,
      operation: "log_workout",
      input: { ...workout("Ab wheel", [10], 0, label), ts },
    });
  await log("Upper", 1);
  expect((await t.query(api.fitness.get_next_session, { token })).next).toBe(
    "legs",
  );
  const legs = await log("Legs", 2);
  expect(legs.rotationAdvanced).toBe(true);
  expect((await t.query(api.fitness.get_next_session, { token })).next).toBe(
    "push",
  );
  expect((await log("legs", 3)).rotationAdvanced).toBe(false);
  await t.mutation(api.fitness.delete_entry, {
    token,
    input: { table: "workouts", id: legs.id },
  });
  expect((await log("Legs", 4)).rotationAdvanced).toBe(false);
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: {
      date,
      kind: "cardio",
      label: "HIIT",
      intensity: "hard",
      exercises: [],
    },
  });
  expect(
    (await t.query(api.fitness.dashboard, { token: readToken })).nextSession
      .next,
  ).toBe("push");
});

it("uses 12–20 for raises, keeps aliases together and never invents an equipment increment", () => {
  const w = workout("Lateral raises", [20, 20, 20], 15);
  const result = nextSession(plan, "push", [w], date).exercises[1];
  expect(result.last?.sets).toHaveLength(3);
  expect(result.aims).toEqual([
    { w: null, r: 12 },
    { w: null, r: 12 },
    { w: null, r: 12 },
  ]);
  expect(result.loadInstruction).toContain("smallest available increment");
  expect(exerciseHistory([w], "Lateral raise", plan).sessionCount).toBe(1);
  const known = { ...plan.program.push[1], weightIncrement: 2.5 };
  expect(exerciseAims(known, result.last, false).aims[0]).toEqual({
    w: 17.5,
    r: 12,
  });
  expect(exerciseAims(known, result.last, true).aims[0].w).toBe(13.5);
});

it("requires all work sets at the exercise maximum and merges same-date fragments including aliases", () => {
  const a = workout("Lateral raises", [20, 20], 15);
  const b = { ...workout("Lateral raise", [19], 15), ts: 2 };
  const result = nextSession(plan, "push", [a, b], date).exercises[1];
  expect(result.last?.sets.map((s) => s.r)).toEqual([20, 20, 19]);
  expect(result.aims.map((s) => s.w)).toEqual([15, 15, 15]);
  expect(result.aims.map((s) => s.r)).toEqual([20, 20, 20]);
  expect(exerciseHistory([a, b], "Lateral raises", plan).sessions).toHaveLength(
    1,
  );
});

it("keeps heavy pull-ups separate, adds weight only at the rep cap and does not auto-load abs or jumps", () => {
  const rows = [workout("Pull-ups", [12, 12, 12], 0)];
  const upper = nextSession(plan, "upper", rows, date).exercises;
  expect(upper[4].last).toBeNull();
  expect(upper[4].aims).toEqual([
    { w: null, r: 4 },
    { w: null, r: 4 },
  ]);
  const pull = nextSession(plan, "pull", rows, date).exercises[2];
  expect(pull.loadInstruction).toBeTruthy();
  const abs = exerciseAims(
    plan.program.upper[5],
    { date, sets: [{ w: 0, r: 15 }] },
    false,
  );
  expect(abs.aims[0]).toEqual({ w: 0, r: 15 });
  const legs = nextSession(plan, "legs", [], date);
  expect(legs.exercises[0].aims[0]).toEqual({ w: 0, r: 3 });
  expect(legs.exercises[6].aims[0]).toEqual({ w: null, r: 40 });
  expect(legs.flags.some((f) => f.startsWith("Legs block"))).toBe(false);
});

it("rejects inverted rep/rest/set bounds and duplicate rotation days", () => {
  for (const patch of [
    { repRange: { min: 20, max: 12 } },
    { setsMax: 1 },
    { restMinSeconds: 150 },
  ]) {
    expect(() =>
      planSchema.parse({
        ...plan,
        program: {
          ...plan.program,
          push: [{ ...plan.program.push[0], ...patch }],
        },
      }),
    ).toThrow();
  }
  expect(() =>
    planSchema.parse({ ...plan, rotation: ["push", "push"] }),
  ).toThrow();
  expect(muscle("Chest-supported row")).toBe("back");
  expect(muscle("Hanging leg raise")).toBe("abs");
});

it("rest countdown catches up after suspension and restores safely after reload", () => {
  expect(remainingSeconds(90_000, 0)).toBe(90);
  expect(remainingSeconds(90_000, 72_100)).toBe(18);
  expect(remainingSeconds(90_000, 150_000)).toBe(0);
  expect(
    restoreTimer(JSON.stringify({ label: "Curl", endsAt: 90_000 }), 60_000),
  ).toEqual({ label: "Curl", endsAt: 90_000 });
  expect(restoreTimer("broken", 0)).toBeNull();
  expect(
    restoreTimer(JSON.stringify({ label: "Curl", endsAt: 10_000_000 }), 0),
  ).toBeNull();
  expect(
    restoreTimer(JSON.stringify({ label: "Curl", endsAt: 0 }), 700_000),
  ).toBeNull();
});

it("adjusts an old load instead of prescribing reps below a new range", () => {
  const result = nextSession(
    plan,
    "push",
    [workout("Lateral raises", [8, 8, 8], 20)],
    date,
  ).exercises[1];
  expect(result.aims).toEqual(
    Array.from({ length: 3 }, () => ({ w: null, r: 12 })),
  );
  expect(result.loadInstruction).toContain("lighter load");
});

it("reconciles pending recovery when a rotation day is removed", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  await t.mutation(api.fitness.update_plan, { token, patch: octoberRoutine });
  await t.run(async (ctx) => {
    const state = (await ctx.db.query("state").unique())!;
    await ctx.db.patch(state._id, {
      rotation: { next: "legs" },
      recoveryDays: ["upper", "legs"],
      recoveryRemaining: 2,
    });
  });
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { rotation: ["push", "pull"] },
  });
  const state = await t.run((ctx) => ctx.db.query("state").unique());
  expect(state?.rotation.next).toBe("push");
  expect(state?.recoveryRemaining).toBe(0);
  expect(state?.recoveryDays).toEqual([]);
});
