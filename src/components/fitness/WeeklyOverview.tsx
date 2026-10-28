"use client";
import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
type Data = FunctionReturnType<typeof api.fitness.dashboard>;
const number = (n: number | null, unit = "") =>
  n === null ? "Not logged" : `${Math.round(n).toLocaleString()}${unit}`;
export default function WeeklyOverview({ data }: { data: Data }) {
  const [index, setIndex] = useState(0);
  const week =
    data.weeklyHistory[Math.min(index, data.weeklyHistory.length - 1)];
  if (!week) return null;
  const previous = data.weeklyHistory[index + 1];
  const metrics = [
    [
      "Lifting sessions",
      number(week.lifts),
      previous ? number(previous.lifts) : null,
    ],
    [
      "Exercises",
      number(week.training.exerciseCount),
      previous ? number(previous.training.exerciseCount) : null,
    ],
    ["Unique exercises", number(week.training.uniqueExercises), null],
    [
      "Sets",
      number(week.training.sets),
      previous ? number(previous.training.sets) : null,
    ],
    [
      "Cardio sessions",
      number(week.training.cardioSessions),
      previous ? number(previous.training.cardioSessions) : null,
    ],
    ["Movement days", `${week.movementDays} / ${week.elapsedDays}`, null],
    [
      "Total steps",
      week.coverage.stepDays ? number(week.stepsDetail.total) : "Not logged",
      previous?.coverage.stepDays ? number(previous.stepsDetail.total) : null,
    ],
    [
      "Steps / logged day",
      number(week.stepsDetail.averageLoggedDay),
      previous ? number(previous.stepsDetail.averageLoggedDay) : null,
    ],
  ];
  return (
    <section id="weekly" className="weekly-overview">
      <div className="section-title">
        <h2>Weekly</h2>
        <span>
          {week.end === data.today ? "WEEK TO DATE" : "WEEKLY REVIEW"}
        </span>
      </div>
      <div className="week-picker">
        <button
          aria-label="Older week"
          disabled={index >= data.weeklyHistory.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          ←
        </button>
        <div>
          <strong>
            {week.start} — {week.end}
          </strong>
          <small>{week.elapsedDays} days · Monday start</small>
        </div>
        <button
          aria-label="Newer week"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          →
        </button>
      </div>
      <details className="metric-note">
        <summary>About these numbers</summary>
        <p>
          Counts reflect your logs. Previous-week figures cover that full week;
          the current week is still accumulating.
        </p>
      </details>
      <div className="weekly-metrics">
        {metrics.map(([label, value, prev]) => (
          <article className="panel weekly-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            {prev !== null && <small>Last week: {prev}</small>}
          </article>
        ))}
      </div>
      <details className="metric-note">
        <summary>About these numbers</summary>
        <p>
          Exercises counts each exercise once per workout; different exercises
          counts distinct names across the week. Steps logged on{" "}
          {week.coverage.stepDays} of {week.elapsedDays} days. Your usual steps:{" "}
          {number(week.stepsDetail.normalPrevious28Days)} per logged day across{" "}
          {week.stepsDetail.baselineDays} logged days in the preceding 28 days.
        </p>
      </details>
      <div className="two-col">
        <article className="panel">
          <h3>Nutrition</h3>
          <p>
            {week.nutrition.mealCount} meals · {week.coverage.mealDays} of{" "}
            {week.elapsedDays} days logged
          </p>
          <dl className="weekly-list">
            <dt>Calories logged</dt>
            <dd>{number(week.nutrition.caloriesTotal, " kcal")}</dd>
            <dt>Daily calories</dt>
            <dd>{number(week.nutrition.caloriesPerLoggedDay, " kcal")}</dd>
            <dt>Daily protein</dt>
            <dd>{number(week.nutrition.proteinPerLoggedDay, " g")}</dd>
            <dt>Daily carbs</dt>
            <dd>{number(week.nutrition.carbsPerLoggedDay, " g")}</dd>
            <dt>Daily fat</dt>
            <dd>{number(week.nutrition.fatPerLoggedDay, " g")}</dd>
            <dt>Average meal quality</dt>
            <dd>
              {week.nutrition.qualityAvg === null
                ? "Not logged"
                : `${week.nutrition.qualityAvg.toFixed(1)} / 10`}
            </dd>
          </dl>
          <details className="metric-note">
            <summary>About these numbers</summary>
            <p>
              Daily averages here use days with meal logs, which may still be
              incomplete. The weekly protein target above uses all elapsed days.
            </p>
          </details>
        </article>
        <article className="panel">
          <h3>Cardio & supplements</h3>
          <p>
            {week.training.easyCardio} easy · {week.training.hardCardio} hard
            cardio sessions
          </p>
          {week.training.cardioActivities.map((c, i) => (
            <p className="weekly-entry" key={i}>
              {c.date.slice(5)} · {c.label} <small>{c.intensity}</small>
            </p>
          ))}
          {!week.training.cardioSessions && (
            <p className="muted">No cardio logged this week.</p>
          )}
          <h4>Supplements · {week.supplementDays} days logged</h4>
          {week.supplementsDetail.length ? (
            week.supplementsDetail.map((s) => (
              <p className="weekly-entry" key={s.name}>
                {s.name}
                <strong>{s.days} days</strong>
              </p>
            ))
          ) : (
            <p className="muted">No supplements logged.</p>
          )}
        </article>
      </div>
      <div className="two-col">
        <article className="panel">
          <h3>Check-ins</h3>
          <dl className="weekly-list">
            <dt>Weigh-ins</dt>
            <dd>{week.checkIns.weighIns}</dd>
            <dt>Average logged weight</dt>
            <dd>
              {week.checkIns.weightAverage === null
                ? "Not logged"
                : `${week.checkIns.weightAverage.toFixed(1)} lb`}
            </dd>
            <dt>First → last weight</dt>
            <dd>
              {week.weightTrend.first === null
                ? "Not logged"
                : `${week.weightTrend.first} → ${week.weightTrend.last} lb`}
            </dd>
            <dt>Measurement check-ins</dt>
            <dd>{week.checkIns.measurements}</dd>
            <dt>Progress photos logged</dt>
            <dd>{week.checkIns.photos}</dd>
          </dl>
          {week.checkIns.latestMeasurements && (
            <details className="metric-note">
              <summary>About these numbers</summary>
              <p>
                Latest tape check ({week.checkIns.latestMeasurements.date}): arm{" "}
                {week.checkIns.latestMeasurements.arm}″ · shoulders{" "}
                {week.checkIns.latestMeasurements.shoulders}″ · chest{" "}
                {week.checkIns.latestMeasurements.chest}″ · waist{" "}
                {week.checkIns.latestMeasurements.waist}″.
              </p>
            </details>
          )}
        </article>
        <article className="panel">
          <h3>Hard sets by muscle</h3>
          <dl className="weekly-list">
            {Object.entries(week.hardSets).map(([muscle, sets]) => (
              <div className="weekly-muscle" key={muscle}>
                <dt>{muscle}</dt>
                <dd>{sets}</dd>
              </div>
            ))}
          </dl>
          <details className="metric-note">
            <summary>About these numbers</summary>
            <p>
              Primary muscle only; hard lifting sessions. “Unmapped” includes
              timed hangs, carries, and unrecognized exercise names. Photos
              count logged entries; uploads may be pending.
            </p>
          </details>
        </article>
      </div>
    </section>
  );
}
