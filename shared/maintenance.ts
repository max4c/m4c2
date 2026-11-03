import { addDays, daysBetween } from "./model";
export type FoodDay = { date: string; complete: boolean };
type Meal = { date: string; calories: number };
type Weight = { date: string; lbs: number };
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = (n: number, step = 1) => Math.round(n / step) * step;
export function estimateMaintenance(
  data: { meals: Meal[]; weights: Weight[]; foodDays: FoodDay[] },
  end: string,
  days: number,
) {
  const start = addDays(end, 1 - days);
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));
  const complete = new Set(
    data.foodDays.filter((d) => d.complete).map((d) => d.date),
  );
  const runs: string[][] = [];
  for (const date of dates) {
    if (!complete.has(date)) continue;
    const last = runs[runs.length - 1];
    if (last && addDays(last[last.length - 1], 1) === date) last.push(date);
    else runs.push([date]);
  }
  // Use the most recent fully logged period; never interpolate intake across gaps.
  const eligible = runs.filter((r) => r.length >= 14);
  const run = eligible[eligible.length - 1] ?? runs[runs.length - 1] ?? [];
  const selected = new Set(run);
  const byDate = new Map<string, number[]>();
  for (const weight of data.weights)
    if (selected.has(weight.date))
      byDate.set(weight.date, [...(byDate.get(weight.date) ?? []), weight.lbs]);
  const weights = [...byDate]
    .map(([date, lbs]) => ({ date, lbs: median(lbs) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const runStart = run[0] ?? null,
    runEnd = run[run.length - 1] ?? null;
  const firstWeek = runStart
    ? weights.filter((w) => w.date <= addDays(runStart, 6))
    : [];
  const lastWeek = runEnd
    ? weights.filter((w) => w.date >= addDays(runEnd, -6))
    : [];
  const span =
    weights.length > 1
      ? daysBetween(weights[0].date, weights[weights.length - 1].date)
      : 0;
  const reasons: string[] = [];
  if (run.length < 14)
    reasons.push(
      "Need at least 14 consecutive explicitly completed food-log days.",
    );
  if (firstWeek.length < 3)
    reasons.push(
      "Need weigh-ins on at least 3 separate dates in the first week of that period.",
    );
  if (lastWeek.length < 3)
    reasons.push(
      "Need weigh-ins on at least 3 separate dates in the last week of that period.",
    );
  if (weights.length < 6 || span < 10)
    reasons.push(
      "Need at least 6 distinct weigh-in dates spanning 10 or more days; multiple weights on one date count once.",
    );
  const intake = data.meals
    .filter((m) => selected.has(m.date))
    .reduce((n, m) => n + m.calories, 0);
  const average = run.length ? intake / run.length : null;
  const base = {
    status: "insufficient_data" as
      "insufficient_data" | "provisional" | "unreliable_trend",
    estimateKcalPerDay: null as number | null,
    confidence: "not_available" as "not_available" | "low",
    window: {
      start,
      end,
      days,
      selectedStart: runStart,
      selectedEnd: runEnd,
      daysSinceSelectedEnd: runEnd ? daysBetween(runEnd, end) : null,
    },
    coverage: {
      completeDays: dates.filter((d) => complete.has(d)).length,
      consecutiveCompleteDays: run.length,
      missingOrIncompleteDates: dates.filter((d) => !complete.has(d)),
      weighInDays: weights.length,
      firstWeekWeighInDays: firstWeek.length,
      lastWeekWeighInDays: lastWeek.length,
      weightSpanDays: span,
    },
    stillNeeded: {
      consecutiveCompleteDays: Math.max(0, 14 - run.length),
      firstWeekWeighInDays: Math.max(0, 3 - firstWeek.length),
      lastWeekWeighInDays: Math.max(0, 3 - lastWeek.length),
      distinctWeighInDays: Math.max(0, 6 - weights.length),
      weightSpanDays: Math.max(0, 10 - span),
    },
    requirements: {
      consecutiveCompleteDays: 14,
      firstWeekWeighInDays: 3,
      lastWeekWeighInDays: 3,
      distinctWeighInDays: 6,
      weightSpanDays: 10,
    },
    averageLoggedKcalPerDay: average === null ? null : round(average),
    weightTrendLbPerWeek: null as number | null,
    reasons,
    method: {
      name: "Short-window energy-balance approximation",
      weightTrend:
        "Median of pairwise slopes at least 3 days apart, after collapsing each date to its median weight.",
      formula: "mean logged kcal/day minus 3500 × weight trend in lb/day",
      assumedKcalPerLb: 3500,
      roundingKcal: 50,
    },
    limitations: [
      "Provisional estimate, not a measured metabolism or a precise calorie prescription. Logged intake may be inaccurate even when marked complete.",
      "Water, glycogen, illness and changes in training can move scale weight independently of tissue energy. The 3500 kcal/lb assumption is a rough short-window approximation, not a long-term weight-change model.",
      "Two to three weeks is a collection minimum, not a guarantee of accuracy. Longer consistent records and comparable morning weigh-ins improve interpretation.",
      "No calorie target is changed. Only update_plan after the user chooses a target.",
    ],
    sourceNote:
      "Background on uncertainty only; these studies do not validate this implementation. Readiness thresholds and guardrails are conservative product heuristics.",
    backgroundSources: [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3127505/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3880593/",
    ],
  };
  if (reasons.length || average === null) return base;
  const slopes: number[] = [];
  for (let i = 0; i < weights.length; i++)
    for (let j = i + 1; j < weights.length; j++) {
      const gap = daysBetween(weights[i].date, weights[j].date);
      if (gap >= 3) slopes.push((weights[j].lbs - weights[i].lbs) / gap);
    }
  const slope = median(slopes),
    estimate = average - 3500 * slope;
  base.weightTrendLbPerWeek = round(slope * 7, 0.01);
  // Conservative product guard, not a medical threshold: fast trends may be water shifts.
  if (
    Math.abs(slope * 7) > median(weights.map((w) => w.lbs)) * 0.01 ||
    estimate < 1000 ||
    estimate > 6000 ||
    !Number.isFinite(estimate)
  ) {
    return {
      ...base,
      status: "unreliable_trend" as const,
      reasons: [
        "The weight trend or implied maintenance is outside this estimator's conservative guardrails. Check entries and collect a longer stable period; no calorie estimate is returned.",
      ],
    };
  }
  return {
    ...base,
    status: "provisional" as const,
    estimateKcalPerDay: round(estimate, 50),
    confidence: "low" as const,
  };
}
