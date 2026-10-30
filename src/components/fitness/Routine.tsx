import { rotationOrder, type Plan, type Rotation } from "../../../shared/model";
import { prescription } from "../../../shared/training";
import { RestButton } from "./RestTimer";
const sessions = ["push", "pull", "upper", "legs"] as const;
export default function Routine({
  plan,
  next,
}: {
  plan: Plan;
  next: Rotation;
}) {
  return (
    <div>
      <div className="section-title view-title">
        <h1>Routine</h1>
      </div>
      <div className="routine-intro">
        <a href="#goals">← Goals</a>
        <p>
          {plan.targets.liftsMin}–{plan.targets.liftsMax} lifts per week ·
          continue the sequence when days move.
        </p>
      </div>
      {plan.schedule && (
        <div className="routine-week" aria-label="Weekly schedule">
          {plan.schedule.map((day) => (
            <div key={day.day}>
              <span>{day.day}</span>
              <div>
                <strong>{day.label}</strong>
                {day.detail && <small>{day.detail}</small>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="routine-sessions">
        {sessions.map((session) => {
          const day = plan.schedule?.find((d) => d.session === session)?.day;
          return (
            <section
              className="panel routine-session"
              key={session}
              aria-labelledby={`routine-${session}`}
            >
              <div className="panel-top">
                <h2 id={`routine-${session}`} className="session-label">
                  {day ? `${day} · ` : ""}
                  {session === "legs" && !rotationOrder(plan).includes("legs")
                    ? "Weekly legs block"
                    : session}
                </h2>
                {next === session && <span className="routine-next">Next</span>}
              </div>
              <ol className="routine-exercises">
                {plan.program[session].map((exercise, i, list) => {
                  const pair =
                    exercise.superset &&
                    list[i + 1]?.superset === exercise.superset
                      ? list[i + 1].name
                      : undefined;
                  return (
                    <li key={`${exercise.name}:${i}`}>
                      <span>{exercise.name}</span>
                      <strong>{prescription(exercise)}</strong>
                      <div className="routine-exercise-rest">
                        <RestButton exercise={exercise} pairedWith={pair} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
      <details className="metric-note">
        <summary>Session rules</summary>
        {plan.rules?.length ? (
          plan.rules.map((rule) => <p key={rule}>{rule}</p>)
        ) : (
          <p>
            Continue {rotationOrder(plan).join(" → ")}. Cardio does not advance
            the lifting rotation.
          </p>
        )}
        <p>
          Chat and Today show previous sets and next targets. Rest timers use
          the listed duration (90s for the 60–90s range). You can add time. The
          countdown resumes correctly when you return; sound requires the app to
          be open and audio available.
        </p>
        <a href="#today">View next workout →</a>
      </details>
    </div>
  );
}
