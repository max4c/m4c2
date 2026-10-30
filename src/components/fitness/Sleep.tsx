"use client";
import { sleepDuration, type SleepData } from "../../../shared/sleep";
export default function Sleep({
  data,
  today,
  history = false,
  timezone,
}: {
  data?: SleepData;
  today: string;
  timezone: string;
  history?: boolean;
}) {
  if (!data || data.status === "not_configured") return null;
  const latest = data.nights.at(-1);
  const week = data.nights.filter(
    (n) =>
      n.date >=
      new Date(Date.parse(today + "T12:00:00Z") - 6 * 86400000)
        .toISOString()
        .slice(0, 10),
  );
  const avg = week.length
    ? week.reduce((sum, n) => sum + n.seconds, 0) / week.length
    : null;
  return (
    <section className="panel sleep-panel">
      <div className="panel-top">
        <h2>Sleep</h2>
        <span>Garmin</span>
      </div>
      {data.status === "unavailable" ? (
        <p className="muted">Garmin unavailable. Try again later.</p>
      ) : (
        <>
          <div className="sleep-summary">
            <strong>
              {latest?.date === today
                ? sleepDuration(latest.seconds)
                : "No sleep synced for last night"}
            </strong>
            {latest && latest.date !== today && (
              <span>
                Latest · {latest.date.slice(5)} ·{" "}
                {sleepDuration(latest.seconds)}
              </span>
            )}
            {latest?.date === today && latest.start && latest.end && (
              <span>
                {new Date(latest.start).toLocaleTimeString([], {
                  timeZone: timezone,
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {new Date(latest.end).toLocaleTimeString([], {
                  timeZone: timezone,
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          {history && (
            <>
              <p>
                {avg === null
                  ? "No sleep recorded in the last 7 days."
                  : `${sleepDuration(avg)} average · ${week.length} of the last 7 nights recorded`}
              </p>
              <div className="sleep-nights">
                {[...data.nights].reverse().map((n) => (
                  <div key={n.date}>
                    <span>{n.date.slice(5)}</span>
                    <div className="sleep-track">
                      <i
                        style={{
                          width: `${Math.min(100, (n.hours / 12) * 100)}%`,
                        }}
                      />
                    </div>
                    <strong>{sleepDuration(n.seconds)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
          <details className="metric-note">
            <summary>Sync details</summary>
            <p>
              Fetched{" "}
              {data.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : "—"}
              . Sync your watch with Garmin Connect first. Supermedium checks
              when opened or queried; results may be cached for 15 minutes.
              Dates use Garmin’s wake-up day. Missing nights are not counted as
              zero.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
