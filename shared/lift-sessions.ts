import { normalize, type Workout } from "./model";

// Rows are live-log fragments. A session is a calendar date in the saved timezone.
export function liftSessions(workouts: Workout[]): Workout[] {
  const days = new Map<string, Workout>();
  for (const row of [...workouts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.ts - b.ts,
  )) {
    if (row.kind !== "lift") continue;
    let day = days.get(row.date);
    if (!day) {
      day = { ...row, exercises: [] };
      days.set(row.date, day);
    } else {
      day.ts = Math.max(day.ts, row.ts);
      if (!day.label.split(" + ").includes(row.label))
        day.label += " + " + row.label;
    }
    for (const exercise of row.exercises) {
      const existing = day.exercises.find(
        (e) => normalize(e.name) === normalize(exercise.name),
      );
      if (existing) existing.sets.push(...exercise.sets);
      else
        day.exercises.push({ name: exercise.name, sets: [...exercise.sets] });
    }
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date));
}
