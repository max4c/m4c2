import type { Data } from "./analytics";
import { activityTotals } from "./day-totals";
import { addDays } from "./model";
import type { SleepData } from "./sleep";

type TrendData = Pick<Data, "meals" | "workouts" | "weights" | "steps"> & {
  sleep?: SleepData;
};

// Equal, adjacent calendar windows; averages never fill missing logs with zero.
export function trendWindows(data: TrendData, today: string, days: 7 | 30) {
  function window(end: string) {
    const start = addDays(end, 1 - days);
    const within = (row: { date: string }) =>
      row.date >= start && row.date <= end;
    const workouts = data.workouts.filter(within);
    const meals = data.meals.filter(within);
    const steps = data.steps.filter(within);
    const nights = data.sleep?.nights.filter(within) ?? [];
    const mealDays = new Set(meals.map((m) => m.date)).size;
    const stepDays = new Set(steps.map((s) => s.date)).size;
    const weights = new Map<string, number>();
    for (const row of [...data.weights]
      .filter(within)
      .sort((a, b) => a.ts - b.ts))
      weights.set(row.date, row.lbs);
    const activity = activityTotals(workouts);
    return {
      start,
      end,
      lifts: activity.liftDays,
      sets: workouts
        .filter((w) => w.kind === "lift")
        .reduce(
          (sum, w) => sum + w.exercises.reduce((n, e) => n + e.sets.length, 0),
          0,
        ),
      cardio: activity.cardioSessions,
      cardioMinutes: activity.cardioMinutes,
      cardioTimed: workouts.filter(
        (w) => w.kind === "cardio" && w.durationMin !== undefined,
      ).length,
      steps: stepDays
        ? steps.reduce((sum, s) => sum + s.count, 0) / stepDays
        : null,
      calories: mealDays
        ? meals.reduce((sum, m) => sum + m.calories, 0) / mealDays
        : null,
      protein: mealDays
        ? meals.reduce((sum, m) => sum + m.protein, 0) / mealDays
        : null,
      weight: weights.size
        ? [...weights.values()].reduce((sum, w) => sum + w, 0) / weights.size
        : null,
      sleep: nights.length
        ? nights.reduce((sum, n) => sum + n.seconds, 0) / nights.length
        : null,
      coverage: {
        mealDays,
        stepDays,
        weightDays: weights.size,
        nights: nights.length,
      },
    };
  }
  return { current: window(today), previous: window(addDays(today, -days)) };
}
