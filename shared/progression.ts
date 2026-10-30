import type { PlanExercise } from "./model";
type Previous = { date: string; sets: { w: number; r: number }[] } | null;
const round = (w: number) => Math.round(w * 10) / 10;

export function exerciseAims(
  p: PlanExercise,
  baseline: Previous,
  reduced: boolean,
) {
  const range = p.repRange ?? { min: 8, max: 12 };
  const hit =
    !!baseline &&
    baseline.sets.length >= p.sets &&
    baseline.sets.every((s) => s.r >= range.max);
  const modern = !!p.repRange;
  const double =
    p.progression === "double" || (!p.progression && p.mode === "weighted");
  const increase = double && hit && !reduced;
  const needsIncrement = increase && modern && p.weightIncrement === undefined;
  const needsLighterLoad =
    modern &&
    double &&
    !reduced &&
    !!baseline?.sets.some((s) => s.r < range.min);
  const aims = Array.from({ length: p.sets }, (_, i) => {
    const s = baseline?.sets[i] ?? baseline?.sets.at(-1);
    if (p.progression === "quality") return { w: 0, r: range.min };
    if (p.mode === "carry")
      return {
        w: s ? round(s.w * (reduced ? 0.9 : 1)) : null,
        r: p.distanceMetres ?? s?.r ?? null,
      };
    if (p.mode === "timed")
      return {
        w: s ? round(s.w * (reduced ? 0.9 : 1)) : null,
        r: s?.r ?? null,
      };
    if (!s)
      return {
        w: p.progression === "reps" && p.mode === "bodyweight" ? 0 : null,
        r: range.min,
      };
    if (p.mode === "bodyweight" && !modern)
      return {
        w: s.w,
        r: reduced ? Math.max(1, Math.round(s.r * 0.9)) : s.r + 1,
      };
    if (p.progression === "reps")
      return {
        w: s.w,
        r: reduced
          ? Math.max(1, Math.round(s.r * 0.9))
          : Math.min(range.max, s.r + 1),
      };
    if (modern && double && !reduced && s.r < range.min)
      return { w: null, r: range.min };
    return {
      w: needsIncrement
        ? null
        : round(
            (s.w + (increase ? (p.weightIncrement ?? 5) : 0)) *
              (reduced ? 0.9 : 1),
          ),
      r: increase
        ? range.min
        : reduced
          ? Math.max(1, Math.min(range.max, Math.round(s.r * 0.9)))
          : Math.min(range.max, s.r + 1),
    };
  });
  const loadInstruction = needsLighterLoad
    ? `Previous sets fall below the current ${range.min}–${range.max} range. Choose a lighter load for those sets so you can reach at least ${range.min} clean reps; the previous loads remain a reference, not a required target.`
    : needsIncrement
      ? `All work sets reached ${range.max}. Add the smallest available increment above the previous loads; the increment is not configured, so no new weight is invented.`
      : null;
  const note =
    p.progression === "quality"
      ? "3–5 crisp jumps per set; fully recover and stop if quality drops. Do not chase failure or add load automatically."
      : p.mode === "carry"
        ? "r is metres; use the prescribed distance and a controlled heavy load. No automatic load increase."
        : p.mode === "timed"
          ? "r is seconds; repeat last duration."
          : p.progression === "reps"
            ? `Progress reps up to ${range.max} with clean form; no automatic added load.`
            : !baseline
              ? "No matching history: choose and log a starting load; do not borrow loads from another variant."
              : p.mode === "bodyweight" && !modern
                ? "Add one rep per set."
                : reduced
                  ? "Recovery session: lighter load and reps; do not increase weight."
                  : (loadInstruction ??
                    `${range.min}–${range.max} reps; increase load only after all prescribed sets reach ${range.max}, then restart at ${range.min}.`);
  return { aims, note, loadInstruction };
}
