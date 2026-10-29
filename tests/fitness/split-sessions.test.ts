import { beforeEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { nextSession, summarize } from "../../shared/analytics";
import { exerciseHistory } from "../../shared/exercise-history";
import { seedPlan, type Workout } from "../../shared/model";

const modules = import.meta.glob("../../convex/**/*.ts");
const token = "split-session-service".padEnd(64, "x");
const readToken = "split-session-read".padEnd(64, "y");
const date = "2026-10-28";
const name = "Incline DB curl";
const row = (label: string, ts: number, reps = 12): Workout => ({
  date,
  ts,
  kind: "lift",
  label,
  intensity: "hard",
  exercises: [
    {
      name,
      sets: [
        { w: 20, r: reps },
        { w: 20, r: reps },
      ],
    },
  ],
});
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.stubEnv("DASHBOARD_TOKEN", readToken);
});

it("counts Curls + Pull on one date as one lift and merges all sets for progression and PR volume", () => {
  const workouts = [row("Pull", 2), row("Curls", 1)];
  const summary = summarize(
    { workouts, meals: [], steps: [], weights: [], supplements: [] },
    seedPlan,
    date,
    "week",
  );
  expect(summary.lifts).toBe(1);
  expect(summary.THE_THREE_NUMBERS?.lifts.value).toBe(1);
  expect(summary.movementDays).toBe(1);
  expect(summary.training).toMatchObject({ exerciseCount: 1, sets: 4 });
  const history = exerciseHistory(workouts, name, seedPlan);
  expect(history.sessionCount).toBe(1);
  expect(history.setCount).toBe(4);
  expect(history.bestSession?.volume).toBe(960);
  const plan = {
    ...seedPlan,
    program: {
      ...seedPlan.program,
      pull: [{ name, sets: 4, mode: "weighted" as const }],
    },
  };
  const exercise = nextSession(plan, "pull", workouts, date).exercises[0];
  expect(exercise.last?.sets).toHaveLength(4);
  expect(exercise.aims).toEqual(
    Array.from({ length: 4 }, () => ({ w: 25, r: 8 })),
  );
  expect(
    nextSession(
      plan,
      "pull",
      Array.from({ length: 6 }, (_, i) => row("Pull", i)),
      date,
    ).flags.some((f: string) => f.includes("consecutive")),
  ).toBe(false);
});

it("merges chronologically without mutating rows and excludes deload fragments only from baseline", () => {
  const workouts = [
    { ...row("Pull", 2, 8), deload: true },
    row("Curls", 1, 10),
  ];
  const copy = JSON.stringify(workouts);
  const exercise = nextSession(seedPlan, "pull", workouts, date).exercises.find(
    (e) => e.name === name,
  )!;
  expect(exercise.last?.sets.map((s) => s.r)).toEqual([10, 10, 8, 8]);
  expect(exercise.progressionBaseline?.sets.map((s) => s.r)).toEqual([10, 10]);
  expect(JSON.stringify(workouts)).toBe(copy);
});

it("advances once per date/label even after another label, deletion, and re-log", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  const log = (label: string, ts: number) =>
    t.mutation(api.fitness.log, {
      token,
      operation: "log_workout",
      input: row(label, ts),
    });
  const first = await log("Pull", 1);
  expect(first.rotationAdvanced).toBe(true);
  expect((await log("Upper", 2)).rotationAdvanced).toBe(true);
  expect((await log(" pull ", 3)).rotationAdvanced).toBe(false);
  const state = await t.run((ctx) => ctx.db.query("state").unique());
  expect(state?.rotation.next).toBe("push");
  expect(
    await t.mutation(api.fitness.delete_entry, {
      token,
      input: { table: "workouts", id: first.id },
    }),
  ).toMatchObject({ deleted: true });
  expect((await log("Pull", 4)).rotationAdvanced).toBe(false);
  expect(
    (await t.run((ctx) => ctx.db.query("state").unique()))?.rotation,
  ).toEqual(state?.rotation);
});

it("does not advance a historical backfill after the latest workout is deleted", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  const saved = await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: row("Pull", 2),
  });
  await t.mutation(api.fitness.delete_entry, {
    token,
    input: { table: "workouts", id: saved.id },
  });
  const backfill = await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: { ...row("Push", 1), date: "2026-10-27" },
  });
  expect(backfill.rotationAdvanced).toBe(false);
  expect(
    (await t.run((ctx) => ctx.db.query("state").unique()))?.rotation.next,
  ).toBe("upper");
});

it("keeps late fragments of the final recovery session deloaded", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  await t.run(async (ctx) => {
    const state = (await ctx.db.query("state").unique())!;
    await ctx.db.patch(state._id, {
      recoveryRemaining: 1,
      recoveryDays: ["pull"],
    });
  });
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: row("Pull", 1),
  });
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: row("Curls", 2),
  });
  const workouts = await t.run((ctx) => ctx.db.query("workouts").collect());
  expect(workouts.every((w) => w.deload)).toBe(true);
  const exercise = nextSession(seedPlan, "pull", workouts, date).exercises.find(
    (e) => e.name === name,
  )!;
  expect(exercise.last?.sets).toHaveLength(4);
  expect(exercise.progressionBaseline).toBeNull();
});

it("deletes exactly the queried test row, rejects wrong table and read credentials, and retries safely", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  const entry = await t.mutation(api.fitness.log, {
    token,
    operation: "log_weight",
    input: { date, lbs: 170 },
  });
  const rows = await t.query(api.fitness.query_entries, {
    token,
    input: { table: "weights", start: date, end: date },
  });
  expect(rows.page[0]._id).toBe(entry.id);
  await expect(
    t.mutation(api.fitness.delete_entry, {
      token: readToken,
      input: { table: "weights", id: entry.id },
    }),
  ).rejects.toThrow("Unauthorized");
  await expect(
    t.mutation(api.fitness.delete_entry, {
      token,
      input: { table: "workouts", id: entry.id },
    }),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.fitness.delete_entry, {
      token,
      input: { table: "state", id: entry.id },
    }),
  ).rejects.toThrow();
  expect(
    await t.mutation(api.fitness.delete_entry, {
      token,
      input: { table: "weights", id: entry.id },
    }),
  ).toMatchObject({ deleted: true });
  expect(
    (
      await t.query(api.fitness.query_entries, {
        token,
        input: { table: "weights", start: date, end: date },
      })
    ).page,
  ).toEqual([]);
  expect(
    await t.mutation(api.fitness.delete_entry, {
      token,
      input: { table: "weights", id: entry.id },
    }),
  ).toMatchObject({ deleted: false });
});
