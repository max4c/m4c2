import { beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { nextSession } from "../../shared/analytics";
import { seedPlan, type Workout } from "../../shared/model";
const modules = import.meta.glob("../../convex/**/*.ts");
const token = "test-service-".padEnd(64, "x"),
  readToken = "test-read-".padEnd(64, "y");
const setup = async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.fitness.seed, { token });
  return t;
};
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.stubEnv("DASHBOARD_TOKEN", readToken);
});
const lift = (date: string, label = "Push", w = 30, r = 12): Workout => ({
  date,
  ts: Date.parse(date + "T18:00:00Z"),
  kind: "lift",
  label,
  intensity: "hard",
  exercises: [
    {
      name: "Cable overhead triceps extension",
      sets: Array.from({ length: 4 }, () => ({ w, r })),
    },
  ],
});
describe("persistent data and authorization", () => {
  it("denies every public entrypoint with a dashboard-only token", async () => {
    const t = await setup();
    await expect(
      t.query(api.fitness.get_plan, { token: readToken }),
    ).rejects.toThrow("Unauthorized");
    await expect(
      t.mutation(api.fitness.log, {
        token: readToken,
        operation: "log_weight",
        input: { lbs: 170 },
      }),
    ).rejects.toThrow("Unauthorized");
    await expect(
      t.query(api.fitness.dashboard, { token: "wrong" }),
    ).rejects.toThrow("Unauthorized");
    expect(
      (await t.query(api.fitness.dashboard, { token: readToken })).plan.targets
        .protein,
    ).toBe(150);
  });
  it("seeds once, merges target patches, validates target bounds", async () => {
    const t = await setup();
    await t.mutation(api.fitness.update_plan, {
      token,
      patch: { targets: { calories: 2300 } },
    });
    await t.mutation(api.fitness.seed, { token });
    expect(
      (await t.query(api.fitness.get_plan, { token })).targets.calories,
    ).toBe(2300);
    await expect(
      t.mutation(api.fitness.update_plan, {
        token,
        patch: { targets: { liftsMin: 7, liftsMax: 2 } },
      }),
    ).rejects.toThrow();
  });
  it("logs each data type, returns remaining and the three numbers", async () => {
    const t = await setup();
    await t.mutation(api.fitness.update_plan, {
      token,
      patch: { targets: { calories: 2400 } },
    });
    for (const [operation, input] of [
      [
        "log_meal",
        {
          name: "Lunch",
          calories: 700,
          protein: 55,
          carbs: 70,
          fat: 20,
          quality: 8,
        },
      ],
      ["log_weight", { lbs: 170 }],
      ["log_supplements", { items: ["creatine"] }],
      ["log_measurements", { arm: 14, shoulders: 45, chest: 40, waist: 32 }],
    ] as const)
      await t.mutation(api.fitness.log, { token, operation, input });
    const r = await t.query(api.fitness.get_remaining, { token });
    expect(r.remaining).toEqual({ protein: 95, calories: 1700 });
    expect(r.workoutHappened).toBe(false);
    const s = await t.query(api.fitness.get_summary, { token, period: "week" });
    expect(s.THE_THREE_NUMBERS?.lifts.pass).toBe(false);
  });
  it("retries are idempotent and conflicting request IDs fail", async () => {
    const t = await setup();
    const p = {
      token,
      operation: "log_workout" as const,
      input: { ...lift("2026-10-20"), requestId: "same-workout-1" },
    };
    const first = await t.mutation(api.fitness.log, p);
    expect(await t.mutation(api.fitness.log, p)).toEqual(first);
    expect((await t.query(api.fitness.get_next_session, { token })).next).toBe(
      "pull",
    );
    await expect(
      t.mutation(api.fitness.log, {
        ...p,
        input: { ...p.input, label: "Pull" },
      }),
    ).rejects.toThrow("requestId");
  });
  it("advances only rotation lifts with sets and updates a date’s steps", async () => {
    const t = await setup();
    for (const input of [
      { ...lift("2026-10-18"), exercises: [] },
      { ...lift("2026-10-19"), label: "Legs" },
      { ...lift("2026-10-20"), kind: "cardio", exercises: [] },
    ])
      await t.mutation(api.fitness.log, {
        token,
        operation: "log_workout",
        input,
      });
    expect((await t.query(api.fitness.get_next_session, { token })).next).toBe(
      "push",
    );
    await t.mutation(api.fitness.log, {
      token,
      operation: "log_workout",
      input: lift("2026-10-21"),
    });
    expect((await t.query(api.fitness.get_next_session, { token })).next).toBe(
      "pull",
    );
    for (const count of [1000, 6000])
      await t.mutation(api.fitness.log, {
        token,
        operation: "log_steps",
        input: { date: "2026-10-21", count },
      });
    const rows = await t.query(api.fitness.query_entries, {
      token,
      input: { table: "steps", start: "2026-10-21", end: "2026-10-21" },
    });
    expect(rows.page).toHaveLength(1);
    expect(rows.page[0]).toMatchObject({ count: 6000 });
  });
  it("persists a three-session recovery cycle and excludes reduced loads from future progression", async () => {
    const t = await setup();
    await t.mutation(api.fitness.log, {
      token,
      operation: "log_workout",
      input: lift("2026-09-01"),
    });
    for (const [date, label] of [
      ["2026-10-20", "Pull"],
      ["2026-10-21", "Upper"],
      ["2026-10-22", "Push"],
    ])
      await t.mutation(api.fitness.log, {
        token,
        operation: "log_workout",
        input: lift(date, label, 27, 8),
      });
    const state = await t.run((ctx) => ctx.db.query("state").unique());
    expect(state?.recoveryRemaining).toBe(0);
    const workouts = await t.run((ctx) => ctx.db.query("workouts").collect());
    expect(workouts.filter((w) => w.deload)).toHaveLength(3);
    const next = nextSession(seedPlan, "push", workouts, "2026-10-23");
    expect(next.exercises[0].aims[0]).toEqual({ w: 35, r: 8 });
  });
});
describe("progression boundaries", () => {
  it("requires all prescribed sets at 12 before increasing load", () => {
    expect(
      nextSession(seedPlan, "push", [lift("2026-10-20")], "2026-10-21")
        .exercises[0].aims[0],
    ).toEqual({ w: 35, r: 8 });
    const w = lift("2026-10-20");
    w.exercises[0].sets.pop();
    expect(
      nextSession(seedPlan, "push", [w], "2026-10-21").exercises[0].aims[0].w,
    ).toBe(30);
  });
  it.each([6, 7, 14, 15])("handles a %i-day gap", (gap) => {
    const today = new Date(Date.parse("2026-10-01") + gap * 86400000)
      .toISOString()
      .slice(0, 10);
    const r = nextSession(seedPlan, "push", [lift("2026-10-01")], today);
    expect(r.reduced).toBe(gap > 14);
    expect(
      r.flags.some((f) => f.includes("re-entry") || f.includes("Re-entry")),
    ).toBe(gap >= 7);
  });
  it("bodyweight adds one rep, hangs preserve seconds, no history has no invented load", () => {
    const w = lift("2026-10-20", "Pull");
    w.exercises = [
      { name: "Pull-ups", sets: [{ w: 0, r: 10 }] },
      { name: "Dead hangs", sets: [{ w: 0, r: 40 }] },
    ];
    const r = nextSession(seedPlan, "pull", [w], "2026-10-21");
    expect(r.exercises[4].aims[0].r).toBe(11);
    expect(r.exercises[5].aims[0].r).toBe(40);
    expect(r.exercises[0].aims[0].w).toBe(null);
  });
});
it("date-only backfills do not replace current progression or reverse weight trends", async () => {
  const t = await setup();
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: lift("2026-10-20", "Push", 30, 12),
  });
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: { ...lift("2026-09-01", "Upper", 10, 8), ts: undefined },
  });
  const ws = await t.run((ctx) => ctx.db.query("workouts").collect());
  const n = nextSession(seedPlan, "push", ws, "2026-10-21");
  expect(n.reduced).toBe(false);
  expect(n.exercises[0].aims[0].w).toBe(35);
  expect(
    (await t.run((ctx) => ctx.db.query("state").unique()))?.rotation.next,
  ).toBe("pull");
});
it("does not finish recovery by repeating the same rotation day", async () => {
  const t = await setup();
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: lift("2026-09-01"),
  });
  for (const date of ["2026-10-20", "2026-10-21", "2026-10-22"])
    await t.mutation(api.fitness.log, {
      token,
      operation: "log_workout",
      input: lift(date, "Push"),
    });
  const s = await t.run((ctx) => ctx.db.query("state").unique());
  expect(s?.recoveryRemaining).toBe(2);
  expect(s?.recoveryDays).toEqual(["pull", "upper"]);
});
it("an empty Legs log does not dismiss the weekly block reminder", () => {
  const w = lift("2026-10-20", "Legs");
  w.exercises = [];
  expect(
    nextSession(seedPlan, "push", [w], "2026-10-21").flags.some((f) =>
      f.startsWith("Legs block"),
    ),
  ).toBe(true);
});
it("rejects invalid dates and persists zero steps without counting a movement day", async () => {
  const t = await setup();
  await expect(
    t.mutation(api.fitness.log, {
      token,
      operation: "log_steps",
      input: { date: "2026-02-30", count: 10 },
    }),
  ).rejects.toThrow();
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_steps",
    input: { date: "2026-10-20", count: 0 },
  });
  expect(
    (
      await t.query(api.fitness.query_entries, {
        token,
        input: { table: "steps", start: "2026-10-20", end: "2026-10-20" },
      })
    ).page[0],
  ).toMatchObject({ count: 0 });
});

it("throttles sign-in attempts persistently and rejects read credentials", async () => {
  const t = await setup();
  await expect(
    t.mutation(api.fitness.dashboard_login_attempt, {
      token: readToken,
      client: "client-one",
    }),
  ).rejects.toThrow();
  for (let i = 0; i < 10; i++)
    expect(
      (
        await t.mutation(api.fitness.dashboard_login_attempt, {
          token,
          client: "client-one",
        })
      ).allowed,
    ).toBe(true);
  expect(
    (
      await t.mutation(api.fitness.dashboard_login_attempt, {
        token,
        client: "client-one",
      })
    ).allowed,
  ).toBe(false);
  expect(
    (
      await t.mutation(api.fitness.dashboard_login_attempt, {
        token,
        client: "client-two",
      })
    ).allowed,
  ).toBe(true);
});
it("returns all exercise records and historical week summaries", async () => {
  const t = await setup();
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: lift("2026-01-05", "Push", 30, 12),
  });
  await t.mutation(api.fitness.log, {
    token,
    operation: "log_workout",
    input: lift("2026-01-12", "Push", 35, 8),
  });
  const h = await t.query(api.fitness.get_exercise_history, {
    token,
    name: "Cable overhead triceps extension",
  });
  expect(h.heaviest?.w).toBe(35);
  expect(h.heaviest?.r).toBe(8);
  expect(h.bestSession?.volume).toBe(1440);
  expect(h.totalVolume).toBe(2560);
  expect(h.sessions).toHaveLength(2);
  const s = await t.query(api.fitness.get_summary, {
    token,
    period: "week",
    asOf: "2026-01-11",
  });
  expect(s.lifts).toBe(1);
  expect(s.start).toBe("2026-01-05");
  expect(s.end).toBe("2026-01-11");
  await expect(
    t.query(api.fitness.get_summary, {
      token,
      period: "week",
      asOf: "2026-02-30",
    }),
  ).rejects.toThrow();
});
