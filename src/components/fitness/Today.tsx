"use client";
import type { FunctionReturnType } from "convex/server";
import LiveSession from "./LiveSession";
import { sleepDuration, type SleepData } from "../../../shared/sleep";
import { api } from "../../../convex/_generated/api";
type Data = FunctionReturnType<typeof api.fitness.dashboard> & {
  sleep?: SleepData;
};
export default function Today({ data }: { data: Data }) {
  const meals = data.meals.filter((m) => m.date === data.today);
  const protein = Math.round(meals.reduce((n, m) => n + m.protein, 0));
  const calories = Math.round(meals.reduce((n, m) => n + m.calories, 0));
  const steps = data.steps.filter((s) => s.date === data.today);
  const night = data.sleep?.nights.find((n) => n.date === data.today);
  return (
    <div>
      <LiveSession />
      <section className="today-numbers" aria-label="Today's totals">
        <div>
          <span>Calories</span>
          <strong>{meals.length ? calories.toLocaleString() : "—"}</strong>
          {data.plan.targets.calories !== null && (
            <small>
              {Math.max(
                0,
                data.plan.targets.calories - calories,
              ).toLocaleString()}{" "}
              remaining
            </small>
          )}
        </div>
        <div>
          <span>Protein</span>
          <strong>{meals.length ? `${protein} g` : "—"}</strong>
          <small>
            {Math.max(0, data.plan.targets.protein - protein)} g remaining
          </small>
        </div>
        <div>
          <span>Steps</span>
          <strong>
            {steps.length
              ? steps.reduce((n, s) => n + s.count, 0).toLocaleString()
              : "—"}
          </strong>
        </div>
        <div>
          <span>Sleep</span>
          <strong>{night ? sleepDuration(night.seconds) : "—"}</strong>
        </div>
      </section>
    </div>
  );
}
