import type { Plan } from "../../../shared/model";
export default function Goals({ plan }: { plan: Plan }) {
  return (
    <div>
      <div className="section-title view-title">
        <h1>Goals</h1>
      </div>
      <section className="panel goals-list" aria-label="Current goals">
        {plan.goals?.length ? (
          plan.goals.map((goal, i) => (
            <p key={`${i}:${goal}`}>
              <span>{i + 1}.</span> {goal}
            </p>
          ))
        ) : (
          <p>No goals saved yet.</p>
        )}
      </section>
      <section className="panel">
        <h2>How I train</h2>
        <p>
          Push → Pull → Upper. Continue the rotation when I next lift; no fixed
          weekdays.
        </p>
        <p>
          Cardio and HIIT fit around lifting and don’t advance the rotation.
        </p>
        <p>
          {plan.targets.liftsMin}–{plan.targets.liftsMax} lifts per week. One
          short legs block per week.
        </p>
      </section>
      <section className="panel">
        <h2>Current exercises</h2>
        {Object.entries(plan.program).map(([day, exercises]) => (
          <details className="metric-note" key={day}>
            <summary className="session-label">{day}</summary>
            {exercises.map((e) => (
              <p key={e.name}>
                {e.name} · {e.sets} sets
              </p>
            ))}
          </details>
        ))}
        {!Object.values(plan.program)
          .flat()
          .some((e) =>
            /crunch|ab wheel|rollout|plank|leg raise|knee raise|pallof/i.test(
              e.name,
            ),
          ) && <p className="muted">Direct ab work isn’t programmed yet.</p>}
      </section>
      <section className="panel">
        <h2>Progress</h2>
        <p>
          Compare weight and reps for the same exercise. Use arm measurements
          and progress photos to track size over time.
        </p>
        <details className="metric-note">
          <summary>Earlier program rationale</summary>
          <p>{plan.rationale}</p>
        </details>
      </section>
    </div>
  );
}
