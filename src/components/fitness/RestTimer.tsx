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
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";
import type { PlanExercise } from "../../../shared/model";
import { restLabel, restSeconds } from "../../../shared/training";
import {
  remainingSeconds,
  restoreTimer,
  type RestTimerState,
} from "../../../shared/rest-timer";
type Session = FunctionReturnType<typeof api.voice.get_current_session>;
const key = "supermedium-rest-timer-v1";
const TimerContext = createContext({
  start: (_label: string, _seconds: number) => {},
  session: null as Session | null,
  connected: false,
  ready: { label: "Rest", seconds: 90 },
  alerts: "" as string,
  enableAlerts: async () => {},
});
export const useLiveSession = () => useContext(TimerContext);
function deviceId() {
  let id = localStorage.getItem("supermedium-rest-device");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("supermedium-rest-device", id);
  }
  return id;
}
async function post(input: unknown) {
  const r = await fetch("/fitness/api/rest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error("Notification unavailable");
  return r.json();
}
async function rememberVersion(version: string | null) {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const worker = reg?.active;
  if (!worker) return;
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(
      () => reject(new Error("Notification state unavailable")),
      3000,
    );
    channel.port1.onmessage = () => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve();
    };
    worker.postMessage({ type: "rest-version", version }, [channel.port2]);
  });
}
let notificationQueue = Promise.resolve();
let notificationsDisabled = false;
export async function clearRestNotifications() {
  notificationsDisabled = true;
  await notificationQueue;
  await rememberVersion(null);
  try {
    const id = localStorage.getItem("supermedium-rest-device");
    if (id) await post({ action: "cancel", deviceId: id });
    localStorage.removeItem(key);
  } catch {}
}
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<RestTimerState | null>(null),
    [remaining, setRemaining] = useState(0);
  const [session, setSession] = useState<Session | null>(null),
    [connected, setConnected] = useState(false);
  const [ready, setReady] = useState({ label: "Rest", seconds: 90 }),
    [alerts, setAlerts] = useState("");
  const sound = useRef<AudioContext | null>(null),
    alerted = useRef<number | null>(null),
    lastEvent = useRef<string | null>(null);
  const pushEnabled = useRef(false);
  const timerRef = useRef<RestTimerState | null>(null);
  function notifyTimer(value: RestTimerState | null) {
    if (notificationsDisabled) return;
    const input = value
      ? {
          action: "start",
          deviceId: deviceId(),
          endsAt: value.endsAt,
          version: crypto.randomUUID(),
        }
      : { action: "cancel", deviceId: deviceId() };
    // Keep fast +15/cancel taps in order rather than racing server requests.
    notificationQueue = notificationQueue
      .then(async () => {
        if (notificationsDisabled) return;
        await rememberVersion("version" in input ? input.version! : null);
        if (notificationsDisabled) return;
        const result = await post(input);
        if (!result.enabled && pushEnabled.current) {
          pushEnabled.current = false;
          setAlerts("Enable notifications again for this device.");
        }
      })
      .catch(() =>
        setAlerts("Notification unavailable; keep the app open for the sound."),
      );
  }
  function save(value: RestTimerState | null) {
    timerRef.current = value;
    setTimer(value);
    setRemaining(value ? remainingSeconds(value.endsAt, Date.now()) : 0);
    try {
      if (value) localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    } catch {}
    notifyTimer(value);
  }
  useEffect(() => {
    notificationsDisabled = false;
    try {
      const value = restoreTimer(localStorage.getItem(key), Date.now());
      timerRef.current = value;
      // Restore browser-only persistence after SSR; localStorage is unavailable on the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimer(value);
      setRemaining(value ? remainingSeconds(value.endsAt, Date.now()) : 0);
    } catch {}
    const stream = new EventSource("/fitness/api/session-stream");
    stream.onmessage = (event) => {
      try {
        const s: Session = JSON.parse(event.data);
        setSession(s);
        setConnected(true);
        if (s.rest?.eventId && lastEvent.current !== s.rest.eventId) {
          lastEvent.current = s.rest.eventId;
          setReady({ label: s.rest.label, seconds: s.rest.seconds });
        }
      } catch {
        setConnected(false);
      }
    };
    stream.onerror = () => setConnected(false);
    stream.addEventListener("unavailable", () => setConnected(false));
    if (
      "serviceWorker" in navigator &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      void navigator.serviceWorker
        .getRegistration("/")
        .then(async (reg) => {
          const sub = await reg?.pushManager.getSubscription();
          if (sub && !notificationsDisabled) {
            await post({
              action: "subscribe",
              deviceId: deviceId(),
              subscription: sub.toJSON(),
            });
            pushEnabled.current = true;
            setAlerts("Notifications on");
            const current = timerRef.current;
            notifyTimer(
              current && current.endsAt > Date.now() ? current : null,
            );
          }
        })
        .catch(() => setAlerts("Enable notifications again for this device."));
    }
    return () => stream.close();
  }, []);
  useEffect(() => {
    if (!timer) return;
    const update = () => {
      const seconds = remainingSeconds(timer.endsAt, Date.now());
      setRemaining(seconds);
      if (seconds === 0 && alerted.current !== timer.endsAt) {
        alerted.current = timer.endsAt;
        const audio = sound.current;
        if (document.visibilityState === "visible") {
          navigator.vibrate?.([200, 100, 200]);
          if (audio?.state === "running") {
            const tone = audio.createOscillator(),
              volume = audio.createGain();
            tone.connect(volume);
            volume.connect(audio.destination);
            tone.frequency.value = 660;
            volume.gain.setValueAtTime(0.12, audio.currentTime);
            volume.gain.exponentialRampToValueAtTime(
              0.001,
              audio.currentTime + 0.5,
            );
            tone.start();
            tone.stop(audio.currentTime + 0.5);
          }
        }
      }
    };
    update();
    const interval = setInterval(update, 250);
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
    } catch {}
    save({ label, endsAt: Date.now() + seconds * 1000 });
  }
  async function enableAlerts() {
    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setAlerts(
          "On iPhone, add Supermedium to your Home Screen, then enable alerts here.",
        );
        return;
      }
      // The permission request is made directly in the tap handler, before any network await.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setAlerts(
          "Allow notifications in your device settings, or keep the app open for the sound.",
        );
        return;
      }
      const response = await fetch("/fitness/api/rest");
      if (!response.ok) throw new Error();
      const { publicKey } = await response.json();
      if (!publicKey) throw new Error();
      const reg = await navigator.serviceWorker.register("/fitness-sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;
      const bytes = Uint8Array.from(
        atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      );
      const subscription =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }));
      await post({
        action: "subscribe",
        deviceId: deviceId(),
        subscription: subscription.toJSON(),
      });
      pushEnabled.current = true;
      setAlerts("Notifications on");
      const current = timerRef.current;
      if (current && current.endsAt > Date.now()) notifyTimer(current);
    } catch {
      setAlerts(
        "Could not enable notifications. Try again; the open-app timer still works.",
      );
    }
  }
  return (
    <TimerContext.Provider
      value={{ start, session, connected, ready, alerts, enableAlerts }}
    >
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
                  Math.max(timer.endsAt, Date.now()) + 15_000,
                  Date.now() + 30 * 60_000,
                ),
              })
            }
            aria-label="Add 15 seconds"
          >
            +15s
          </button>
          <button onClick={() => save(null)} aria-label="Cancel rest timer">
            <XMarkIcon aria-hidden="true" />
          </button>
        </aside>
      )}
    </TimerContext.Provider>
  );
}
export function RestControls() {
  const { start, ready, alerts, enableAlerts } = useLiveSession();
  return (
    <div className="session-rest">
      <div className="rest-presets" aria-label="Rest presets">
        {[60, 90, 120, 180].map((s) => (
          <button
            key={s}
            onClick={() => start("Rest", s)}
            aria-label={`Start ${s} second rest`}
          >
            {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
          </button>
        ))}
      </div>
      <button
        className="session-rest-start"
        disabled={!ready.seconds}
        onClick={() => start(ready.label, ready.seconds)}
      >
        <ClockIcon aria-hidden="true" />
        {ready.seconds
          ? `Start rest · ${Math.floor(ready.seconds / 60)}:${String(ready.seconds % 60).padStart(2, "0")}`
          : ready.label}
      </button>
      <details className="rest-alerts">
        <summary>Alerts</summary>
        <p>
          Sound while open. Home Screen notifications when locked; sound and
          vibration follow your iPhone settings and aren’t guaranteed.
        </p>
        <button onClick={() => void enableAlerts()}>
          Enable notifications
        </button>
        {alerts && <p role="status">{alerts}</p>}
      </details>
    </div>
  );
}
export function RestButton({
  exercise,
  pairedWith,
}: {
  exercise: PlanExercise;
  pairedWith?: string;
}) {
  const { start } = useLiveSession();
  if (pairedWith)
    return <small className="superset-next">↔ {pairedWith}</small>;
  return (
    <button
      className="rest-start"
      aria-label={`Start ${restSeconds(exercise)} second rest for ${exercise.name}`}
      onClick={() => start(exercise.name, restSeconds(exercise))}
    >
      <ClockIcon aria-hidden="true" />
      <span>{restLabel(exercise)}</span>
    </button>
  );
}
