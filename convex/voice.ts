import { v } from "convex/values";
import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { requireToken } from "./auth";
import { saveLog, readDay } from "./fitness";
import { nextSession } from "../shared/analytics";
import {
  normalize,
  todayAt,
  rotationLabel,
  type Plan,
  type PlanExercise,
  setSchema,
  planSchema,
} from "../shared/model";
import { canonicalExerciseName, loadConvention } from "../shared/training";
import { sessionView, type SessionExercise } from "../shared/voice-session";
import { exerciseNameMatches } from "../shared/exercise-matching";
import {
  logSetInput,
  swapInput,
  nextNoteInput,
  renameInput,
} from "../shared/voice-inputs";
async function context(ctx: QueryCtx) {
  const plan = await ctx.db.query("plan").unique(),
    state = await ctx.db.query("state").unique();
  if (!plan || !state) throw new Error("Not initialized");
  const date = todayAt(Date.now(), plan.timezone);
  const rows = await ctx.db
    .query("workouts")
    .withIndex("by_date_ts")
    .order("asc")
    .collect();
  const stored = await ctx.db
    .query("voiceSessions")
    .withIndex("by_date", (q) => q.eq("date", date))
    .unique();
  const latest = [...rows]
    .reverse()
    .find(
      (w) =>
        w.date === date && w.kind === "lift" && rotationLabel(w.label).success,
    );
  const label =
    stored?.label ??
    (latest ? rotationLabel(latest.label).data! : state.rotation.next);
  const sessionPlan = nextSession(
    plan,
    label,
    rows.filter((w) => w.date < date),
    date,
    state.recoveryRemaining,
  );
  const pendingNotes = (await ctx.db.query("exerciseNotes").collect()).filter(
    (n) => !n.usedDate && n.createdDate < date,
  );
  const preview = {
    date,
    label,
    ...(latest ? { workoutId: latest._id } : {}),
    exercises: sessionPlan.exercises.map((p): SessionExercise => ({
      prescription: plan.program[label].find((e) => e.name === p.name)!,
      aims: p.aims,
      loadInstruction: p.loadInstruction,
    })),
    notes: pendingNotes
      .filter((n) =>
        plan.program[label].some(
          (e) => normalize(e.name) === normalize(n.name),
        ),
      )
      .map((n) => ({ name: n.name, note: n.note })),
    startedAt: Date.now(),
  };
  return {
    plan,
    state,
    date,
    rows,
    stored,
    session: stored ?? preview,
    pendingNotes,
    scheduleMismatch: sessionPlan.scheduleMismatch,
  };
}
async function ensureSession(
  ctx: MutationCtx,
  c: Awaited<ReturnType<typeof context>>,
  starting = false,
) {
  const id = c.stored?._id ?? (await ctx.db.insert("voiceSessions", c.session));
  for (const n of starting ? c.pendingNotes : [])
    if (c.session.notes.some((s) => s.name === n.name))
      await ctx.db.patch(n._id, { usedDate: c.date });
  return (await ctx.db.get(id))!;
}
async function current(ctx: QueryCtx) {
  const c = await context(ctx);
  return {
    ...sessionView(c.session, c.rows, c.plan),
    sessionId: c.stored?._id ?? null,
    scheduleMismatch: c.scheduleMismatch,
  };
}
export const get_current_session = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    requireToken(token);
    return current(ctx);
  },
});
export const watch_session = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    requireToken(token, "dashboard");
    return current(ctx);
  },
});
export const log_set = mutation({
  args: { token: v.string(), input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const p = logSetInput.parse(input);
    const fingerprint = JSON.stringify({ op: "log_set", input: p });
    const receipt = await ctx.db
      .query("requests")
      .withIndex("by_request", (q) => q.eq("requestId", p.requestId))
      .unique();
    if (receipt) {
      if (receipt.fingerprint !== fingerprint)
        throw new Error("requestId reused with different set");
      return {
        ...receipt.result,
        replayed: true,
        day: await readDay(ctx, receipt.result.date, (await context(ctx)).plan),
      };
    }
    const c = await context(ctx);
    const canonical = canonicalExerciseName(p.exercise, c.plan);
    const entry = c.session.exercises.find(
      (e) => normalize(e.prescription.name) === normalize(canonical),
    );
    if (!entry)
      return {
        logged: false,
        reason:
          "Exercise is not in today's session. Use an exact listed name or swap_exercise for its configured backup.",
        exerciseNameMatches: exerciseNameMatches([p.exercise], c.plan, c.rows),
        session: await current(ctx),
      };
    const session = await ensureSession(ctx, c, true),
      exercise = entry.prescription;
    const set = setSchema.parse({
      w: p.weight,
      r: p.reps,
      rir: p.rir,
      effort: p.effort,
      note: p.note,
      loggedAt: Date.now(),
    });
    let workout = session.workoutId
      ? await ctx.db.get(session.workoutId)
      : null;
    if (workout) {
      const exercises = [...workout.exercises];
      const i = exercises.findIndex(
        (e) => normalize(e.name) === normalize(exercise.name),
      );
      if (i >= 0)
        exercises[i] = { ...exercises[i], sets: [...exercises[i].sets, set] };
      else
        exercises.push({
          name: exercise.name,
          sets: [set],
          loadConvention: loadConvention(exercise),
          ...(entry.replaces ? { replaces: entry.replaces } : {}),
        });
      if (exercises.some((e) => e.sets.length > 100))
        throw new Error("Session set limit exceeded");
      await ctx.db.patch(workout._id, { exercises });
    } else {
      const result = await saveLog(ctx, "log_workout", {
        date: c.date,
        label: session.label,
        kind: "lift",
        intensity: "hard",
        exercises: [
          {
            name: exercise.name,
            sets: [set],
            loadConvention: loadConvention(exercise),
            ...(entry.replaces ? { replaces: entry.replaces } : {}),
          },
        ],
      });
      workout = await ctx.db.get(ctx.db.normalizeId("workouts", result.id)!);
    }
    await ctx.db.patch(session._id, {
      workoutId: workout!._id,
      exercises: session.exercises.map((e) =>
        normalize(e.prescription.name) === normalize(exercise.name)
          ? {
              ...e,
              aims: e.aims.map((a) =>
                a.w === null ? { ...a, w: p.weight } : a,
              ),
            }
          : e,
      ),
      lastExercise: exercise.name,
      lastSetAt: Date.now(),
      lastSetKey: p.requestId,
    });
    const result = {
      logged: true,
      id: workout!._id,
      sessionId: session._id,
      date: c.date,
      exercise: exercise.name,
      set,
      loadConvention: loadConvention(exercise),
    };
    const response = {
      ...result,
      replayed: false,
      day: await readDay(ctx, c.date, c.plan),
      session: await current(ctx),
    };
    await ctx.db.insert("requests", {
      requestId: p.requestId,
      fingerprint,
      result: response,
    });
    return response;
  },
});
export const set_next_session_note = mutation({
  args: { token: v.string(), input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const p = nextNoteInput.parse(input),
      c = await context(ctx),
      name = canonicalExerciseName(p.exercise, c.plan);
    if (
      !Object.values(c.plan.program)
        .flat()
        .some((e) => normalize(e.name) === normalize(name))
    )
      throw new Error("Use a plan exercise name");
    const old = (
      await ctx.db
        .query("exerciseNotes")
        .withIndex("by_name", (q) => q.eq("name", name))
        .collect()
    ).filter((n) => !n.usedDate);
    for (const n of old) await ctx.db.delete(n._id);
    const id = await ctx.db.insert("exerciseNotes", {
      name,
      note: p.note,
      createdDate: c.date,
      createdAt: Date.now(),
    });
    return {
      id,
      name,
      note: p.note,
      applies:
        "Next session containing this exercise, after today; expires when that session starts.",
    };
  },
});
export const swap_exercise = mutation({
  args: { token: v.string(), input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const p = swapInput.parse(input),
      c = await context(ctx),
      session = await ensureSession(ctx, c);
    const view = sessionView(session, c.rows, c.plan);
    const name = canonicalExerciseName(p.exercise, c.plan),
      i = session.exercises.findIndex(
        (e) => normalize(e.prescription.name) === normalize(name),
      );
    if (i < 0) throw new Error("Exercise not in session");
    const busy = session.exercises[i];
    const remaining = session.exercises.filter(
      (e, j) => j !== i && view.exercises[j].remaining > 0,
    );
    const candidate = !p.useBackup
      ? (remaining.find(
          (e) =>
            e.prescription.station &&
            e.prescription.station === busy.prescription.station,
        ) ?? remaining[0])
      : undefined;
    if (candidate) {
      const exercises = [
        candidate,
        ...session.exercises.filter((e) => e !== candidate),
      ].map((e) =>
        busy.prescription.superset &&
        e.prescription.superset === busy.prescription.superset
          ? { ...e, prescription: { ...e.prescription, superset: undefined } }
          : e,
      );
      await ctx.db.patch(session._id, { exercises });
      return {
        changed: true,
        reason:
          "Reordered today's remaining work; the busy movement stays available later. Affected superset partners use straight sets for this session.",
        choice: candidate.prescription.name,
        session: await current(ctx),
      };
    }
    const backup = busy.prescription.backup;
    if (!backup)
      return {
        changed: false,
        reason:
          "No remaining movement or configured backup. Ask for an available alternative before changing the plan.",
        session: await current(ctx),
      };
    if (
      session.exercises.some(
        (e, j) =>
          j !== i && normalize(e.prescription.name) === normalize(backup.name),
      )
    )
      throw new Error(
        "Backup already appears in this session; reorder it instead",
      );
    const p2: PlanExercise = {
      ...busy.prescription,
      ...backup,
      aliases: undefined,
      superset: undefined,
      backup: undefined,
      weightIncrement: undefined,
      easyWeightIncrementMax: undefined,
    };
    const known = Object.values(c.plan.program)
      .flat()
      .find((e) => normalize(e.name) === normalize(backup.name));
    if (known) {
      p2.progression = known.progression;
      p2.weightIncrement = known.weightIncrement;
      p2.easyWeightIncrementMax = known.easyWeightIncrementMax;
    }
    if (!known && backup.mode === "bodyweight" && p2.progression !== "quality")
      p2.progression = "reps";
    // A backup gets only its own history; never transfer a weight from the replaced movement.
    const temp: Plan = {
      ...c.plan,
      program: { ...c.plan.program, [session.label]: [p2] },
    };
    const target = nextSession(
      temp,
      session.label,
      c.rows.filter((w) => w.date < c.date),
      c.date,
      c.state.recoveryRemaining,
    ).exercises[0];
    const replacement: SessionExercise = {
      prescription: p2,
      aims: target.aims,
      loadInstruction: target.loadInstruction,
      replaces: busy.replaces ?? busy.prescription.name,
    };
    const exercises = [
      replacement,
      ...session.exercises
        .filter((_, j) => j !== i)
        .map((e) =>
          busy.prescription.superset &&
          e.prescription.superset === busy.prescription.superset
            ? { ...e, prescription: { ...e.prescription, superset: undefined } }
            : e,
        ),
    ];
    await ctx.db.patch(session._id, { exercises });
    return {
      changed: true,
      reason:
        "Configured backup; logged sets retain the actual movement name and link to what it replaced.",
      choice: backup.name,
      session: await current(ctx),
    };
  },
});
export const rename_exercise = mutation({
  args: { token: v.string(), input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const p = renameInput.parse(input),
      c = await context(ctx),
      from = canonicalExerciseName(p.from, c.plan),
      to = p.to.trim();
    if (normalize(from) === normalize(to) && from === to)
      return { changed: false };
    const all = Object.values(c.plan.program).flat(),
      source = all.find((e) => normalize(e.name) === normalize(from)),
      target = all.find((e) => normalize(e.name) === normalize(to));
    if (
      !source &&
      !c.rows.some((w) =>
        w.exercises.some((e) => normalize(e.name) === normalize(from)),
      )
    )
      throw new Error("Source exercise not found");
    if (target && normalize(from) !== normalize(to) && !p.merge)
      throw new Error(
        "Target exists; merge=true requires the user's explicit same-movement confirmation",
      );
    if (source && target && loadConvention(source) !== loadConvention(target))
      throw new Error(
        "Cannot merge different load conventions without an explicit conversion",
      );
    const mergedAliases = [
      ...new Set([
        ...(source?.aliases ?? []),
        ...(target?.aliases ?? []),
        from,
      ]),
    ]
      .filter((a) => normalize(a) !== normalize(to))
      .slice(0, 10);
    const matches = (s: string) =>
      normalize(canonicalExerciseName(s, c.plan)) === normalize(from);
    const program = Object.fromEntries(
      Object.entries(c.plan.program).map(([day, list]) => [
        day,
        list
          .map((e) =>
            matches(e.name)
              ? {
                  ...e,
                  ...(target && p.merge ? target : {}),
                  name: to,
                  aliases: [
                    ...new Set([
                      ...(e.aliases ?? []),
                      ...(target?.aliases ?? []),
                      from,
                    ]),
                  ]
                    .filter((a) => normalize(a) !== normalize(to))
                    .slice(0, 10),
                }
              : {
                  ...e,
                  ...(p.merge && normalize(e.name) === normalize(to)
                    ? { aliases: mergedAliases }
                    : {}),
                  ...(e.backup && matches(e.backup.name)
                    ? { backup: { ...e.backup, name: to } }
                    : {}),
                },
          )
          .filter(
            (e, i, list) =>
              list.findIndex((x) => normalize(x.name) === normalize(e.name)) ===
              i,
          ),
      ]),
    );
    const nextPlan = planSchema.parse({ ...c.plan, program });
    await ctx.db.replace(c.plan._id, nextPlan);
    let rowsChanged = 0;
    for (const w of c.rows) {
      if (
        !w.exercises.some(
          (e) => matches(e.name) || (e.replaces && matches(e.replaces)),
        )
      )
        continue;
      const exercises: typeof w.exercises = [];
      for (const e of w.exercises) {
        const updated = {
          ...e,
          name: matches(e.name) ? to : e.name,
          ...(e.replaces && matches(e.replaces) ? { replaces: to } : {}),
        };
        const existing = exercises.find(
          (x) => normalize(x.name) === normalize(updated.name),
        );
        if (existing) existing.sets.push(...updated.sets);
        else exercises.push({ ...updated, sets: [...updated.sets] });
      }
      await ctx.db.patch(w._id, { exercises });
      rowsChanged++;
    }
    for (const n of await ctx.db.query("exerciseNotes").collect())
      if (matches(n.name)) await ctx.db.patch(n._id, { name: to });
    for (const s of await ctx.db.query("voiceSessions").collect())
      await ctx.db.patch(s._id, {
        exercises: s.exercises
          .map((e) => ({
            ...e,
            prescription: matches(e.prescription.name)
              ? { ...e.prescription, name: to }
              : e.prescription,
            ...(e.replaces && matches(e.replaces) ? { replaces: to } : {}),
          }))
          .filter(
            (e, i, list) =>
              list.findIndex(
                (x) =>
                  normalize(x.prescription.name) ===
                  normalize(e.prescription.name),
              ) === i,
          ),
        notes: s.notes.map((n) => ({
          ...n,
          name: matches(n.name) ? to : n.name,
        })),
        ...(s.lastExercise && matches(s.lastExercise)
          ? { lastExercise: to }
          : {}),
      });
    return {
      changed: true,
      from,
      to,
      rowsChanged,
      merged: p.merge,
      rotation: c.state.rotation,
    };
  },
});
