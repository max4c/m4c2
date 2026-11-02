import { normalize, type Plan, type PlanExercise, type Workout } from "./model";
import {
  canonicalWorkouts,
  loadConvention,
  loadLabel,
  restSeconds,
  sameStationSuperset,
} from "./training";
export type SessionExercise = {
  prescription: PlanExercise;
  aims: { w: number | null; r: number | null; wMax?: number }[];
  replaces?: string;
  loadInstruction: string | null;
};
export type SessionSnapshot = {
  date: string;
  label: string;
  exercises: SessionExercise[];
  notes: { name: string; note: string }[];
  lastExercise?: string;
  lastSetAt?: number;
  lastSetKey?: string;
};
export function sessionView(
  session: SessionSnapshot,
  rows: Workout[],
  plan: Plan,
) {
  const today = canonicalWorkouts(
    rows.filter((w) => w.kind === "lift" && w.date === session.date),
    plan,
  );
  const exercises = session.exercises.map((entry) => {
    const p = entry.prescription,
      name = normalize(p.name),
      original = normalize(entry.replaces ?? p.name);
    const sets = today.flatMap((w) =>
      w.exercises
        .filter(
          (e) =>
            normalize(e.name) === name ||
            normalize(e.name) === original ||
            normalize(e.replaces ?? "") === original,
        )
        .flatMap((e) =>
          e.sets.map((s) => ({
            ...s,
            exercise: e.name,
            loadConvention:
              e.loadConvention ??
              loadConvention(
                Object.values(plan.program)
                  .flat()
                  .find((p) => normalize(p.name) === normalize(e.name)) ?? p,
              ),
          })),
        ),
    );
    return {
      ...entry,
      name: p.name,
      loadConvention: loadConvention(p),
      sets,
      setsDone: sets.length,
      prescribed: p.sets,
      remaining: Math.max(0, p.sets - sets.length),
      restSeconds: restSeconds(p),
      setup: p.note ?? null,
      nextTimeNote:
        session.notes.find((n) => normalize(n.name) === original)?.note ?? null,
    };
  });
  let nextIndex = exercises.findIndex((e) => e.remaining > 0);
  if (nextIndex >= 0) {
    const first = exercises[nextIndex];
    const mate = exercises.findIndex(
      (e, i) =>
        i !== nextIndex &&
        e.remaining > 0 &&
        sameStationSuperset(first.prescription, e.prescription),
    );
    if (mate >= 0 && exercises[mate].setsDone < first.setsDone)
      nextIndex = mate;
  }
  const upcoming = exercises[nextIndex];
  const aim =
    upcoming?.aims[Math.min(upcoming.setsDone, upcoming.aims.length - 1)];
  const next = upcoming
    ? {
        exercise: upcoming.name,
        target: {
          weight: aim?.w ?? null,
          weightMax: aim?.wMax ?? null,
          reps: aim?.r ?? null,
          loadConvention: upcoming.loadConvention,
          load: loadLabel(aim?.w ?? null, upcoming.loadConvention, aim?.wMax),
        },
        setNumber: upcoming.setsDone + 1,
        prescribedSets: upcoming.prescribed,
        loadInstruction: upcoming.loadInstruction,
        warmup:
          upcoming.prescription.category === "compound" &&
          !exercises.some(
            (e) => e.prescription.category === "compound" && e.setsDone > 0,
          )
            ? "1 to 2 light warm-up sets first; do not log them as work sets."
            : null,
        note: upcoming.nextTimeNote,
      }
    : null;
  const last = exercises.find(
    (e) => normalize(e.name) === normalize(session.lastExercise ?? ""),
  );
  const mate =
    last &&
    exercises.find(
      (e) =>
        e !== last && sameStationSuperset(last.prescription, e.prescription),
    );
  const waitingForPair = !!(
    last &&
    mate &&
    mate.remaining > 0 &&
    Math.min(last.setsDone, last.prescribed) >
      Math.min(mate.setsDone, mate.prescribed)
  );
  const rest = last
    ? {
        seconds: waitingForPair ? 0 : last.restSeconds,
        waitingForPair,
        label: waitingForPair
          ? `Then ${mate!.name}`
          : last.prescription.superset && mate
            ? `${last.prescription.superset} pair`
            : last.name,
        eventId: session.lastSetKey ?? null,
        loggedAt: session.lastSetAt ?? null,
      }
    : null;
  return {
    date: session.date,
    label: session.label,
    exercises,
    rest,
    next,
    exercisesLeft: exercises
      .filter((e) => e.remaining > 0)
      .map((e) => ({ name: e.name, setsRemaining: e.remaining })),
    complete: !next,
    setsDone: exercises.reduce((n, e) => n + e.setsDone, 0),
    prescribedSets: exercises.reduce((n, e) => n + e.prescribed, 0),
  };
}
