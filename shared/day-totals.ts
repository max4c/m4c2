import type { Plan, Workout } from "./model";

const round = (n: number) => Math.round(n * 100) / 100;
export function activityTotals(workouts: Workout[]) {
  const liftDays = new Set(
    workouts.filter((w) => w.kind === "lift").map((w) => w.date),
  ).size;
  const cardio = workouts.filter((w) => w.kind === "cardio");
  const timed = workouts.filter((w) => w.durationMin !== undefined);
  const measured = workouts.filter((w) => w.distanceMi !== undefined);
  const cardioTimed = cardio.filter((w) => w.durationMin !== undefined);
  const cardioMeasured = cardio.filter((w) => w.distanceMi !== undefined);
  return {
    sessions: liftDays + cardio.length,
    liftDays,
    cardioSessions: cardio.length,
    minutes: timed.length
      ? round(timed.reduce((n, w) => n + w.durationMin!, 0))
      : null,
    distanceMi: measured.length
      ? round(measured.reduce((n, w) => n + w.distanceMi!, 0))
      : null,
    distanceMiMax: measured.length
      ? round(
          measured.reduce((n, w) => n + (w.distanceMiMax ?? w.distanceMi!), 0),
        )
      : null,
    cardioMinutes: cardioTimed.length
      ? round(cardioTimed.reduce((n, w) => n + w.durationMin!, 0))
      : null,
    cardioDistanceMi: cardioMeasured.length
      ? round(cardioMeasured.reduce((n, w) => n + w.distanceMi!, 0))
      : null,
    cardioDistanceMiMax: cardioMeasured.length
      ? round(
          cardioMeasured.reduce(
            (n, w) => n + (w.distanceMiMax ?? w.distanceMi!),
            0,
          ),
        )
      : null,
    coverage: {
      workoutRows: workouts.length,
      rowsWithDuration: timed.length,
      rowsWithDistance: measured.length,
    },
    note: "Lifting counts distinct dates; cardio counts logged rows. Minutes and miles sum only reported values. Missing values are unknown, not zero. distanceMi/distanceMiMax are lower/upper totals when ranges were reported. Live-log fragments must not repeat whole-session duration or distance.",
  };
}
export function dayTotals(
  data: {
    meals: {
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[];
    workouts: Workout[];
  },
  plan: Plan,
  date: string,
) {
  const meals = data.meals.filter((m) => m.date === date);
  const workouts = data.workouts.filter((w) => w.date === date);
  const totals = {
    calories: round(meals.reduce((n, m) => n + m.calories, 0)),
    protein: round(meals.reduce((n, m) => n + m.protein, 0)),
    carbs: round(meals.reduce((n, m) => n + m.carbs, 0)),
    fat: round(meals.reduce((n, m) => n + m.fat, 0)),
  };
  return {
    date,
    timezone: plan.timezone,
    totals,
    targets: {
      calories: plan.targets.calories,
      protein: plan.targets.protein,
      carbs: null,
      fat: null,
    },
    remaining: {
      calories:
        plan.targets.calories === null
          ? null
          : round(Math.max(0, plan.targets.calories - totals.calories)),
      protein: round(Math.max(0, plan.targets.protein - totals.protein)),
    },
    movement: activityTotals(workouts),
    weeklyTargets: {
      liftsMin: plan.targets.liftsMin,
      liftsMax: plan.targets.liftsMax,
      movementDays: plan.targets.movementDays,
    },
    mealEntries: meals.length,
    note: "Nutrition totals are logged intake only: kcal and grams. Null target means unset. Movement targets are weekly, not daily.",
  };
}
