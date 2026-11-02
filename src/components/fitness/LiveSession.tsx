"use client";
import { RestControls, useLiveSession } from "./RestTimer";
import { loadLabel } from "../../../shared/training";
export default function LiveSession() {
  const { session, connected } = useLiveSession();
  return (
    <section
      className="panel live-session"
      aria-label="Today's lifting session"
    >
      <div className="panel-top">
        <h2 className="session-label">{session?.label ?? "Session"}</h2>
        <a className="routine-link" href="#routine">
          Routine →
        </a>
      </div>
      {!connected && (
        <p className="muted" role="status">
          {session
            ? "Reconnecting · showing last update"
            : "Connecting to session…"}
        </p>
      )}
      <RestControls />
      {session?.next && (
        <div className="session-next">
          <small>
            Next · set {session.next.setNumber} of {session.next.prescribedSets}
          </small>
          <h3>{session.next.exercise}</h3>
          <p>
            {session.next.target.load} × {session.next.target.reps ?? "—"}
          </p>
          {session.next.warmup && <small>{session.next.warmup}</small>}
        </div>
      )}
      {session?.complete && (
        <p className="session-complete">All prescribed sets logged.</p>
      )}
      <ol className="session-exercises">
        {session?.exercises.map((e) => (
          <li key={e.name} className={e.remaining ? "" : "is-complete"}>
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
              {e.prescribed} sets · {e.restSeconds}s rest
              {e.prescription.superset
                ? ` after ${e.prescription.superset} pair`
                : ""}
            </small>
            {e.nextTimeNote && <p className="session-cue">{e.nextTimeNote}</p>}
            {(e.setup || e.sets.length > 0 || e.loadInstruction) && (
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
            )}
          </li>
        ))}
      </ol>
      {session?.scheduleMismatch && (
        <details className="metric-note">
          <summary>Schedule</summary>
          <p>{session.scheduleMismatch.message}</p>
        </details>
      )}
    </section>
  );
}
