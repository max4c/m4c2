import { normalize, type Plan, type Workout } from "./model";
import { canonicalExerciseName } from "./training";

function words(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\bdb\b/g, "dumbbell")
      .replace(/\bbb\b/g, "barbell")
      .replace(/pull[- ]?ups?/g, "pullup")
      .replace(/push[- ]?ups?/g, "pushup")
      .replace(/biceps/g, "bicep")
      .replace(/triceps/g, "tricep")
      .replace(/curls/g, "curl")
      .replace(/raises/g, "raise")
      .replace(/presses/g, "press")
      .match(/[a-z0-9]+/g) ?? []
  );
}
function similarity(a: string, b: string) {
  const aw = new Set(words(a)),
    bw = new Set(words(b));
  const overlap = [...aw].filter((w) => bw.has(w)).length;
  const jaccard = overlap / new Set([...aw, ...bw]).size;
  const x = words(a).join(""),
    y = words(b).join("");
  let row = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    const next = [i];
    for (let j = 1; j <= y.length; j++)
      next[j] = Math.min(
        next[j - 1] + 1,
        row[j] + 1,
        row[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      );
    row = next;
  }
  return Math.max(jaccard, 1 - row[y.length] / Math.max(x.length, y.length, 1));
}
export function exerciseNameMatches(
  names: string[],
  plan: Plan,
  history: Workout[],
) {
  const catalog = new Map<
    string,
    { name: string; inPlan: boolean; inHistory: boolean; aliases: string[] }
  >();
  for (const e of Object.values(plan.program).flat()) {
    const key = normalize(e.name),
      old = catalog.get(key);
    catalog.set(key, {
      name: e.name,
      inPlan: true,
      inHistory: old?.inHistory ?? false,
      aliases: [...(old?.aliases ?? []), ...(e.aliases ?? [])],
    });
  }
  for (const w of history)
    for (const e of w.exercises) {
      const name = canonicalExerciseName(e.name, plan),
        key = normalize(name),
        old = catalog.get(key);
      catalog.set(
        key,
        old
          ? { ...old, inHistory: true }
          : { name, inPlan: false, inHistory: true, aliases: [] },
      );
    }
  return [...new Set(names)].map((loggedName) => {
    const canonical = canonicalExerciseName(loggedName, plan);
    const existing = catalog.get(normalize(canonical));
    const exact =
      existing &&
      (normalize(existing.name) === normalize(loggedName) ||
        canonical !== loggedName);
    const candidates = exact
      ? [{ ...existing, score: 1 }]
      : [...catalog.values()]
          .map((e) => ({
            ...e,
            score: Math.max(
              similarity(loggedName, e.name),
              ...e.aliases.map((a) => similarity(loggedName, a)),
            ),
          }))
          .filter((e) => e.score >= 0.45)
          .sort(
            (a, b) =>
              b.score - a.score ||
              Number(b.inHistory) - Number(a.inHistory) ||
              a.name.localeCompare(b.name),
          )
          .slice(0, 3);
    return {
      loggedName,
      match: exact
        ? normalize(existing.name) === normalize(loggedName)
          ? "exact"
          : "saved_alias"
        : candidates.length
          ? "similar"
          : "none",
      canonicalName: exact ? existing.name : null,
      suggestions: candidates.map((e) => ({
        name: e.name,
        inPlan: e.inPlan,
        inHistory: e.inHistory,
        similarity: Math.round(e.score * 100) / 100,
      })),
      requiresConfirmation: !exact && candidates.length > 0,
      note: exact
        ? "Already shares history through exact normalization or an explicitly saved alias."
        : "Suggestions compare spelling only, not movement equivalence. Keep different equipment, angles and heavy/moderate variants separate. If the user confirms the same movement, use its exact existing name and update this row's full exercises array. No automatic renaming or merging occurred.",
    };
  });
}
