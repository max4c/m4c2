import type { QueryCtx } from "./_generated/server";
import { addDays, todayAt, type Plan } from "../shared/model";
import { estimateMaintenance } from "../shared/maintenance";
export async function readMaintenance(
  ctx: QueryCtx,
  plan: Plan,
  asOf?: string,
  days = 28,
) {
  const yesterday = addDays(todayAt(Date.now(), plan.timezone), -1);
  const end = asOf ?? yesterday;
  if (end > yesterday)
    throw new Error(
      "Maintenance uses finished calendar days only; asOf must be yesterday or earlier in plan.timezone",
    );
  const start = addDays(end, 1 - days);
  const [meals, weights, foodDays] = await Promise.all([
    ctx.db
      .query("meals")
      .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
      .collect(),
    ctx.db
      .query("weights")
      .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
      .collect(),
    ctx.db
      .query("foodDays")
      .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
      .collect(),
  ]);
  return {
    ...estimateMaintenance({ meals, weights, foodDays }, end, days),
    timezone: plan.timezone,
    currentCalorieTarget: plan.targets.calories,
    targetChanged: false,
  };
}
export function calorieBudget(
  target: number | null,
  estimate: Awaited<ReturnType<typeof readMaintenance>>,
) {
  return {
    calories: target ?? estimate.estimateKcalPerDay,
    basis:
      target !== null
        ? "target"
        : estimate.estimateKcalPerDay !== null
          ? "maintenance_estimate"
          : "unavailable",
    provisional: target === null && estimate.estimateKcalPerDay !== null,
    targetChanged: false,
  };
}
