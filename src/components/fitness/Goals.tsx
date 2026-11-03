import PageHeader from "./PageHeader";
import { rotationOrder, type Plan } from "../../../shared/model";
export default function Goals({ plan }: { plan: Plan }) {
  return (
    <div>
      <PageHeader
        title="Goals"
        backHref="#settings"
        backLabel="Back to Settings"
      />
      <a className="routine-link" href="#routine">
        Routine →
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
          . Pick up where I left off.
        </p>
        <p>
          {plan.targets.liftsMin}–{plan.targets.liftsMax} lift days per week,
          with cardio and HIIT around them.
        </p>
      </section>
      <details className="panel disclosure">
        <summary>How I measure progress</summary>
        <p>
          Compare weight and reps for the same exercise. Use arm measurements
          and progress photos to track size over time.
        </p>
        <details className="metric-note">
          <summary>Program rationale</summary>
          <p>{plan.rationale}</p>
        </details>
      </details>
    </div>
  );
}
