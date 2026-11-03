"use client";
import FloatingNav, { type DashboardView } from "./FloatingNav";
import { RestTimerProvider } from "./RestTimer";
import Today from "./Today";
import Settings from "./Settings";
import TimerPage from "./TimerPage";
import PageHeader from "./PageHeader";
import Goals from "./Goals";
import Routine from "./Routine";
import Trends from "./Trends";
import type { SleepData } from "../../../shared/sleep";
import TrainingHistory, { type HistorySelection } from "./TrainingHistory";
import React, { useState, useEffect } from "react";

import { api } from "../../../convex/_generated/api";
import { type FunctionReturnType } from "convex/server";

type DashboardData = FunctionReturnType<typeof api.fitness.dashboard> & {
  sleep?: SleepData;
};
export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <RestTimerProvider>
      <DashboardContent data={data} />
    </RestTimerProvider>
  );
}
function DashboardContent({ data }: { data: DashboardData }) {
  const { plan } = data;
  const [view, setView] = useState<DashboardView>("today");
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [historySelection, setHistorySelection] = useState<HistorySelection>({
    month: data.today.slice(0, 7),
    day: data.today,
    exercise: "",
  });
  const [settingsReturn, setSettingsReturn] = useState<DashboardView>("today");
  useEffect(() => {
    let previous: DashboardView = "today";
    const sync = () => {
      const hash = window.location.hash.slice(1);
      const next: DashboardView = [
        "history",
        "trends",
        "goals",
        "routine",
        "timer",
        "settings",
      ].includes(hash)
        ? (hash as DashboardView)
        : "today";
      if (
        next === "settings" &&
        !["settings", "goals", "routine"].includes(previous)
      )
        setSettingsReturn(previous);
      previous = next;
      setView(next);
      window.scrollTo(0, 0);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  if (view === "timer") return <TimerPage />;
  return (
    <main className="fitness-dashboard">
      {process.env.NEXT_PUBLIC_FITNESS_TEST_DATA === "true" && (
        <span className="live">Test data</span>
      )}
      {view === "today" && <Today data={data} />}
      {view === "settings" && (
        <Settings sleep={data.sleep} backHref={`#${settingsReturn}`} />
      )}
      {view === "goals" && <Goals plan={plan} />}
      {view === "routine" && (
        <Routine plan={plan} next={data.nextSession.next} />
      )}
      {view === "history" && (
        <>
          <PageHeader title="History" />
          <TrainingHistory
            data={data}
            selection={historySelection}
            onSelectionChange={setHistorySelection}
          />
        </>
      )}
      {view === "trends" && (
        <Trends data={data} days={trendDays} setDays={setTrendDays} />
      )}
      <FloatingNav active={view} />
    </main>
  );
}
function Gate({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="gate">
      <PageHeader title={title} />
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
        <PageHeader title="Sign in" />
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
