import {
  addDays,
  daysBetween,
  muscle,
  normalize,
  periodStart,
  type Plan,
  type Workout,
  type Rotation,
  rotationOrder,
} from "./model";
import { canonicalWorkouts } from "./training";
import { exerciseAims } from "./progression";
export type HistoryWorkout = Workout & { deload?: boolean };
import { activityTotals, dayTotals } from "./day-totals";
import { liftSessions } from "./lift-sessions";
export function nextSession(
  plan: Plan,
  next: Rotation,
  workouts: HistoryWorkout[],
  today: string,
  recoveryRemaining = 0,
) {
  const eligible = canonicalWorkouts(
    workouts.filter((w) => w.date <= today),
    plan,
  );
  const lifts = liftSessions(eligible);
  // Filter deload fragments before merging so they cannot contaminate the baseline.
  const baselineLifts = liftSessions(eligible.filter((w) => !w.deload));
  const last = lifts[0];
  const gap = last ? daysBetween(last.date, today) : null;
  const reduced = recoveryRemaining > 0 || (gap !== null && gap > 14);
  const flags: string[] = [];
  if (
    !rotationOrder(plan).includes("legs") &&
    !lifts.some(
      (w) =>
        w.date > addDays(today, -7) &&
        plan.program.legs.every((p) =>
          w.exercises.some(
            (e) =>
              normalize(e.name) === normalize(p.name) &&
              e.sets.length >= p.sets,
          ),
        ),
    )
  )
    flags.push(
      "Legs block has not been logged in the past 7 days. Add the short weekly block.",
    );
  const dates = new Set(lifts.map((w) => w.date));
  let consecutive = 0;
  let d = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(d)) {
    consecutive++;
    d = addDays(d, -1);
  }
  if (consecutive >= 5)
    flags.push(`${consecutive} consecutive lift days; consider a rest day.`);
  const hardDays = new Set(
    workouts
      .filter(
        (w) =>
          w.kind === "cardio" &&
          w.intensity === "hard" &&
          w.date >= periodStart(today, "week") &&
          w.date <= today,
      )
      .map((w) => w.date),
  ).size;
  if (hardDays >= 3)
    flags.push(
      `${hardDays} hard cardio days this week. Avoid hard-day stacking; keep jogs easy.`,
    );
  if (reduced)
    flags.push(
      `Re-entry: ${gap !== null && gap > 14 ? `${gap} days since the last lift. ` : ""}Use approximately 10% lighter weighted aims for ${recoveryRemaining || rotationOrder(plan).length} rotation sessions, then resume. First cardio back short and easy. Nothing to backfill.`,
    );
  else if (gap !== null && gap >= 7)
    flags.push(
      `${gap} days since the last lift; re-entry: start a touch lighter, first cardio back short and easy. Nothing to backfill.`,
    );
  const exercises = plan.program[next].map((p) => {
    const find = (ws: HistoryWorkout[]) =>
      ws.flatMap((w) =>
        w.exercises
          .filter(
            (e) => normalize(e.name) === normalize(p.name) && e.sets.length,
          )
          .map((e) => ({ date: w.date, sets: e.sets })),
      );
    const actual = find(lifts)[0] ?? null;
    const baseline = find(baselineLifts)[0] ?? null;
    return {
      ...p,
      last: actual,
      progressionBaseline: baseline,
      ...exerciseAims(p, baseline, reduced),
    };
  });
  return {
    next,
    exercises,
    flags,
    reduced,
    recoveryRemaining: reduced
      ? recoveryRemaining || rotationOrder(plan).length
      : 0,
    legsBlock: plan.program.legs,
  };
}
export type Data = {
  measurements?: {
    date: string;
    ts?: number;
    arm: number;
    shoulders: number;
    chest: number;
    waist: number;
  }[];
  photos?: { date: string }[];
  meals: {
    date: string;
    ts: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quality: number;
    note: string;
    source: string;
  }[];
  workouts: HistoryWorkout[];
  weights: { date: string; ts: number; lbs: number }[];
  steps: { date: string; count: number }[];
  supplements: { date: string; items: string[] }[];
};
export function summarize(
  data: Data,
  plan: Plan,
  today: string,
  period: "day" | "week" | "month",
) {
  const start = periodStart(today, period),
    days = daysBetween(start, today) + 1;
  const within = (x: { date: string }) => x.date >= start && x.date <= today;
  const meals = data.meals.filter(within),
    workouts = data.workouts.filter(within),
    steps = data.steps.filter(within),
    weights = data.weights
      .filter(within)
      .sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
  const lifts = liftSessions(workouts).length;
  const movement = new Set([
    ...workouts.map((w) => w.date),
    ...steps.filter((s) => s.count > 0).map((s) => s.date),
  ]).size;
  const protein = meals.reduce((a, m) => a + m.protein, 0) / days,
    calories = meals.reduce((a, m) => a + m.calories, 0) / days;
  const hardSets: Record<string, number> = {
    biceps: 0,
    triceps: 0,
    shoulders: 0,
    chest: 0,
    back: 0,
    legs: 0,
    abs: 0,
    unmapped: 0,
  };
  for (const w of workouts.filter(
    (w) => w.kind === "lift" && w.intensity === "hard",
  ))
    for (const e of w.exercises) hardSets[muscle(e.name)] += e.sets.length;
  const liftRows = liftSessions(workouts);
  const cardio = workouts.filter((w) => w.kind === "cardio");
  const exerciseNames = [
    ...new Set(
      liftRows.flatMap((w) =>
        w.exercises.filter((e) => e.sets.length).map((e) => normalize(e.name)),
      ),
    ),
  ];
  const stepDays = new Set(steps.map((s) => s.date)).size;
  const mealDays = new Set(meals.map((m) => m.date)).size;
  const previousSteps = data.steps.filter(
    (s) => s.date >= addDays(start, -28) && s.date < start,
  );
  const supplementRows = data.supplements.filter(within);
  const supplementNames = [...new Set(supplementRows.flatMap((s) => s.items))];
  const measurementRows = (data.measurements ?? [])
    .filter(within)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.ts ?? 0) - (b.ts ?? 0));
  const photoRows = (data.photos ?? []).filter(within);
  const threeNumbers = {
    lifts: {
      value: lifts,
      target: [plan.targets.liftsMin, plan.targets.liftsMax],
      pass: lifts >= plan.targets.liftsMin && lifts <= plan.targets.liftsMax,
    },
    movementDays: {
      value: movement,
      target: plan.targets.movementDays,
      pass: movement >= plan.targets.movementDays,
    },
    proteinAvg: {
      value: Math.round(protein),
      target: plan.targets.protein,
      pass: protein >= plan.targets.protein,
    },
  };
  const activity = activityTotals(workouts);
  return {
    ...(period === "week" ? { THE_THREE_NUMBERS: threeNumbers } : {}),
    period,
    start,
    end: today,
    elapsedDays: days,
    inProgress:
      period === "week"
        ? new Date(today + "T12:00:00Z").getUTCDay() !== 0
        : period === "month"
          ? addDays(today, 1).slice(0, 7) === today.slice(0, 7)
          : false,
    proteinAvg: protein,
    calorieAvg: calories,
    lifts,
    movementDays: movement,
    weeklyTargets: plan.targets,
    ...(period === "day" ? { day: dayTotals(data, plan, today) } : {}),
    movement: activity,
    hardSets,
    hardSetsMethod:
      "Primary muscle only, hard-intensity lift sets only. Timed hangs and carries are unmapped. Targets are weekly; month totals are not weekly pass/fail.",
    hardCardioDays: new Set(
      workouts
        .filter((w) => w.kind === "cardio" && w.intensity === "hard")
        .map((w) => w.date),
    ).size,
    weightTrend: {
      first: weights[0]?.lbs ?? null,
      last: weights.at(-1)?.lbs ?? null,
      change: weights.length > 1 ? weights.at(-1)!.lbs - weights[0].lbs : null,
      points: weights,
    },
    training: {
      exerciseCount: liftRows.reduce(
        (n, w) =>
          n +
          new Set(
            w.exercises
              .filter((e) => e.sets.length)
              .map((e) => normalize(e.name)),
          ).size,
        0,
      ),
      uniqueExercises: exerciseNames.length,
      sets: liftRows.reduce(
        (n, w) => n + w.exercises.reduce((m, e) => m + e.sets.length, 0),
        0,
      ),
      cardioSessions: cardio.length,
      cardioMinutes: activity.cardioMinutes,
      cardioDistanceMi: activity.cardioDistanceMi,
      cardioDistanceMiMax: activity.cardioDistanceMiMax,
      easyCardio: cardio.filter((w) => w.intensity === "easy").length,
      hardCardio: cardio.filter((w) => w.intensity === "hard").length,
      cardioActivities: cardio.map((w) => ({
        date: w.date,
        label: w.label,
        intensity: w.intensity,
        durationMin: w.durationMin ?? null,
        distanceMi: w.distanceMi ?? null,
        distanceMiMax: w.distanceMiMax ?? w.distanceMi ?? null,
      })),
    },
    nutrition: {
      mealCount: meals.length,
      caloriesTotal: meals.reduce((n, m) => n + m.calories, 0),
      caloriesPerLoggedDay: mealDays
        ? meals.reduce((n, m) => n + m.calories, 0) / mealDays
        : null,
      proteinPerLoggedDay: mealDays
        ? meals.reduce((n, m) => n + m.protein, 0) / mealDays
        : null,
      carbsPerLoggedDay: mealDays
        ? meals.reduce((n, m) => n + m.carbs, 0) / mealDays
        : null,
      fatPerLoggedDay: mealDays
        ? meals.reduce((n, m) => n + m.fat, 0) / mealDays
        : null,
      qualityAvg: meals.length
        ? meals.reduce((n, m) => n + m.quality, 0) / meals.length
        : null,
    },
    stepsDetail: {
      total: steps.reduce((n, s) => n + s.count, 0),
      averageLoggedDay: stepDays
        ? steps.reduce((n, s) => n + s.count, 0) / stepDays
        : null,
      normalPrevious28Days: previousSteps.length
        ? previousSteps.reduce((n, s) => n + s.count, 0) /
          new Set(previousSteps.map((s) => s.date)).size
        : null,
      baselineDays: new Set(previousSteps.map((s) => s.date)).size,
    },
    supplementsDetail: supplementNames.map((name) => ({
      name,
      days: new Set(
        supplementRows.filter((s) => s.items.includes(name)).map((s) => s.date),
      ).size,
    })),
    checkIns: {
      weighIns: weights.length,
      weightAverage: weights.length
        ? weights.reduce((n, w) => n + w.lbs, 0) / weights.length
        : null,
      measurements: measurementRows.length,
      latestMeasurements: measurementRows.at(-1) ?? null,
      photos: photoRows.length,
    },
    stepsAvg: steps.reduce((a, s) => a + s.count, 0) / days,
    supplementDays: new Set(data.supplements.filter(within).map((s) => s.date))
      .size,
    coverage: {
      mealDays: new Set(meals.map((m) => m.date)).size,
      stepDays: steps.length,
    },
    note: "proteinAvg, calorieAvg, and stepsAvg divide by every elapsed calendar day, treating missing logs as zero. nutrition.*PerLoggedDay and stepsDetail.averageLoggedDay divide only by logged days and are null without logs. The normal steps baseline uses logged days in the 28 days preceding the period. Missing logs are not proof of no intake or activity. Week starts Monday. Movement means a workout or any positive self-reported steps.",
  };
}
