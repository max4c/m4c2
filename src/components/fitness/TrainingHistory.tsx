"use client";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { exerciseHistory } from "../../../shared/exercise-history";
import { canonicalExerciseName } from "../../../shared/training";
import { normalize } from "../../../shared/model";
import { sleepDuration, type SleepData } from "../../../shared/sleep";
type Data = FunctionReturnType<typeof api.fitness.dashboard> & {
  sleep?: SleepData;
};
export type HistorySelection = { month: string; day: string; exercise: string };
export default function TrainingHistory({
  data,
  selection,
  onSelectionChange,
}: {
  data: Data;
  selection: HistorySelection;
  onSelectionChange: (selection: HistorySelection) => void;
}) {
  const { month, day, exercise: selected } = selection;
  const setMonth = (month: string) =>
    onSelectionChange({ ...selection, month });
  const setDay = (day: string) => onSelectionChange({ ...selection, day });
  const setSelected = (exercise: string) =>
    onSelectionChange({ ...selection, exercise });
  const names = [
    ...new Map(
      data.workoutHistory.flatMap((w) =>
        w.exercises.map(
          (e) =>
            [
              normalize(canonicalExerciseName(e.name, data.plan)),
              canonicalExerciseName(e.name, data.plan),
            ] as const,
        ),
      ),
    ).values(),
  ].sort();
  const history = selected
    ? exerciseHistory(data.workoutHistory, selected, data.plan)
    : null;
  const first = new Date(month + "-01T12:00:00Z");
  const count = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  function move(n: number) {
    const d = new Date(first);
    d.setUTCMonth(d.getUTCMonth() + n);
    setMonth(d.toISOString().slice(0, 7));
  }
  const earliest = [
    ...Object.keys(data.mealCalendar),
    ...data.workoutHistory.map((w) => w.date),
    ...data.steps.map((s) => s.date),
    ...data.weights.map((w) => w.date),
    ...(data.sleep?.nights.map((n) => n.date) ?? []),
    data.today,
  ]
    .sort()[0]
    .slice(0, 7);
  const workouts = data.workoutHistory.filter((w) => w.date === day);
  const meals = data.meals
    .filter((m) => m.date === day)
    .sort((a, b) => a.ts - b.ts);
  const steps = data.steps.filter((s) => s.date === day);
  const weights = data.weights.filter((w) => w.date === day);
  const night = data.sleep?.nights.find((n) => n.date === day);
  return (
    <section id="training" className="training-history">
      <div className="two-col">
        <article className="panel">
          <div className="calendar-heading">
            <button
              aria-label="Previous month"
              disabled={month <= earliest}
              onClick={() => move(-1)}
            >
              ←
            </button>
            <h3>
              {first.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </h3>
            {month < data.today.slice(0, 7) ? (
              <button aria-label="Next month" onClick={() => move(1)}>
                →
              </button>
            ) : (
              <span className="calendar-button-space" aria-hidden="true" />
            )}
          </div>
          <div className="calendar-grid">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={"weekday" + i} className="weekday">
                {d}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={"blank" + i} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const date = month + "-" + String(i + 1).padStart(2, "0");
              const meal = data.mealCalendar[date];
              const trained = data.workoutHistory.some((w) => w.date === date);
              return (
                <button
                  key={date}
                  disabled={date > data.today}
                  aria-pressed={date === day}
                  aria-label={`${date}: ${meal ? Math.round(meal.calories) + " calories logged" : "no meals logged"}${trained ? ", workout logged" : ""}`}
                  onClick={() => setDay(date)}
                >
                  <b>{i + 1}</b>
                  <small>
                    {meal ? Math.round(meal.calories).toLocaleString() : "—"}
                  </small>
                  <span aria-hidden="true">{trained ? "●" : "\u00a0"}</span>
                </button>
              );
            })}
          </div>
        </article>
        <article className="panel day-history" key={day}>
          <h3>
            {new Date(day + "T12:00:00Z").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </h3>
          <div className="day-numbers">
            <div>
              <span>Calories</span>
              <strong>
                {data.mealCalendar[day]
                  ? Math.round(data.mealCalendar[day].calories).toLocaleString()
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Protein</span>
              <strong>
                {meals.length
                  ? `${Math.round(meals.reduce((sum, m) => sum + m.protein, 0))} g`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Steps</span>
              <strong>
                {steps.length
                  ? steps.reduce((sum, s) => sum + s.count, 0).toLocaleString()
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Sleep</span>
              <strong>{night ? sleepDuration(night.seconds) : "—"}</strong>
            </div>
            {!!weights.length && (
              <div>
                <span>Weight</span>
                <strong>{weights.at(-1)?.lbs} lb</strong>
              </div>
            )}
          </div>
          {workouts.map((w) => (
            <details className="disclosure day-workout" key={w._id}>
              <summary>{w.label}</summary>
              {(w.durationMin != null || w.distanceMi != null) && (
                <p>
                  {[
                    w.durationMin != null ? `${w.durationMin} min` : null,
                    w.distanceMi != null
                      ? `${w.distanceMi}${w.distanceMiMax != null ? `–${w.distanceMiMax}` : ""} mi`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {w.exercises.map((e, i) => (
                <button
                  className="exercise-row"
                  aria-label={`View ${e.name} history`}
                  key={i}
                  onClick={() => {
                    setSelected(canonicalExerciseName(e.name, data.plan));
                    document
                      .getElementById("exercise-records")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                >
                  <strong>{e.name}</strong>
                  <span>
                    {e.sets.map((s) => `${s.w} × ${s.r}`).join(" · ")}
                  </span>
                </button>
              ))}
            </details>
          ))}
          {!!data.mealCalendar[day] && (
            <details className="disclosure day-meals">
              <summary>Meals · {data.mealCalendar[day].meals}</summary>
              {meals.length ? (
                meals.map((m) => (
                  <div className="day-meal" key={m._id}>
                    <strong>{m.name}</strong>
                    <p>
                      {Math.round(m.calories)} kcal · {Math.round(m.protein)} g
                      protein
                    </p>
                    <small>
                      {Math.round(m.carbs)} g carbs · {Math.round(m.fat)} g fat
                    </small>
                    {m.note && <p className="muted">{m.note}</p>}
                  </div>
                ))
              ) : (
                <p className="muted">
                  Meal details are available for the last 90 days.
                </p>
              )}
            </details>
          )}
        </article>
      </div>
      <article id="exercise-records" className="panel exercise-detail">
        <label htmlFor="exercise">
          <h3>Exercise records</h3>
        </label>
        <select
          id="exercise"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose an exercise</option>
          {names.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        {!names.length && <p className="empty">No exercises logged.</p>}
        {history && (
          <>
            <div className="record-grid">
              <div>
                <small>Heaviest set</small>
                <strong>
                  {history.heaviest
                    ? `${history.heaviest.w} lb × ${history.heaviest.r} ${history.mode === "timed" ? "sec" : history.mode === "carry" ? "m" : "reps"}`
                    : "—"}
                </strong>
                <span>{history.heaviest?.date}</span>
              </div>
              <div>
                <small>Best session volume</small>
                <strong>
                  {history.bestSession
                    ? `${history.bestSession.volume.toLocaleString()} lb × reps`
                    : "Not applicable"}
                </strong>
                <span>{history.bestSession?.date}</span>
              </div>
              <div>
                <small>Total volume</small>
                <strong>
                  {history.totalVolume === null
                    ? "Not applicable"
                    : `${history.totalVolume.toLocaleString()} lb × reps`}
                </strong>
                <span>
                  {history.sessionCount} sessions · {history.setCount} sets
                </span>
              </div>
            </div>
            <details className="metric-note">
              <summary>Details</summary>
              <p>
                Recorded load × reps; no per-hand doubling. These are logged
                records, not estimated one-rep maxes.
              </p>
            </details>
            <details>
              <summary>Best at each weight</summary>
              {history.bestRepsByWeight.map((s) => (
                <p key={s.w}>
                  {s.w} lb × {s.r}{" "}
                  {history.mode === "timed"
                    ? "seconds"
                    : history.mode === "carry"
                      ? "metres"
                      : "reps"}{" "}
                  · {s.date}
                </p>
              ))}
            </details>
            <h4>Sessions</h4>
            {history.sessions.map((s, i) => (
              <div className="exercise-session" key={i}>
                <strong>
                  {s.date} · {s.label}
                </strong>
                <span>
                  {s.sets
                    .map((set, j) => `Set ${j + 1}: ${set.w} lb × ${set.r}`)
                    .join(" · ")}
                </span>
                {history.mode === "weighted" && (
                  <small>{s.volume.toLocaleString()} lb × reps</small>
                )}
              </div>
            ))}
          </>
        )}
      </article>
    </section>
  );
}
