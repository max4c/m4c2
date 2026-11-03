import { expect, it } from "vitest";
import { trendWindows } from "../../shared/trends";
import type { Data } from "../../shared/analytics";

const empty = (): Data => ({
  workouts: [],
  meals: [],
  steps: [],
  weights: [],
  supplements: [],
});
it("compares adjacent equal windows across month boundaries and excludes future logs", () => {
  const data = empty();
  data.steps = [
    { date: "2026-10-19", count: 99999 },
    { date: "2026-10-20", count: 2000 },
    { date: "2026-10-26", count: 4000 },
    { date: "2026-10-27", count: 6000 },
    { date: "2026-11-02", count: 8000 },
    { date: "2026-11-03", count: 99999 },
  ];
  const { current, previous } = trendWindows(data, "2026-11-02", 7);
  expect([current.start, current.end, current.steps]).toEqual([
    "2026-10-27",
    "2026-11-02",
    7000,
  ]);
  expect([previous.start, previous.end, previous.steps]).toEqual([
    "2026-10-20",
    "2026-10-26",
    3000,
  ]);
  const month = trendWindows(data, "2026-11-02", 30);
  expect([
    month.current.start,
    month.previous.start,
    month.previous.end,
  ]).toEqual(["2026-10-04", "2026-09-04", "2026-10-03"]);
});
it("counts live-log lift fragments as one day while retaining sets and partial cardio duration", () => {
  const data = empty();
  const lift = {
    date: "2026-11-02",
    ts: 1,
    label: "Pull",
    kind: "lift" as const,
    intensity: "hard" as const,
    exercises: [{ name: "Curl", sets: [{ w: 20, r: 10 }] }],
  };
  data.workouts = [
    lift,
    { ...lift, ts: 2 },
    { ...lift, kind: "cardio", exercises: [], durationMin: 30 },
    { ...lift, kind: "cardio", exercises: [] },
  ];
  expect(trendWindows(data, "2026-11-02", 7).current).toMatchObject({
    lifts: 1,
    sets: 2,
    cardio: 2,
    cardioMinutes: 30,
    cardioTimed: 1,
  });
});
it("averages logged days, combines daily steps, and uses the last weigh-in per day", () => {
  const data = empty();
  data.meals = [
    {
      date: "2026-11-02",
      ts: 1,
      name: "Breakfast",
      calories: 600,
      protein: 35,
      carbs: 50,
      fat: 20,
      quality: 8,
      note: "",
      source: "estimate",
    },
    {
      date: "2026-11-02",
      ts: 2,
      name: "Lunch",
      calories: 800,
      protein: 50,
      carbs: 90,
      fat: 30,
      quality: 8,
      note: "",
      source: "estimate",
    },
  ];
  data.steps = [
    { date: "2026-11-02", count: 2000 },
    { date: "2026-11-02", count: 3000 },
  ];
  data.weights = [
    { date: "2026-11-02", ts: 2, lbs: 170 },
    { date: "2026-11-02", ts: 1, lbs: 180 },
    { date: "2026-11-01", ts: 0, lbs: 168 },
  ];
  const { current, previous } = trendWindows(data, "2026-11-02", 7);
  expect(current).toMatchObject({
    calories: 1400,
    protein: 85,
    steps: 5000,
    weight: 169,
    coverage: { mealDays: 1, stepDays: 1, weightDays: 2 },
  });
  expect(previous).toMatchObject({
    calories: null,
    protein: null,
    steps: null,
    weight: null,
    sleep: null,
  });
});
it("excludes missing nights from sleep averages", () => {
  const data = {
    ...empty(),
    sleep: {
      status: "connected" as const,
      fetchedAt: null,
      nights: [
        {
          date: "2026-11-02",
          seconds: 28800,
          hours: 8,
          start: null,
          end: null,
          score: null,
        },
        {
          date: "2026-10-26",
          seconds: 25200,
          hours: 7,
          start: null,
          end: null,
          score: null,
        },
      ],
    },
  };
  const result = trendWindows(data, "2026-11-02", 7);
  expect(result.current.sleep).toBe(28800);
  expect(result.previous.sleep).toBe(25200);
  expect(result.current.coverage.nights).toBe(1);
});
