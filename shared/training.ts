import { normalize, type Plan, type PlanExercise, type Workout } from "./model";

export function canonicalExerciseName(name: string, plan: Plan) {
  const exercises = Object.values(plan.program).flat();
  const exact = exercises.find((p) => normalize(p.name) === normalize(name));
  if (exact) return exact.name;
  const matches = exercises.filter((p) =>
    p.aliases?.some((a) => normalize(a) === normalize(name)),
  );
  return new Set(matches.map((p) => normalize(p.name))).size === 1
    ? matches[0].name
    : name;
}
export function canonicalWorkouts<T extends Workout>(
  workouts: T[],
  plan: Plan,
): T[] {
  return workouts.map((w) => ({
    ...w,
    exercises: w.exercises.map((e) => ({
      ...e,
      name: canonicalExerciseName(e.name, plan),
    })),
  }));
}
export function prescription(p: PlanExercise) {
  const sets = p.setsMax ? `${p.sets}–${p.setsMax}` : `${p.sets}`;
  if (p.mode === "carry")
    return `${sets} × ${p.distanceMetres ? `~${p.distanceMetres} m` : "carry"}`;
  if (p.mode === "timed") return `${sets} timed sets`;
  const range =
    p.repRange ?? (p.mode === "weighted" ? { min: 8, max: 12 } : null);
  return range
    ? `${sets} × ${range.min}–${range.max}${p.perSide ? " / leg" : ""}`
    : `${sets} sets`;
}
export function restSeconds(p: PlanExercise) {
  return p.restSeconds ?? (p.category === "isolation" ? 90 : 180);
}
export function durationLabel(seconds: number) {
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds}s`;
}
export function restLabel(p: PlanExercise) {
  const duration = p.restMinSeconds
    ? `${p.restMinSeconds}–${restSeconds(p)}s`
    : durationLabel(restSeconds(p));
  return p.superset ? `${duration} after pair` : duration;
}
