"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { PlanExercise } from "../../../shared/model";
import { restLabel, restSeconds } from "../../../shared/training";
import {
  remainingSeconds,
  restoreTimer,
  type RestTimerState,
} from "../../../shared/rest-timer";

const key = "supermedium-rest-timer-v1";
const TimerContext = createContext<(label: string, seconds: number) => void>(
  () => {},
);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<RestTimerState | null>(null);
  const [remaining, setRemaining] = useState(0);
  const sound = useRef<AudioContext | null>(null);
  const alerted = useRef<number | null>(null);
  function save(value: RestTimerState | null) {
    setTimer(value);
    setRemaining(value ? remainingSeconds(value.endsAt, Date.now()) : 0);
    try {
      if (value) localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    } catch {
      /* Timer works without storage. */
    }
  }
  useEffect(() => {
    try {
      const value = restoreTimer(localStorage.getItem(key), Date.now());
      // Rehydrate browser-only persistence after SSR; the server cannot read localStorage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimer(value);
      setRemaining(value ? remainingSeconds(value.endsAt, Date.now()) : 0);
    } catch {
      /* Private browsing may disable storage. */
    }
  }, []);
  useEffect(() => {
    if (!timer) return;
    const update = () => {
      const seconds = remainingSeconds(timer.endsAt, Date.now());
      setRemaining(seconds);
      if (seconds === 0 && alerted.current !== timer.endsAt) {
        alerted.current = timer.endsAt;
        const audio = sound.current;
        if (
          audio?.state === "running" &&
          document.visibilityState === "visible"
        ) {
          const tone = audio.createOscillator(),
            volume = audio.createGain();
          tone.connect(volume);
          volume.connect(audio.destination);
          tone.frequency.value = 660;
          volume.gain.setValueAtTime(0.12, audio.currentTime);
          volume.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.35,
          );
          tone.start();
          tone.stop(audio.currentTime + 0.35);
        }
      }
    };
    update();
    const interval = window.setInterval(update, 250);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pageshow", update);
    };
  }, [timer]);
  useEffect(
    () => () => {
      void sound.current?.close();
    },
    [],
  );
  function start(label: string, seconds: number) {
    try {
      sound.current ??= new AudioContext();
      void sound.current.resume().catch(() => {});
    } catch {
      /* Visual timer remains available when audio is unsupported. */
    }
    save({ label, endsAt: Date.now() + seconds * 1000 });
  }
  return (
    <TimerContext.Provider value={start}>
      {children}
      {timer && (
        <aside className="rest-timer" aria-label="Rest timer">
          <div className="rest-timer-label">
            <span>{timer.label}</span>
            <small role="status">{remaining ? "Rest" : "Rest complete"}</small>
          </div>
          <strong role="timer" aria-label={`${remaining} seconds remaining`}>
            {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </strong>
          <button
            onClick={() =>
              save({
                ...timer,
                endsAt: Math.min(
                  Math.max(timer.endsAt, Date.now()) + 30_000,
                  Date.now() + 30 * 60_000,
                ),
              })
            }
            aria-label="Add 30 seconds"
          >
            +30s
          </button>
          <button onClick={() => save(null)} aria-label="Cancel rest timer">
            <XMarkIcon aria-hidden="true" />
          </button>
        </aside>
      )}
    </TimerContext.Provider>
  );
}

export function RestButton({
  exercise,
  pairedWith,
}: {
  exercise: PlanExercise;
  pairedWith?: string;
}) {
  const start = useContext(TimerContext);
  if (pairedWith)
    return <small className="superset-next">↔ {pairedWith}</small>;
  return (
    <button
      className="rest-start"
      aria-label={`Start ${restSeconds(exercise)} second rest${exercise.superset ? " after superset" : ""} for ${exercise.name}`}
      onClick={() =>
        start(
          exercise.superset ? `${exercise.superset} superset` : exercise.name,
          restSeconds(exercise),
        )
      }
    >
      <ClockIcon aria-hidden="true" />
      <span>{restLabel(exercise)}</span>
    </button>
  );
}
