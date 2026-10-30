"use client";
/* eslint-disable @next/next/no-img-element -- Private token URLs must bypass public image optimization. */
import FloatingNav, { type DashboardView } from "./FloatingNav";
import { RestTimerProvider } from "./RestTimer";
import Today from "./Today";
import Goals from "./Goals";
import Routine from "./Routine";
import Sleep from "./Sleep";
import type { SleepData } from "../../../shared/sleep";
import WeeklyOverview from "./WeeklyOverview";
import TrainingHistory from "./TrainingHistory";
import React, { useState, useEffect } from "react";

import { api } from "../../../convex/_generated/api";
import { type FunctionReturnType } from "convex/server";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { addDays, periodStart } from "../../../shared/model";
import { summarize } from "../../../shared/analytics";

type DashboardData = FunctionReturnType<typeof api.fitness.dashboard> & {
  sleep?: SleepData;
};
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
function Trend({
  data,
  series,
  unit,
  target,
}: {
  data: Record<string, unknown>[];
  series: { key: string; color: string }[];
  unit: string;
  target?: number;
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 14, right: 12, bottom: 0, left: -8 }}
        >
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="date"
            tickFormatter={(s) => String(s).slice(5)}
            minTickGap={40}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--muted)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            domain={unit === "lb" ? ["auto", "auto"] : [0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
            }}
            labelFormatter={(l) => String(l)}
            formatter={(v, name) => [`${v} ${unit}`, name]}
          />
          {target !== undefined && (
            <ReferenceLine y={target} stroke="#9ca77e" strokeDasharray="4 4" />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.key}
              stroke={s.color}
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
function Photo({ photo }: { photo: DashboardData["photos"][number] }) {
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
export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <RestTimerProvider>
      <DashboardContent data={data} />
    </RestTimerProvider>
  );
}
function DashboardContent({ data }: { data: DashboardData }) {
  const { plan, today, week } = data;
  const [view, setView] = useState<DashboardView>("today");
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      setView(
        hash === "history" ||
          hash === "trends" ||
          hash === "goals" ||
          hash === "routine"
          ? hash
          : "today",
      );
      window.scrollTo(0, 0);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const [range, setRange] = useState(30);
  const start = addDays(today, 1 - range);
  const protein = Array.from({ length: range }, (_, i) => {
    const date = addDays(start, i),
      meals = data.meals.filter((m) => m.date === date);
    return {
      date,
      protein: meals.length
        ? Math.round(meals.reduce((s, m) => s + m.protein, 0))
        : null,
    };
  });
  const weights = data.weights
    .filter((w) => w.date >= start)
    .sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts)
    .map((w) => ({ date: w.date, weight: w.lbs }));
  const stats = week.THE_THREE_NUMBERS!;
  const recent = [...data.meals]
    .sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts)
    .slice(0, 5);
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const date = addDays(periodStart(today, "week"), (i - 7) * 7);
    const end = addDays(date, 6) > today ? today : addDays(date, 6);
    return { date, ...summarize(data, plan, end, "week") };
  });
  return (
    <main className="fitness-dashboard">
      {process.env.NEXT_PUBLIC_FITNESS_TEST_DATA === "true" && (
        <span className="live">Test data</span>
      )}
      {view === "today" && <Today data={data} />}
      {view === "goals" && <Goals plan={plan} />}
      {view === "routine" && (
        <Routine plan={plan} next={data.nextSession.next} />
      )}
      {view === "history" && (
        <>
          <div className="section-title view-title">
            <h1>History</h1>
          </div>
          <TrainingHistory data={data} />
        </>
      )}
      {view === "trends" && (
        <>
          <div className="section-title view-title">
            <h1>Trends</h1>
          </div>
          <section id="overview" aria-label="This week">
            <div className="section-title">
              <h2>This week</h2>
              <span>
                {periodStart(today, "week").slice(5)} – {today.slice(5)}
              </span>
            </div>
            <div className="score-grid">
              {[
                {
                  title: "Lifts",
                  value: stats.lifts.value,
                  unit: "sessions",
                  target: `${plan.targets.liftsMin}–${plan.targets.liftsMax} per week`,
                  pass: stats.lifts.pass,
                  max: plan.targets.liftsMin,
                },
                {
                  title: "Movement",
                  value: stats.movementDays.value,
                  unit: "/ 7 days",
                  target: `${plan.targets.movementDays} days per week`,
                  pass: stats.movementDays.pass,
                  max: plan.targets.movementDays,
                },
                {
                  title: "Daily protein",
                  value: stats.proteinAvg.value,
                  unit: "g avg",
                  target: `${plan.targets.protein}g per day`,
                  pass: stats.proteinAvg.pass,
                  max: plan.targets.protein,
                },
              ].map((s, i) => (
                <article className={`score score-${i}`} key={s.title}>
                  <div className="score-label">{s.title}</div>
                  <div className="big-number">
                    {s.value}
                    <span>{s.unit}</span>
                  </div>
                  <div className="track">
                    <span
                      style={{
                        width: `${Math.min(100, (s.value / s.max) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="score-bottom">
                    <strong>{s.target}</strong>
                  </div>
                </article>
              ))}
            </div>
            <details className="metric-note">
              <summary>About these numbers</summary>
              <p>
                Week-to-date averages include unlogged days.{" "}
                {week.coverage.mealDays} of {week.elapsedDays} days have meal
                logs.
              </p>
            </details>
          </section>
          <WeeklyOverview data={data} />
          <section id="charts">
            <div className="section-title">
              <h2>Over time</h2>
              <div className="segmented" aria-label="Chart period">
                {[30, 90].map((n) => (
                  <button
                    key={n}
                    aria-pressed={range === n}
                    onClick={() => setRange(n)}
                  >
                    {n} days
                  </button>
                ))}
              </div>
            </div>
            <div className="two-col">
              <article className="panel">
                <div className="panel-top">
                  <h3>Protein</h3>
                  <span>
                    GRAMS / DAY{" "}
                    <b className="legend">— {plan.targets.protein}g target</b>
                  </span>
                </div>
                {data.meals.length ? (
                  <Trend
                    data={protein}
                    series={[{ key: "protein", color: "#628451" }]}
                    unit="g"
                    target={plan.targets.protein}
                  />
                ) : (
                  <Empty>
                    No meals yet.
                    <small>Log a meal in your connected chat.</small>
                  </Empty>
                )}
              </article>
              <article className="panel">
                <div className="panel-top">
                  <h3>Body weight</h3>
                  <span>POUNDS</span>
                </div>
                {weights.length ? (
                  <Trend
                    data={weights}
                    series={[{ key: "weight", color: "#b28255" }]}
                    unit="lb"
                  />
                ) : (
                  <Empty>No weigh-ins yet.</Empty>
                )}
              </article>
            </div>
          </section>
          <section className="two-col">
            <article className="panel">
              <div className="panel-top">
                <h3>Weekly activity</h3>
                <span>LAST 8 WEEKS</span>
              </div>
              <div className="rhythm-key">
                <span>
                  <i /> Lifts · {plan.targets.liftsMin}–{plan.targets.liftsMax}
                </span>
                <span>
                  <i /> Movement · {plan.targets.movementDays}/7
                </span>
              </div>
              <div className="weeks">
                {weekly.map((w) => (
                  <div className="week" key={w.date}>
                    <div className="bar-pair">
                      <div
                        className="week-bar lifts"
                        style={{
                          height: `${Math.max(2, (w.lifts / 10) * 100)}%`,
                        }}
                        title={`${w.lifts} lifts`}
                      >
                        {w.lifts > 0 && <span>{w.lifts}</span>}
                      </div>
                      <div
                        className="week-bar movement"
                        style={{
                          height: `${Math.max(2, (w.movementDays / 10) * 100)}%`,
                        }}
                        title={`${w.movementDays} movement days`}
                      >
                        {w.movementDays > 0 && <span>{w.movementDays}</span>}
                      </div>
                    </div>
                    <small>{w.date.slice(5)}</small>
                  </div>
                ))}
              </div>
              <details className="metric-note">
                <summary>About these numbers</summary>
                <p>Movement = a workout or positive self-reported steps.</p>
              </details>
            </article>
            <article className="panel">
              <div className="panel-top">
                <h3>Sets by muscle</h3>
                <span>HARD SETS / THIS WEEK</span>
              </div>
              <div className="muscles">
                {Object.entries(week.hardSets)
                  .filter(([m]) => m !== "unmapped")
                  .map(([m, n]) => (
                    <div className="muscle" key={m}>
                      <span>{m}</span>
                      <div className="muscle-track">
                        {["biceps", "triceps", "shoulders"].includes(m) && (
                          <div
                            className="target-band"
                            style={{
                              left: `${(plan.targets.setsMin / Math.max(20, plan.targets.setsMax, n)) * 100}%`,
                              width: `${((plan.targets.setsMax - plan.targets.setsMin) / Math.max(20, plan.targets.setsMax, n)) * 100}%`,
                            }}
                          />
                        )}
                        <div
                          className="muscle-fill"
                          style={{
                            width: `${Math.min(100, (n / Math.max(20, plan.targets.setsMax, n)) * 100)}%`,
                          }}
                        />
                      </div>
                      <strong>{n}</strong>
                    </div>
                  ))}
              </div>
              <details className="metric-note">
                <summary>About these numbers</summary>
                <p>
                  Shaded band: {plan.targets.setsMin}–{plan.targets.setsMax}{" "}
                  sets for arms & shoulders. Primary muscle only.{" "}
                  {week.hardSets.unmapped} unmapped sets.
                </p>
              </details>
            </article>
          </section>
          <section className="two-col">
            <article className="panel">
              <div className="panel-top">
                <h3>Measurements</h3>
                <span>INCHES / MONTHLY</span>
              </div>
              {data.measurements.length ? (
                <>
                  <Trend
                    data={data.measurements}
                    series={[
                      { key: "arm", color: "#527c50" },
                      { key: "shoulders", color: "#b28255" },
                      { key: "chest", color: "#748ba4" },
                      { key: "waist", color: "#9d729a" },
                    ]}
                    unit="in"
                  />
                  <div className="measurement-key">
                    {["arm", "shoulders", "chest", "waist"].map((m, i) => (
                      <span
                        key={m}
                        style={{
                          color: ["#527c50", "#b28255", "#748ba4", "#9d729a"][
                            i
                          ],
                        }}
                      >
                        ● {m}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <Empty>
                  No measurements yet.
                  <small>
                    Your monthly tape measurements will appear here.
                  </small>
                </Empty>
              )}
            </article>
            <article className="panel">
              <div className="panel-top">
                <h3>Progress photos</h3>
              </div>
              {data.photos.length ? (
                <div className="photos">
                  {data.photos.map((p) => (
                    <Photo key={p._id} photo={p} />
                  ))}
                </div>
              ) : (
                <Empty>No photos yet.</Empty>
              )}
            </article>
          </section>
          <Sleep
            data={data.sleep}
            today={today}
            timezone={plan.timezone}
            history
          />
        </>
      )}
      {view === "history" && (
        <section id="meals" className="panel meals">
          <div className="panel-top">
            <h3>Recent meals</h3>
          </div>
          {recent.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>MEAL</th>
                    <th>WHEN</th>
                    <th>CALORIES</th>
                    <th>PROTEIN</th>
                    <th>QUALITY</th>
                    <th>SOURCE</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((m) => (
                    <tr key={m._id}>
                      <td>
                        {m.name}
                        <small>{m.note}</small>
                      </td>
                      <td data-label="Date">{m.date.slice(5)}</td>
                      <td data-label="Calories">{Math.round(m.calories)}</td>
                      <td data-label="Protein" className="protein-cell">
                        {Math.round(m.protein)}g
                      </td>
                      <td data-label="Quality">
                        {m.quality}
                        <span className="muted"> / 10</span>
                      </td>
                      <td data-label="Source">
                        <span className="source">{m.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>
              Nothing logged yet. Tell your connected chat what you ate.
            </Empty>
          )}
        </section>
      )}

      <footer>
        <button
          className="forget-device"
          onClick={async () => {
            const response = await fetch("/fitness/api/logout", {
              method: "POST",
            });
            if (response.ok) location.replace(location.pathname);
          }}
        >
          Sign out
        </button>
      </footer>
      <FloatingNav active={view} />
    </main>
  );
}
function Gate({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="gate">
      <h1>{title}</h1>
      {detail && <p>{detail}</p>}
    </div>
  );
}
export default function FitnessApp() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [sleep, setSleep] = useState<SleepData | undefined>();
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      const response = await fetch("/fitness/api/data", { cache: "no-store" });
      if (response.status === 401) {
        setData(null);
        setLocked(true);
        return;
      }
      if (!response.ok)
        throw Error("Your log is temporarily unavailable. Please retry.");
      setData(await response.json());
      void fetch("/fitness/api/sleep", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Sleep unavailable");
          setSleep(await response.json());
        })
        .catch(() =>
          setSleep({ status: "unavailable", nights: [], fetchedAt: null }),
        );
      setLocked(false);
      setError("");
    } catch {
      setError("Your log is temporarily unavailable. Please retry.");
    }
  }
  useEffect(() => {
    try {
      localStorage.removeItem("fitness-read-token");
    } catch {}
    if (location.hash.startsWith("#token="))
      history.replaceState(null, "", location.pathname);
    // This effect fetches external data; state updates happen after the request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  if (locked)
    return (
      <main className="gate">
        <h1>Sign in</h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/fitness/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
              });
              const result = await response.json();
              if (!response.ok) throw Error(result.error);
              setPassword("");
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to sign in.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p role="alert">{error}</p>
          <small>Stay signed in on this device for 30 days.</small>
        </form>
      </main>
    );
  if (data)
    return (
      <>
        <Dashboard data={{ ...data, sleep }} />
        {error && <p role="alert">{error}</p>}
      </>
    );
  return (
    <>
      <Gate title="Loading…" detail={error} />
      {error && <button onClick={() => void refresh()}>Retry</button>}
    </>
  );
}
