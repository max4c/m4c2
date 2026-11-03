"use client";
/* eslint-disable @next/next/no-img-element -- Private photos bypass public image optimization. */
import { useState, type ReactNode } from "react";
import type { FunctionReturnType } from "convex/server";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../../convex/_generated/api";
import { trendWindows } from "../../../shared/trends";
import { sleepDuration, type SleepData } from "../../../shared/sleep";
import PageHeader from "./PageHeader";

type Data = FunctionReturnType<typeof api.fitness.dashboard> & {
  sleep?: SleepData;
};
const number = (value: number | null, unit = "", digits = 0) =>
  value === null
    ? "—"
    : `${value.toLocaleString("en-US", { maximumFractionDigits: digits })}${unit}`;
const shortDate = (date: string) =>
  new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
function Value({
  children,
  days,
  note,
}: {
  children: ReactNode;
  days?: number;
  note?: string;
}) {
  return (
    <td>
      <strong>{children}</strong>
      {days !== undefined && days > 0 && (
        <small>
          {days} day{days === 1 ? "" : "s"} logged
        </small>
      )}
      {note && <small>{note}</small>}
    </td>
  );
}
function Photo({ photo }: { photo: Data["photos"][number] }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure>
      {failed ? (
        <div className="photo-placeholder">Upload pending</div>
      ) : (
        <img
          loading="lazy"
          alt={`Progress photo ${photo.date}`}
          src={`/fitness/api/photo/${photo.r2Key}`}
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>{photo.date}</figcaption>
    </figure>
  );
}

export default function Trends({
  data,
  days,
  setDays,
}: {
  data: Data;
  days: 7 | 30;
  setDays: (days: 7 | 30) => void;
}) {
  const { current, previous } = trendWindows(
    { ...data, workouts: data.workoutHistory },
    data.today,
    days,
  );
  const columns = [current, previous];
  const weights = [...data.weights]
    .filter((w) => w.date >= current.start && w.date <= current.end)
    .sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
  const bodyDetails =
    weights.length > 1 ||
    data.measurements.length > 0 ||
    data.photos.length > 0;
  return (
    <div className="trends-page">
      <PageHeader title="Trends" />
      <div className="segmented trends-range" aria-label="Comparison period">
        {([7, 30] as const).map((n) => (
          <button key={n} aria-pressed={days === n} onClick={() => setDays(n)}>
            {n} days
          </button>
        ))}
      </div>
      <table className="trends-comparison">
        <caption className="sr-only">
          Logged activity: last {days} days compared with the previous {days}{" "}
          days
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Metric</span>
            </th>
            {columns.map((w, i) => (
              <th scope="col" key={w.end}>
                {i === 0 ? `Last ${days} days` : `Previous ${days}`}
                <small>
                  {shortDate(w.start)}–{shortDate(w.end)}
                </small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="trends-group">
            <th colSpan={3}>Training</th>
          </tr>
          <tr>
            <th scope="row">Lift days</th>
            {columns.map((w) => (
              <Value key={w.end}>{w.lifts}</Value>
            ))}
          </tr>
          <tr>
            <th scope="row">Sets</th>
            {columns.map((w) => (
              <Value key={w.end}>{w.sets}</Value>
            ))}
          </tr>
          <tr>
            <th scope="row">Cardio sessions</th>
            {columns.map((w) => (
              <Value
                key={w.end}
                note={
                  w.cardioMinutes === null
                    ? undefined
                    : `${number(w.cardioMinutes)}${w.cardioTimed < w.cardio ? "+" : ""} min logged`
                }
              >
                {w.cardio}
              </Value>
            ))}
          </tr>
          <tr>
            <th scope="row">Steps / day</th>
            {columns.map((w) => (
              <Value key={w.end} days={w.coverage.stepDays}>
                {number(w.steps)}
              </Value>
            ))}
          </tr>
          <tr className="trends-group">
            <th colSpan={3}>Food</th>
          </tr>
          <tr>
            <th scope="row">Calories / day</th>
            {columns.map((w) => (
              <Value key={w.end} days={w.coverage.mealDays}>
                {number(w.calories)}
              </Value>
            ))}
          </tr>
          <tr>
            <th scope="row">Protein / day</th>
            {columns.map((w) => (
              <Value key={w.end}>{number(w.protein, " g")}</Value>
            ))}
          </tr>
          <tr className="trends-group">
            <th colSpan={3}>Body</th>
          </tr>
          <tr>
            <th scope="row">Average weight</th>
            {columns.map((w) => (
              <Value key={w.end} days={w.coverage.weightDays}>
                {number(w.weight, " lb", 1)}
              </Value>
            ))}
          </tr>
          {bodyDetails && (
            <tr className="trends-details">
              <td colSpan={3}>
                {weights.length > 1 && (
                  <details className="disclosure">
                    <summary>Weight history</summary>
                    <div
                      className="chart"
                      aria-label="Logged body weight in pounds"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={weights}
                    margin={{ top: 12, right: 20, bottom: 0, left: -12 }}
                        >
                          <XAxis
                            dataKey="date"
                            tickFormatter={shortDate}
                            minTickGap={40}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                          />
                          <Tooltip
                            formatter={(value) => [`${value} lb`, "Weight"]}
                            contentStyle={{
                              background: "var(--paper)",
                              border: "1px solid var(--line)",
                              color: "var(--ink)",
                            }}
                          />
                          <Line
                            dataKey="lbs"
                            name="Weight"
                            stroke="var(--ink)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </details>
                )}
                {!!data.measurements.length && (
                  <details className="disclosure">
                    <summary>Measurements</summary>
                    {[...data.measurements].reverse().map((m) => (
                      <div className="measurement-entry" key={m._id}>
                        <strong>{shortDate(m.date)}</strong>
                        <p>
                          Arm {m.arm}″ · Shoulders {m.shoulders}″<br />
                          Chest {m.chest}″ · Waist {m.waist}″
                        </p>
                      </div>
                    ))}
                  </details>
                )}
                {!!data.photos.length && (
                  <details className="disclosure">
                    <summary>Photos</summary>
                    <div className="photos">
                      {data.photos.map((p) => (
                        <Photo key={p._id} photo={p} />
                      ))}
                    </div>
                  </details>
                )}
              </td>
            </tr>
          )}
          <tr className="trends-group">
            <th colSpan={3}>Sleep</th>
          </tr>
          <tr>
            <th scope="row">Average night</th>
            {columns.map((w) => (
              <Value
                key={w.end}
                note={
                  w.coverage.nights
                    ? `${w.coverage.nights} night${w.coverage.nights === 1 ? "" : "s"} logged`
                    : undefined
                }
              >
                {w.sleep === null ? "—" : sleepDuration(w.sleep)}
              </Value>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="trends-note">
        Averages use logged days. Food logs may be partial.
      </p>
    </div>
  );
}
