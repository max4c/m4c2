import PageHeader from "./PageHeader";
import { rotationOrder, type Plan, type Rotation } from "../../../shared/model";
import { prescription, sameStationSuperset } from "../../../shared/training";
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
      <PageHeader
        title="Routine"
        backHref="#settings"
        backLabel="Back to Settings"
      />
      <div className="routine-intro">
        <p>{rotationOrder(plan).join(" → ")}</p>
      </div>
      {plan.schedule && (
        <details className="disclosure routine-schedule">
          <summary>Weekly schedule</summary>
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
        </details>
      )}
      <div className="routine-sessions">
        {sessions.map((session) => {
          const day = plan.schedule?.find((d) => d.session === session)?.day;
          return (
            <details
              open={next === session}
              className="panel routine-session"
              key={session}
              aria-labelledby={`routine-${session}`}
            >
              <summary className="panel-top">
                <h2 id={`routine-${session}`} className="session-label">
                  {day ? `${day} · ` : ""}
                  {session === "legs" && !rotationOrder(plan).includes("legs")
                    ? "Weekly legs block"
                    : session}
                </h2>
                {next === session && <span className="routine-next">Next</span>}
              </summary>
              <ol className="routine-exercises">
                {plan.program[session].map((exercise, i, list) => {
                  const pair =
                    list[i + 1] && sameStationSuperset(exercise, list[i + 1])
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
            </details>
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
        <a href="#today">Today →</a>
      </details>
    </div>
  );
}
