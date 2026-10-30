import type { Plan } from "../../../shared/model";
export default function Goals({ plan }: { plan: Plan }) {
  return (
    <div>
      <div className="section-title view-title">
        <h1>Goals</h1>
      </div>
      <a className="routine-link" href="#routine">
        View routine →
      </a>
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
