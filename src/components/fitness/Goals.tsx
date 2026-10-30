import { rotationOrder, type Plan } from "../../../shared/model";
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
          <span className="session-label">
            {rotationOrder(plan).join(" → ")}
          </span>
          . Continue the sequence when I next lift; planned weekdays can move.
        </p>
        <p>
          Cardio and HIIT fit around lifting and don’t advance the rotation.
        </p>
        <p>
          {plan.targets.liftsMin}–{plan.targets.liftsMax} lifts per week.{" "}
          {rotationOrder(plan).includes("legs")
            ? "A full legs session is part of the rotation."
            : "One short legs block per week."}
        </p>
      </section>
      <section className="panel">
        <h2>Progress</h2>
        <p>
          Compare weight and reps for the same exercise. Use arm measurements
          and progress photos to track size over time.
        </p>
        <details className="metric-note">
          <summary>Program rationale</summary>
          <p>{plan.rationale}</p>
        </details>
      </section>
    </div>
  );
}
