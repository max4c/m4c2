import { normalize, type Workout, type Plan } from "./model";
import { liftSessions } from "./lift-sessions";
export function exerciseHistory(workouts: Workout[], name: string, plan: Plan) {
  const mode =
    Object.values(plan.program)
      .flat()
      .find((e) => normalize(e.name) === normalize(name))?.mode ?? "weighted";
  const sessions = liftSessions(workouts)
    .filter((w) => w.kind === "lift")
    .flatMap((w) => {
      const sets = w.exercises
        .filter((e) => normalize(e.name) === normalize(name))
        .flatMap((e) => e.sets);
      return sets.length
        ? [
            {
              date: w.date,
              ts: w.ts,
              label: w.label,
              sets,
              volume: sets.reduce((n, s) => n + s.w * s.r, 0),
            },
          ]
        : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
  const sets = sessions.flatMap((s) =>
    s.sets.map((set) => ({ ...set, date: s.date })),
  );
  const byWeight = new Map<number, { w: number; r: number; date: string }>();
  for (const set of sets)
    if (!byWeight.has(set.w) || byWeight.get(set.w)!.r < set.r)
      byWeight.set(set.w, set);
  const heaviest = [...sets].sort((a, b) => b.w - a.w || b.r - a.r)[0] ?? null;
  const bestSession =
    mode === "weighted"
      ? ([...sessions].sort((a, b) => b.volume - a.volume)[0] ?? null)
      : null;
  return {
    name,
    mode,
    sessions,
    sessionCount: sessions.length,
    setCount: sets.length,
    heaviest,
    bestRepsByWeight: [...byWeight.values()].sort((a, b) => b.w - a.w),
    bestSession,
    totalVolume:
      mode === "weighted" ? sessions.reduce((n, s) => n + s.volume, 0) : null,
    volumeUnit: mode === "weighted" ? "lb × reps" : null,
    note: "Records reflect logged sets only. Weight is the entered load; no per-hand doubling. Timed r is seconds; carry r is metres. Exercise names match ignoring case and punctuation.",
  };
}
