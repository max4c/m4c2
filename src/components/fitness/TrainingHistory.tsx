"use client";
import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { exerciseHistory } from "../../../shared/exercise-history";
import { canonicalExerciseName } from "../../../shared/training";
import { normalize } from "../../../shared/model";
type Data = FunctionReturnType<typeof api.fitness.dashboard>;
export default function TrainingHistory({ data }: { data: Data }) {
  const [month, setMonth] = useState(data.today.slice(0, 7));
  const [day, setDay] = useState(data.today);
  const [selected, setSelected] = useState("");
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
    data.today,
  ]
    .sort()[0]
    .slice(0, 7);
  const workouts = data.workoutHistory.filter((w) => w.date === day);
  return (
    <section id="training" className="training-history">
      <div className="section-title">
        <h2>Training</h2>
      </div>
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
            <button
              aria-label="Next month"
              disabled={month >= data.today.slice(0, 7)}
              onClick={() => move(1)}
            >
              →
            </button>
          </div>
          <details className="metric-note">
            <summary>About these numbers</summary>
            <p>Calories logged each day · ● workout logged</p>
          </details>
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
        <article className="panel">
          <h3>
            {new Date(day + "T12:00:00Z").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </h3>
          <p>
            {data.mealCalendar[day]
              ? `${Math.round(data.mealCalendar[day].calories).toLocaleString()} calories · ${data.mealCalendar[day].meals} meal${data.mealCalendar[day].meals === 1 ? "" : "s"} logged`
              : "No meals logged."}
          </p>
          {workouts.length ? (
            workouts.map((w) => (
              <div className="session" key={w._id}>
                <h4>
                  {w.label} <small>{w.kind}</small>
                </h4>
                {w.exercises.map((e, i) => (
                  <button
                    className="exercise-row"
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
                      {e.sets.map((s) => `${s.w} × ${s.r}`).join(" · ")} →
                    </span>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="empty">No workouts logged for this day.</div>
          )}
          <details className="metric-note">
            <summary>About these numbers</summary>
            <p>
              Tap an exercise for its full history. Loads in lb; timed entries
              use seconds, carries use metres.
            </p>
          </details>
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
        {!names.length && (
          <p className="empty">
            Log your first workout in Claude or ChatGPT. Every exercise and set
            will appear here.
          </p>
        )}
        {history && (
          <>
            <div className="record-grid">
              <div>
                <small>HEAVIEST LOGGED SET</small>
                <strong>
                  {history.heaviest
                    ? `${history.heaviest.w} lb × ${history.heaviest.r} ${history.mode === "timed" ? "sec" : history.mode === "carry" ? "m" : "reps"}`
                    : "—"}
                </strong>
                <span>{history.heaviest?.date}</span>
              </div>
              <div>
                <small>BEST SESSION VOLUME</small>
                <strong>
                  {history.bestSession
                    ? `${history.bestSession.volume.toLocaleString()} lb × reps`
                    : "Not applicable"}
                </strong>
                <span>{history.bestSession?.date}</span>
              </div>
              <div>
                <small>LIFETIME VOLUME</small>
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
              <summary>About these numbers</summary>
              <p>
                Recorded load × reps; no per-hand doubling. These are logged
                records, not estimated one-rep maxes.
              </p>
            </details>
            <details>
              <summary>Best performance at each weight</summary>
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
            <h4>All logged sessions</h4>
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
