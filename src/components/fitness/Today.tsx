"use client";
import type { FunctionReturnType } from "convex/server";
import LiveSession from "./LiveSession";
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
      <div className="section-title view-title">
        <h1>Today</h1>
        <span>
          {new Date(data.today + "T12:00:00Z").toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}
        </span>
      </div>
      <LiveSession />
      <section className="today-numbers" aria-label="Today's totals">
        <div>
          <span>Calories</span>
          <strong>{meals.length ? calories.toLocaleString() : "—"}</strong>
          <small>
            {data.plan.targets.calories === null
              ? "No target set"
              : `${Math.max(0, data.plan.targets.calories - calories).toLocaleString()} remaining`}
          </small>
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
          <small>{steps.length ? "Logged today" : "Not logged"}</small>
        </div>
      </section>
      <Sleep
        data={data.sleep}
        today={data.today}
        timezone={data.plan.timezone}
      />
      <section className="panel">
        <h2>Logged today</h2>
        {!workouts.length && !meals.length && (
          <p className="muted">No workouts or meals logged.</p>
        )}
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
        <details className="metric-note">
          <summary>Log with your connected chat</summary>
          <p>
            Tell Claude or ChatGPT what you did or ate and ask it to log to
            Supermedium. This view refreshes automatically.
          </p>
        </details>
      </section>
    </div>
  );
}
