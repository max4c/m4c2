import type { Plan } from "../../../shared/model";
const sessions = ["push", "pull", "upper", "legs"] as const;
export default function Routine({
  plan,
  next,
}: {
  plan: Plan;
  next: "push" | "pull" | "upper";
}) {
  return (
    <div>
      <div className="section-title view-title">
        <h1>Routine</h1>
      </div>
      <div className="routine-intro">
        <a href="#goals">← Goals</a>
        <p>
          {plan.targets.liftsMin}–{plan.targets.liftsMax} lifts per week · legs
          once per week
        </p>
        <p>
          Push → Pull → Upper, then repeat. Cardio and HIIT fit between lifts;
          pick up where you left off.
        </p>
      </div>
      <div className="routine-sessions">
        {sessions.map((session, index) => (
          <section
            className="panel routine-session"
            key={session}
            aria-labelledby={`routine-${session}`}
          >
            <div className="panel-top">
              <h2 id={`routine-${session}`} className="session-label">
                {session === "legs"
                  ? "Weekly legs block"
                  : `${index + 1}. ${session}`}
              </h2>
              {next === session && <span className="routine-next">Next</span>}
            </div>
            <ol className="routine-exercises">
              {plan.program[session].map((exercise, i) => (
                <li key={`${exercise.name}:${i}`}>
                  <span>{exercise.name}</span>
                  <strong>
                    {exercise.mode === "weighted"
                      ? `${exercise.sets} × 8–12`
                      : exercise.mode === "timed"
                        ? `${exercise.sets} timed sets`
                        : exercise.mode === "carry"
                          ? `${exercise.sets} carries`
                          : `${exercise.sets} sets`}
                  </strong>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <details className="metric-note">
        <summary>Weights and progression</summary>
        <p>
          These are the saved exercises in session order. Weighted exercises use
          8–12 reps. Chat and Today show your target load and reps from the last
          matching exercise, adjusted for recovery when needed.
        </p>
        <p>
          Bodyweight exercises use your previous reps; timed hangs use seconds
          and carries use metres. Starting loads, durations and distances are
          not set until you log them.
        </p>
        <a href="#today">View next workout →</a>
      </details>
      {!Object.values(plan.program)
        .flat()
        .some((e) =>
          /crunch|ab wheel|rollout|plank|leg raise|knee raise|pallof/i.test(
            e.name,
          ),
        ) && (
        <p className="muted routine-gap">
          Direct ab work isn’t programmed yet.
        </p>
      )}
    </div>
  );
}
