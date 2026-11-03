"use client";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { RestControls, useLiveSession } from "./RestTimer";
import { loadLabel } from "../../../shared/training";

type Exercise = NonNullable<
  ReturnType<typeof useLiveSession>["session"]
>["exercises"][number];

function ExerciseDetails({ exercise: e }: { exercise: Exercise }) {
  if (!e.setup && !e.sets.length && !e.loadInstruction) return null;
  return (
    <details className="session-details">
      <summary>Setup & sets</summary>
      {e.setup && <p>{e.setup}</p>}
      {e.loadInstruction && <p>{e.loadInstruction}</p>}
      {e.sets.map((s, i) => (
        <p key={i}>
          {i + 1}. {s.exercise !== e.name ? `${s.exercise}: ` : ""}
          {loadLabel(s.w, s.loadConvention)} × {s.r}
          {s.rir !== undefined
            ? ` · ${s.rir} RIR`
            : s.effort
              ? ` · ${s.effort === "easy" ? "easy" : "at limit"}`
              : ""}
          {i >= e.prescribed ? " · extra" : ""}
          {s.note ? ` · ${s.note}` : ""}
        </p>
      ))}
    </details>
  );
}

function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  return (
    <ol className="session-exercises">
      {exercises.map((e) => (
        <li key={e.name}>
          <div className="session-exercise-title">
            <strong>{e.name}</strong>
            <span aria-label={`${e.setsDone} of ${e.prescribed} sets logged`}>
              {e.setsDone}/{e.prescribed}
            </span>
          </div>
          <p className="session-target">
            {e.aims.every(
              (a) => a.w === e.aims[0]?.w && a.wMax === e.aims[0]?.wMax,
            )
              ? `${loadLabel(e.aims[0]?.w ?? null, e.loadConvention, e.aims[0]?.wMax)} × ${e.aims.every((a) => a.r === e.aims[0]?.r) ? (e.aims[0]?.r ?? "—") : e.aims.map((a) => a.r ?? "—").join(", ")}`
              : e.aims
                  .map(
                    (a) =>
                      `${loadLabel(a.w, e.loadConvention, a.wMax)} × ${a.r ?? "—"}`,
                  )
                  .join(" · ")}
          </p>
          <small>
            {e.restSeconds}s rest
            {e.prescription.superset
              ? ` after ${e.prescription.superset} pair`
              : ""}
          </small>
          {e.nextTimeNote && <p className="session-cue">{e.nextTimeNote}</p>}
          <ExerciseDetails exercise={e} />
        </li>
      ))}
    </ol>
  );
}

export default function LiveSession() {
  const { session, connected } = useLiveSession();
  if (session?.complete) return null;
  const current = session?.exercises.find(
    (e) => e.name === session.next?.exercise,
  );
  const upcoming =
    session?.exercises.filter(
      (e) => e.remaining > 0 && e.name !== current?.name,
    ) ?? [];
  return (
    <section
      className="panel live-session"
      aria-label="Today's lifting session"
    >
      {!connected && (
        <p className="muted" role="status">
          {session ? "Reconnecting…" : "Connecting…"}
        </p>
      )}
      {session?.next && (
        <div className="session-next" key={session.next.exercise}>
          <small>
            Set {session.next.setNumber} of {session.next.prescribedSets}
          </small>
          <h3>{session.next.exercise}</h3>
          <p>
            {session.next.target.load} × {session.next.target.reps ?? "—"}
          </p>
          {session.next.warmup && <small>{session.next.warmup}</small>}
          {current?.nextTimeNote && (
            <p className="session-cue">{current.nextTimeNote}</p>
          )}
          {current && <ExerciseDetails exercise={current} />}
        </div>
      )}
      {session?.next && <RestControls />}
      {!!upcoming.length && (
        <details
          className="session-group"
          key={`upcoming:${session?.date}:${session?.label}`}
        >
          <summary>
            <span>
              {upcoming.length} more exercise{upcoming.length === 1 ? "" : "s"}
            </span>
            <ChevronDownIcon aria-hidden="true" />
          </summary>
          <ExerciseList exercises={upcoming} />
        </details>
      )}
    </section>
  );
}
