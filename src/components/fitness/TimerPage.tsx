"use client";
import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { formatTime, RestAlerts, useLiveSession } from "./RestTimer";
import ThemeToggle from "./ThemeToggle";

export default function TimerPage() {
  const { timer, remaining, start, stop, ready, session, connected } =
    useLiveSession();
  const [choice, setChoice] = useState<{
    seconds: number;
    eventId: string | null;
  } | null>(null);
  const selected =
    choice?.eventId === ready.eventId ? choice.seconds : ready.seconds;
  const active = !!timer && remaining > 0;
  const complete = !!timer && !remaining;
  const seconds = timer ? remaining : selected;
  const label =
    timer?.label ??
    (ready.seconds ? ready.label : ready.label.replace(/^Then /, "Next: "));
  const next = session?.next;
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null,
      disposed = false,
      pending = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible" || disposed || lock || pending)
        return;
      pending = true;
      try {
        const requested = await navigator.wakeLock.request("screen");
        if (disposed) {
          await requested.release();
          return;
        }
        lock = requested;
        requested.addEventListener(
          "release",
          () => {
            if (lock === requested) lock = null;
          },
          { once: true },
        );
      } catch {
        /* The countdown still uses its deadline if keeping the screen awake is unavailable. */
      } finally {
        pending = false;
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release().catch(() => {});
    };
  }, [active]);
  return (
    <main className="timer-page" aria-label="Rest timer">
      <header className="timer-header">
        <a href="#today">
          <ArrowLeftIcon aria-hidden="true" />
          Session
        </a>
        <ThemeToggle />
      </header>
      <div className="timer-face">
        <p className="timer-status" role="status">
          {complete
            ? "Rest complete"
            : !seconds && !timer
              ? "Finish the pair"
              : "Rest"}
        </p>
        <div
          className="timer-countdown"
          role="timer"
          aria-label={
            timer
              ? `${remaining} seconds remaining`
              : `${seconds} second rest selected`
          }
        >
          {seconds || timer ? formatTime(seconds) : "—:—"}
        </div>
        <p className="timer-exercise">{label === "Rest" ? null : label}</p>
      </div>
      <div className="timer-actions">
        {!active && (
          <div className="rest-presets" aria-label="Rest duration">
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                aria-label={`${s} second rest`}
                aria-pressed={selected === s}
                onClick={() => {
                  if (timer) stop();
                  setChoice({ seconds: s, eventId: ready.eventId });
                }}
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
        )}
        {active ? (
          <button className="timer-primary timer-stop" onClick={stop}>
            Stop
          </button>
        ) : complete ? (
          <button
            className="timer-primary"
            onClick={() => {
              stop();
              window.location.hash = "today";
            }}
          >
            Back to session
          </button>
        ) : (
          <button
            className="timer-primary"
            disabled={!selected}
            onClick={() =>
              start(
                choice?.eventId === ready.eventId ? "Rest" : ready.label,
                selected,
              )
            }
          >
            Start rest
          </button>
        )}
      </div>
      {next && (
        <div className="timer-next">
          <span>
            Next · set {next.setNumber} of {next.prescribedSets}
          </span>
          <strong>{next.exercise}</strong>
          <p>
            {next.target.load} × {next.target.reps ?? "—"}
          </p>
          {next.warmup && <small>{next.warmup}</small>}
        </div>
      )}
      {!connected && (
        <p className="timer-connection">
          {session ? "Session reconnecting" : "Connecting to session…"}
        </p>
      )}
      <RestAlerts />
    </main>
  );
}
