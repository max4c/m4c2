import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { seedPlan, type PlanExercise, type Workout } from "../../shared/model";
import { nextSession } from "../../shared/analytics";
import { sessionView } from "../../shared/voice-session";
const modules = import.meta.glob("../../convex/**/*.ts");
const token = "voice-test".padEnd(64, "x"),
  readToken = "voice-read".padEnd(64, "y");
const p = (name: string, extra: Partial<PlanExercise> = {}): PlanExercise => ({
  name,
  mode: "weighted",
  sets: 3,
  repRange: { min: 8, max: 12 },
  category: "isolation",
  progression: "double",
  weightIncrement: 5,
  loadConvention: "total",
  restSeconds: 90,
  ...extra,
});
const upper = [
  p("Lateral raise", {
    repRange: { min: 12, max: 20 },
    restSeconds: 60,
    loadConvention: "perDumbbell",
    station: "dumbbells",
  }),
  p("Preacher curl", {
    loadConvention: "platesOnly",
    station: "preacher bench",
    superset: "Arms",
    backup: {
      name: "Incline DB curl",
      station: "dumbbells",
      mode: "weighted",
      loadConvention: "perDumbbell",
    },
  }),
  p("Overhead DB triceps extension", {
    aliases: ["Seated overhead DB triceps extension"],
    station: "preacher bench",
    superset: "Arms",
    easyWeightIncrementMax: 10,
  }),
  p("Overhead press", {
    category: "compound",
    loadConvention: "perDumbbell",
    restSeconds: 120,
  }),
  p("Weighted pull-ups (heavy)", {
    category: "compound",
    mode: "bodyweight",
    loadConvention: "addedToBodyweight",
    sets: 2,
    repRange: { min: 4, max: 6 },
    restSeconds: 180,
  }),
  p("Ab wheel", {
    mode: "bodyweight",
    loadConvention: "addedToBodyweight",
    progression: "reps",
    repRange: { min: 8, max: 15 },
    restSeconds: 60,
  }),
];
const plan = {
  ...seedPlan,
  rotation: ["push", "pull", "upper", "legs"] as typeof seedPlan.rotation,
  program: { ...seedPlan.program, upper },
};
const setup = async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { program: { upper }, rotation: plan.rotation },
  });
  await t.run(async (ctx) => {
    const state = (await ctx.db.query("state").unique())!;
    await ctx.db.patch(state._id, {
      rotation: { next: "upper" },
      recoveryRemaining: 0,
    });
  });
  return t;
};
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.stubEnv("DASHBOARD_TOKEN", readToken);
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-02T20:00:00Z"));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
const log = (
  t: Awaited<ReturnType<typeof setup>>,
  exercise: string,
  i: number,
  other = {},
) =>
  t.mutation(api.voice.log_set, {
    token,
    input: {
      exercise,
      weight: 20,
      reps: 12,
      requestId: `voice-set-${i}`,
      ...other,
    },
  });
it("appends one set, retries exactly once, returns day/next/rest, adopts existing row and keeps rotation", async () => {
  const t = await setup();
  const old = await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: {
      label: "Upper",
      kind: "lift",
      intensity: "hard",
      exercises: [{ name: "Lateral raise", sets: [{ w: 10, r: 14 }] }],
    },
  });
  const a = await log(t, "Lateral raise", 1, { weight: 10, reps: 14 });
  expect(a.id).toBe(old.id);
  expect(a.session.exercises[0].setsDone).toBe(2);
  expect(a.day.movement.liftDays).toBe(1);
  expect(a.session.next).toMatchObject({
    exercise: "Lateral raise",
    setNumber: 3,
  });
  expect(a.session.rest.seconds).toBe(60);
  const retry = await log(t, "Lateral raise", 1, { weight: 10, reps: 14 });
  expect(retry.replayed).toBe(true);
  await log(t, "Lateral raise", 2, { weight: 10, reps: 16 });
  expect(
    (await t.query(api.voice.get_current_session, { token })).exercises[0]
      .setsDone,
  ).toBe(3);
  expect((await t.query(api.fitness.get_next_session, { token })).next).toBe(
    "legs",
  );
  expect(await t.run((ctx) => ctx.db.query("workouts").collect())).toHaveLength(
    1,
  );
  await expect(log(t, "Lateral raise", 1, { weight: 15 })).rejects.toThrow(
    "requestId reused",
  );
});
it("superset rest waits for partner and first compound includes warm-up", async () => {
  const t = await setup();
  for (let i = 0; i < 3; i++) await log(t, "Lateral raise", i);
  const a = await log(t, "Preacher curl", 4);
  expect(a.session.rest).toMatchObject({ seconds: 0, waitingForPair: true });
  expect(a.session.next.exercise).toBe("Overhead DB triceps extension");
  const b = await log(t, "Seated overhead DB triceps extension", 5, { rir: 3 });
  expect(b.session.rest.seconds).toBe(90);
  expect(b.session.next).toMatchObject({
    exercise: "Preacher curl",
    setNumber: 2,
    target: { load: "20 lb of plates" },
  });
  for (let i = 6; i < 10; i++)
    await log(
      t,
      i % 2 === 0 ? "Preacher curl" : "Overhead DB triceps extension",
      i,
    );
  const current = await t.query(api.voice.get_current_session, { token });
  expect(current.next).toMatchObject({ exercise: "Overhead press" });
  expect(current.next?.warmup).toContain("1 to 2");
});
it("Nov 2 replay preserves history but excludes extra sets from progression", () => {
  const sets = [
      [14, 14, 16],
      [12, 12, 12],
      [12, 12, 12],
      [10, 12, 10],
      [6, 6, 5],
      [8, 8, 8],
    ],
    weights = [10, 20, 40, 37.5, 0, 0];
  const row: Workout = {
    date: "2026-11-02",
    ts: 1,
    label: "Upper",
    kind: "lift",
    intensity: "hard",
    exercises: upper.map((e, i) => ({
      name: e.name,
      sets: sets[i].map((r, j) => ({
        w: weights[i],
        r,
        ...(j === 2 && i === 1
          ? { rir: 0 }
          : j === 2 && i === 2
            ? { rir: 3 }
            : {}),
      })),
    })),
  };
  const result = nextSession(plan, "upper", [row], "2026-11-09", 0),
    aims = result.exercises.map((e) => e.aims);
  expect(aims[0]).toEqual([
    { w: 10, r: 15 },
    { w: 10, r: 15 },
    { w: 10, r: 17 },
  ]);
  expect(aims[3]).toEqual(Array(3).fill({ w: 37.5, r: 12 }));
  expect(aims[1]).toEqual(Array(3).fill({ w: 25, r: 8 }));
  expect(aims[2]).toEqual(Array(3).fill({ w: 45, wMax: 50, r: 8 }));
  expect(aims[4]).toEqual(Array(2).fill({ w: 5, r: 4 }));
  expect(aims[5]).toEqual(Array(3).fill({ w: 0, r: 9 }));
  expect(result.exercises[4].last?.sets).toHaveLength(3);
});
it("one-use notes appear next relevant day and expire after that session", async () => {
  const t = await setup();
  await t.mutation(api.voice.set_next_session_note, {
    token,
    input: { exercise: "Preacher curl", note: "Keep wrists straight" },
  });
  expect(
    (await t.query(api.voice.get_current_session, { token })).exercises[1]
      .nextTimeNote,
  ).toBeNull();
  vi.mocked(Date.now).mockReturnValue(Date.parse("2026-11-05T20:00:00Z"));
  expect(
    (await t.query(api.voice.get_current_session, { token })).exercises[1]
      .nextTimeNote,
  ).toBe("Keep wrists straight");
  await log(t, "Lateral raise", 1);
  expect(
    (await t.query(api.voice.get_current_session, { token })).exercises[1]
      .nextTimeNote,
  ).toBe("Keep wrists straight");
  vi.mocked(Date.now).mockReturnValue(Date.parse("2026-11-09T20:00:00Z"));
  await t.run(async (ctx) => {
    const s = (await ctx.db.query("state").unique())!;
    await ctx.db.patch(s._id, { rotation: { next: "upper" } });
  });
  expect(
    (await t.query(api.voice.get_current_session, { token })).exercises[1]
      .nextTimeNote,
  ).toBeNull();
});
it("swaps prefer same station, backups retain identity and do not borrow load", async () => {
  const t = await setup();
  const reordered = await t.mutation(api.voice.swap_exercise, {
    token,
    input: { exercise: "Preacher curl" },
  });
  expect(reordered.choice).toBe("Overhead DB triceps extension");
  const swapped = await t.mutation(api.voice.swap_exercise, {
    token,
    input: { exercise: "Preacher curl", useBackup: true },
  });
  expect(swapped.session.next).toMatchObject({
    exercise: "Incline DB curl",
    target: { weight: null },
  });
  const result = await log(t, "Incline DB curl", 1, { weight: 15 });
  expect(result.session.exercises[0].setsDone).toBe(1);
  const rows = await t.run((ctx) => ctx.db.query("workouts").collect());
  expect(rows[0].exercises[0]).toMatchObject({
    name: "Incline DB curl",
    replaces: "Preacher curl",
    loadConvention: "perDumbbell",
  });
});
it("rename moves history, merge retains aliases regardless of order", async () => {
  const t = await setup();
  await log(t, "Seated overhead DB triceps extension", 1, { weight: 40 });
  await t.mutation(api.voice.rename_exercise, {
    token,
    input: {
      from: "Overhead DB triceps extension",
      to: "Standing overhead DB extension",
    },
  });
  const h = await t.query(api.fitness.get_exercise_history, {
    token,
    name: "Standing overhead DB extension",
  });
  expect(JSON.stringify(h)).toContain('"w":40');
  await log(t, "Seated overhead DB triceps extension", 2, { weight: 40 });
  await t.mutation(api.fitness.update_plan, {
    token,
    patch: { program: { upper: [p("Curl target"), p("Curl source")] } },
  });
  await t.mutation(api.voice.rename_exercise, {
    token,
    input: { from: "Curl source", to: "Curl target", merge: true },
  });
  const live = await t.query(api.fitness.get_plan, { token });
  expect(live.program.upper).toHaveLength(1);
  expect(live.program.upper[0].aliases).toContain("Curl source");
});
it("completed unequal pairs never suppress rest; invalid new supersets rejected", async () => {
  const a = p("A", { station: "bench", superset: "Pair" }),
    b = p("B", { sets: 2, station: "bench", superset: "Pair" });
  const v = sessionView(
    {
      date: "2026-11-02",
      label: "upper",
      notes: [],
      lastExercise: "A",
      exercises: [a, b].map((p) => ({
        prescription: p,
        aims: [],
        loadInstruction: null,
      })),
    },
    [
      {
        date: "2026-11-02",
        ts: 1,
        label: "Upper",
        kind: "lift",
        intensity: "hard",
        exercises: [
          { name: "A", sets: Array(3).fill({ w: 20, r: 12 }) },
          { name: "B", sets: Array(2).fill({ w: 20, r: 12 }) },
        ],
      },
    ],
    plan,
  );
  expect(v.rest?.seconds).toBe(90);
  expect(v.complete).toBe(true);
  const t = await setup();
  await expect(
    t.mutation(api.fitness.update_plan, {
      token,
      patch: {
        program: {
          upper: [p("A", { superset: "Pair" }), p("B", { superset: "Pair" })],
        },
      },
    }),
  ).rejects.toThrow("station");
});
