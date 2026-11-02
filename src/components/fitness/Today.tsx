"use client";
import type { FunctionReturnType } from "convex/server";
import LiveSession from "./LiveSession";
import PageHeader from "./PageHeader";
import Sleep from "./Sleep";
import type { SleepData } from "../../../shared/sleep";
import { api } from "../../../convex/_generated/api";
type Data = FunctionReturnType<typeof api.fitness.dashboard> & {
  sleep?: SleepData;
};
export default function Today({ data }: { data: Data }) {
  const meals = data.meals.filter((m) => m.date === data.today);
  const workouts = data.workoutHistory.filter((w) => w.date === data.today);
  const protein = Math.round(meals.reduce((n, m) => n + m.protein, 0));
  const calories = Math.round(meals.reduce((n, m) => n + m.calories, 0));
  const steps = data.steps.filter((s) => s.date === data.today);
  return (
    <div>
      <PageHeader
        title="Today"
        detail={new Date(data.today + "T12:00:00Z").toLocaleDateString(
          "en-US",
          {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          },
        )}
      />
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
      </section>
      {(workouts.length > 0 || meals.length > 0) && (
        <details className="panel disclosure">
          <summary>Log</summary>
          {workouts.map((w) => (
            <p className="weekly-entry" key={w._id}>
              {w.label}
              <span>
                {w.kind === "lift"
                  ? `${w.exercises.reduce((n, e) => n + e.sets.length, 0)} sets`
                  : w.kind}
              </span>
            </p>
          ))}
          {meals.map((m) => (
            <p className="weekly-entry" key={m._id}>
              {m.name}
              <span>
                {Math.round(m.calories)} kcal · {Math.round(m.protein)} g
              </span>
            </p>
          ))}
        </details>
      )}
      <Sleep
        data={data.sleep}
        today={data.today}
        timezone={data.plan.timezone}
      />
    </div>
  );
}
