import { v } from "convex/values";
import {
  query,
  mutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { requireToken } from "./auth";
import {
  seedPlan,
  planSchema,
  todayAt,
  addDays,
  daysBetween,
  nextRotation,
  rotationOrder,
  rotationLabel,
  validRotation,
  periodStart,
} from "../shared/model";
import { exerciseHistory } from "../shared/exercise-history";
import { nextSession, summarize } from "../shared/analytics";
import {
  mealInput,
  workoutInput,
  weightInput,
  supplementsInput,
  stepsInput,
  measurementsInput,
  planPatch,
  queryInput,
  deleteInput,
  updateInput,
  entrySchemas,
  loggedTables,
} from "../shared/inputs";
import { dayTotals } from "../shared/day-totals";
import { z } from "zod";
const auth = { token: v.string() };
async function readPlan(ctx: QueryCtx) {
  const p = await ctx.db.query("plan").unique();
  if (!p) throw new Error("Plan not initialized; run the seed mutation.");
  return p;
}
async function readState(ctx: QueryCtx) {
  const s = await ctx.db.query("state").unique();
  if (!s) throw new Error("State not initialized; run the seed mutation.");
  return s;
}
async function loggedEntry(ctx: QueryCtx, id: string) {
  for (const table of loggedTables) {
    const rowId = ctx.db.normalizeId(table, id);
    if (rowId) return { table, id: rowId, row: await ctx.db.get(rowId) };
  }
  throw new Error("ID must belong to a logged entry");
}
async function readDay(
  ctx: QueryCtx,
  date: string,
  plan: Awaited<ReturnType<typeof readPlan>>,
) {
  const [meals, workouts] = await Promise.all([
    ctx.db
      .query("meals")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect(),
    ctx.db
      .query("workouts")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect(),
  ]);
  return dayTotals({ meals, workouts }, plan, date);
}
async function writeResult<
  T extends { id: string; date?: string | null; previousDate?: string },
>(ctx: QueryCtx, result: T) {
  const plan = await readPlan(ctx);
  const found = await loggedEntry(ctx, result.id);
  const deleted = !found.row
    ? await ctx.db
        .query("entryDeletions")
        .withIndex("by_entry", (q) => q.eq("entryId", result.id))
        .unique()
    : null;
  const date =
    found.row?.date ??
    deleted?.date ??
    result.date ??
    todayAt(Date.now(), plan.timezone);
  return {
    ...result,
    date,
    entry: found.row,
    day: await readDay(ctx, date, plan),
    ...(result.previousDate && result.previousDate !== date
      ? { previousDay: await readDay(ctx, result.previousDate, plan) }
      : {}),
  };
}
async function history(ctx: QueryCtx, start: string, end: string) {
  const [meals, workouts, weights, steps, supplements, measurements, photos] =
    await Promise.all([
      ctx.db
        .query("meals")
        .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
        .collect(),
      ctx.db
        .query("workouts")
        .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
        .collect(),
      ctx.db
        .query("weights")
        .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
        .collect(),
      ctx.db
        .query("steps")
        .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
        .collect(),
      ctx.db
        .query("supplements")
        .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
        .collect(),
      ctx.db
        .query("measurements")
        .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
        .collect(),
      ctx.db
        .query("photos")
        .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
        .collect(),
    ]);
  return { meals, workouts, weights, steps, supplements, measurements, photos };
}
export const seed = mutation({
  args: auth,
  handler: async (ctx, { token }) => {
    requireToken(token);
    if (!(await ctx.db.query("plan").unique()))
      await ctx.db.insert("plan", seedPlan);
    if (!(await ctx.db.query("state").unique()))
      await ctx.db.insert("state", {
        rotation: { next: "push" },
        recoveryRemaining: 0,
      });
    return { initialized: true };
  },
});
export const get_plan = query({
  args: auth,
  handler: async (ctx, { token }) => {
    requireToken(token);
    return readPlan(ctx);
  },
});
export const update_plan = mutation({
  args: { ...auth, patch: v.any() },
  handler: async (ctx, { token, patch }) => {
    requireToken(token);
    const old = await readPlan(ctx);
    const p = planPatch.parse(patch);
    const merged = planSchema.parse({
      ...old,
      ...p,
      program: { ...old.program, ...p.program },
      targets: { ...old.targets, ...p.targets },
    });
    await ctx.db.replace(old._id, merged);
    const state = await readState(ctx);
    if (!rotationOrder(merged).includes(state.rotation.next))
      await ctx.db.patch(state._id, {
        rotation: { next: rotationOrder(merged)[0] },
      });
    if (p.rotation && state.recoveryRemaining > 0) {
      // Keep only pending days that can still be logged in the new rotation.
      // Newly added days join the next recovery cycle, not one already in progress.
      const recoveryDays = (state.recoveryDays ?? rotationOrder(old)).filter(
        (day) => rotationOrder(merged).includes(day),
      );
      await ctx.db.patch(state._id, {
        recoveryDays,
        recoveryRemaining: recoveryDays.length,
      });
    }
    return merged;
  },
});
const schemas = {
  log_meal: mealInput,
  log_workout: workoutInput,
  log_weight: weightInput,
  log_supplements: supplementsInput,
  log_steps: stepsInput,
  log_measurements: measurementsInput,
};
function stamp(input: { date?: string; ts?: number }, timezone: string) {
  const ts = input.ts ?? Date.now();
  if (ts > Date.now() + 300000)
    throw new Error("Future timestamps are not supported");
  const date = input.date ?? todayAt(ts, timezone);
  if (date > todayAt(Date.now(), timezone))
    throw new Error("Future dates are not supported");
  return { date, ts };
}
async function saveLog(
  ctx: MutationCtx,
  op: keyof typeof schemas,
  raw: unknown,
) {
  const plan = await readPlan(ctx);
  const parsed = schemas[op].parse(raw);
  const { requestId, ...fields } = parsed;
  const fingerprint = JSON.stringify({ op, fields });
  if (requestId) {
    const prev = await ctx.db
      .query("requests")
      .withIndex("by_request", (q) => q.eq("requestId", requestId))
      .unique();
    if (prev) {
      if (prev.fingerprint !== fingerprint)
        throw new Error("requestId already used with different content");
      return prev.result;
    }
  }
  let id: string;
  let advanced = false;
  if (op === "log_meal") {
    const { requestId: _, ...p } = mealInput.parse(raw);
    id = await ctx.db.insert("meals", { ...p, ...stamp(p, plan.timezone) });
  } else if (op === "log_weight") {
    const { requestId: _, ...p } = weightInput.parse(raw);
    id = await ctx.db.insert("weights", { ...p, ...stamp(p, plan.timezone) });
  } else if (op === "log_supplements") {
    const { requestId: _, ...p } = supplementsInput.parse(raw);
    id = await ctx.db.insert("supplements", {
      ...p,
      ...stamp(p, plan.timezone),
    });
  } else if (op === "log_measurements") {
    const { requestId: _, ...p } = measurementsInput.parse(raw);
    id = await ctx.db.insert("measurements", {
      ...p,
      ...stamp(p, plan.timezone),
    });
  } else if (op === "log_steps") {
    const { requestId: _, ...fields } = stepsInput.parse(raw);
    const p = { ...fields, ...stamp(fields, plan.timezone) };
    const existing = await ctx.db
      .query("steps")
      .withIndex("by_date", (q) => q.eq("date", p.date))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, p);
      id = existing._id;
    } else id = await ctx.db.insert("steps", p);
  } else {
    const { requestId: _, ...p } = workoutInput.parse(raw);
    const w = { ...p, ...stamp(p, plan.timezone) };
    const state = await readState(ctx);
    const lastRow = await ctx.db
      .query("workouts")
      .withIndex("by_date_ts")
      .order("desc")
      .filter((q) => q.eq(q.field("kind"), "lift"))
      .first();
    const last = [lastRow, state.lastLift]
      .filter((x) => x != null)
      .sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts)[0];
    const sameDay = await ctx.db
      .query("workouts")
      .withIndex("by_date", (q) => q.eq("date", w.date))
      .collect();
    // Backfilled entries remain historical and never rewind the live rotation.
    const current =
      !last || w.date > last.date || (w.date === last.date && w.ts >= last.ts);
    let remaining = state.recoveryRemaining;
    let recoveryDays = state.recoveryDays ?? [];
    if (
      current &&
      w.kind === "lift" &&
      last &&
      daysBetween(last.date, w.date) > 14
    ) {
      recoveryDays = rotationOrder(plan);
      remaining = recoveryDays.length;
    }
    const deload =
      w.kind === "lift" &&
      ((current && remaining > 0) ||
        sameDay.some((row) => row.kind === "lift" && row.deload));
    id = await ctx.db.insert("workouts", { ...w, deload });
    if (current && w.kind === "lift") {
      const r = rotationLabel(w.label);
      if (validRotation(w, rotationOrder(plan)) && r.success) {
        const marker = await ctx.db
          .query("rotationAdvances")
          .withIndex("by_date_label", (q) =>
            q.eq("date", w.date).eq("label", r.data),
          )
          .unique();
        const alreadyLogged = sameDay.some((row) => {
          const label = rotationLabel(row.label);
          return (
            row._id !== id &&
            validRotation(row, rotationOrder(plan)) &&
            label.success &&
            label.data === r.data
          );
        });
        advanced = !marker && !alreadyLogged;
        if (!marker)
          await ctx.db.insert("rotationAdvances", {
            date: w.date,
            label: r.data,
          });
      }
      if (advanced && r.success && recoveryDays.includes(r.data)) {
        recoveryDays = recoveryDays.filter((day) => day !== r.data);
        remaining = recoveryDays.length;
      }
      await ctx.db.patch(state._id, {
        lastLift: { date: w.date, ts: w.ts },
        rotation:
          advanced && r.success
            ? { next: nextRotation(r.data, rotationOrder(plan)) }
            : state.rotation,
        recoveryRemaining: remaining,
        recoveryDays,
      });
    }
  }
  const saved = (await loggedEntry(ctx, id)).row!;
  const result = { id, rotationAdvanced: advanced, date: saved.date };
  if (requestId)
    await ctx.db.insert("requests", { requestId, fingerprint, result });
  return result;
}
export const log = mutation({
  args: {
    ...auth,
    operation: v.union(
      v.literal("log_meal"),
      v.literal("log_workout"),
      v.literal("log_weight"),
      v.literal("log_supplements"),
      v.literal("log_steps"),
      v.literal("log_measurements"),
    ),
    input: v.any(),
  },
  handler: async (ctx, { token, operation, input }) => {
    requireToken(token);
    const result = await saveLog(ctx, operation, input);
    return writeResult(ctx, result);
  },
});
export const get_next_session = query({
  args: auth,
  handler: async (ctx, { token }) => {
    requireToken(token);
    const plan = await readPlan(ctx),
      state = await readState(ctx),
      today = todayAt(Date.now(), plan.timezone);
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_date_ts")
      .order("desc")
      .collect();
    return nextSession(
      plan,
      state.rotation.next,
      workouts,
      today,
      state.recoveryRemaining,
    );
  },
});
export const get_remaining = query({
  args: auth,
  handler: async (ctx, { token }) => {
    requireToken(token);
    const plan = await readPlan(ctx),
      now = Date.now(),
      today = todayAt(now, plan.timezone);
    const d = await history(ctx, today, today);
    const protein = d.meals.reduce((s, m) => s + m.protein, 0),
      calories = d.meals.reduce((s, m) => s + m.calories, 0);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: plan.timezone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value),
      minute = Number(parts.find((p) => p.type === "minute")?.value);
    const hoursUntilBedtime = Math.max(
      0,
      plan.bedtimeHour - hour - minute / 60,
    );
    return {
      date: today,
      timezone: plan.timezone,
      soFar: {
        protein,
        calories,
        meals: d.meals.length,
        workouts: d.workouts.length,
      },
      remaining: {
        protein: Math.max(0, plan.targets.protein - protein),
        calories:
          plan.targets.calories === null
            ? null
            : Math.max(0, plan.targets.calories - calories),
      },
      overTarget: {
        protein: Math.max(0, protein - plan.targets.protein),
        calories:
          plan.targets.calories === null
            ? null
            : Math.max(0, calories - plan.targets.calories),
      },
      targets: plan.targets,
      workoutHappened: d.workouts.length > 0,
      hoursUntilBedtime,
      lighterMealSuggested: hoursUntilBedtime <= 2,
      note:
        plan.targets.calories === null
          ? "Calorie target is unset. Ask the user for a daily target; do not invent a remaining calorie budget."
          : "Choose food to close the protein gap within remaining calories; lighter meals close to bedtime.",
    };
  },
});
export const get_summary = query({
  args: {
    ...auth,
    period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
    asOf: v.optional(v.string()),
  },
  handler: async (ctx, { token, period, asOf }) => {
    requireToken(token);
    const p = await readPlan(ctx),
      today = asOf ?? todayAt(Date.now(), p.timezone);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(today) ||
      !Number.isFinite(Date.parse(today)) ||
      new Date(today).toISOString().slice(0, 10) !== today ||
      today > todayAt(Date.now(), p.timezone)
    )
      throw new Error("Invalid summary date");
    return summarize(
      await history(ctx, addDays(periodStart(today, period), -28), today),
      p,
      today,
      period,
    );
  },
});
export const query_entries = query({
  args: { ...auth, input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const p = queryInput.parse(input);
    const page = await ctx.db
      .query(p.table)
      .withIndex("by_date", (q) => q.gte("date", p.start).lte("date", p.end))
      .order("desc")
      .paginate({ cursor: p.cursor ?? null, numItems: p.limit });
    return {
      ...page,
      page: page.page.filter((row) =>
        Object.entries(p.filters).every(
          ([key, value]) =>
            key in row &&
            String(Reflect.get(row, key)).toLowerCase() ===
              value?.toLowerCase(),
        ),
      ),
    };
  },
});
export const update_entry = mutation({
  args: { ...auth, input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const { id, fields, requestId } = updateInput.parse(input);
    const fingerprint = JSON.stringify({ op: "update_entry", id, fields });
    if (requestId) {
      const previous = await ctx.db
        .query("requests")
        .withIndex("by_request", (q) => q.eq("requestId", requestId))
        .unique();
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new Error("requestId already used with different content");
        return writeResult(ctx, previous.result);
      }
    }
    const found = await loggedEntry(ctx, id);
    if (!found.row) throw new Error("Logged entry not found");
    const schema = entrySchemas[found.table];
    const keys = Object.keys(fields);
    for (const key of keys)
      if (key === "requestId" || !(key in schema.shape))
        throw new Error(`Field ${key} is not valid for ${found.table}`);
    const candidate: Record<string, unknown> = { ...found.row, ...fields };
    for (const key of ["durationMin", "distanceMi", "distanceMiMax"])
      if (candidate[key] === null) delete candidate[key];
    const parsed = schema.parse(candidate);
    const plan = await readPlan(ctx);
    stamp(parsed, plan.timezone); // Validate explicitly edited dates/times; omitted fields stay unchanged.
    const date = parsed.date!;
    if (found.table === "steps") {
      const sameDate = await ctx.db
        .query("steps")
        .withIndex("by_date", (q) => q.eq("date", date))
        .unique();
      if (sameDate && sameDate._id !== found.id)
        throw new Error(
          "Steps already exist for that date; edit that row instead",
        );
    }
    // Validate the merged row, but only patch keys that were actually supplied.
    // Defaults from a schema must never erase omitted values.
    const patch = Object.fromEntries(
      keys.map((key) => [key, Reflect.get(parsed, key)]),
    );
    if (found.table === "workouts") {
      const before = await ctx.db.get(ctx.db.normalizeId("workouts", id)!);
      const after = workoutInput.parse(candidate);
      for (const w of [before!, { ...after, date, ts: after.ts! }]) {
        if (validRotation(w, rotationOrder(plan))) {
          const label = rotationLabel(w.label);
          if (label.success) {
            const marker = await ctx.db
              .query("rotationAdvances")
              .withIndex("by_date_label", (q) =>
                q.eq("date", w.date).eq("label", label.data),
              )
              .unique();
            if (!marker)
              await ctx.db.insert("rotationAdvances", {
                date: w.date,
                label: label.data,
              });
          }
        }
      }
      // Preserve the latest-date guard, without advancing or rewinding rotation/recovery.
      const state = await readState(ctx);
      const latest = [
        state.lastLift,
        before?.kind === "lift" ? before : null,
        after.kind === "lift" ? { date, ts: after.ts! } : null,
      ]
        .filter((w) => w != null)
        .sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts)[0];
      if (latest)
        await ctx.db.patch(state._id, {
          lastLift: { date: latest.date, ts: latest.ts },
        });
    }
    await ctx.db.patch(found.id, patch);
    const result = { id, updated: true, date, previousDate: found.row.date };
    if (requestId)
      await ctx.db.insert("requests", { requestId, fingerprint, result });
    return writeResult(ctx, result);
  },
});
export const delete_entry = mutation({
  args: { ...auth, input: v.any() },
  handler: async (ctx, { token, input }) => {
    requireToken(token);
    const { table, id } = deleteInput.parse(input);
    const rowId = ctx.db.normalizeId(table, id);
    if (!rowId) throw new Error("ID does not belong to the requested table");
    const row = await ctx.db.get(rowId);
    if (!row) {
      const receipt = await ctx.db
        .query("entryDeletions")
        .withIndex("by_entry", (q) => q.eq("entryId", id))
        .unique();
      return writeResult(ctx, {
        id,
        deleted: false,
        date: receipt?.date ?? null,
      });
    }
    // Retain the advancement marker even when deleting a pre-marker workout.
    if (table === "workouts") {
      const workoutId = ctx.db.normalizeId("workouts", id)!;
      const workout = await ctx.db.get(workoutId);
      if (workout?.kind === "lift") {
        const state = await readState(ctx);
        const last = state.lastLift;
        if (
          !last ||
          workout.date > last.date ||
          (workout.date === last.date && workout.ts > last.ts)
        ) {
          await ctx.db.patch(state._id, {
            lastLift: { date: workout.date, ts: workout.ts },
          });
        }
      }
      if (
        workout &&
        validRotation(workout, rotationOrder(await readPlan(ctx)))
      ) {
        const label = rotationLabel(workout.label);
        if (label.success) {
          const marker = await ctx.db
            .query("rotationAdvances")
            .withIndex("by_date_label", (q) =>
              q.eq("date", workout.date).eq("label", label.data),
            )
            .unique();
          if (!marker)
            await ctx.db.insert("rotationAdvances", {
              date: workout.date,
              label: label.data,
            });
        }
      }
    }
    await ctx.db.delete(rowId);
    await ctx.db.insert("entryDeletions", {
      entryId: id,
      table,
      date: row.date,
    });
    return writeResult(ctx, { id, deleted: true, date: row.date });
  },
});
export const add_photo = mutation({
  args: { ...auth, date: v.string(), r2Key: v.string() },
  handler: async (ctx, { token, date, r2Key }) => {
    requireToken(token);
    z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .parse(date);
    if (!/^progress\/[\w/-]+\.(jpg|png|webp)$/.test(r2Key))
      throw new Error("Invalid photo key");
    return ctx.db.insert("photos", { date, r2Key, ts: Date.now() });
  },
});
export const dashboard = query({
  args: auth,
  handler: async (ctx, { token }) => {
    requireToken(token, "dashboard");
    const plan = await readPlan(ctx),
      today = todayAt(Date.now(), plan.timezone),
      start = addDays(today, -89);
    const data = await history(ctx, start, today);
    const allHistory = await history(ctx, "1900-01-01", today);
    const dates = Object.values(allHistory).flatMap((rows) =>
      rows.map((row) => row.date),
    );
    const firstWeek = periodStart(dates.sort()[0] ?? today, "week");
    const weeklyHistory = [];
    for (
      let weekStart = periodStart(today, "week");
      weekStart >= firstWeek;
      weekStart = addDays(weekStart, -7)
    ) {
      const end = addDays(weekStart, 6) > today ? today : addDays(weekStart, 6);
      weeklyHistory.push(summarize(allHistory, plan, end, "week"));
    }
    const measurements = await ctx.db
        .query("measurements")
        .withIndex("by_date", (q) => q.lte("date", today))
        .order("desc")
        .take(36),
      photos = await ctx.db
        .query("photos")
        .withIndex("by_date", (q) => q.lte("date", today))
        .order("desc")
        .take(36);
    const workoutHistory = await ctx.db
      .query("workouts")
      .withIndex("by_date_ts")
      .order("desc")
      .collect();
    const state = await readState(ctx);
    const allMeals = await ctx.db.query("meals").withIndex("by_date").collect();
    const mealCalendar: Record<string, { calories: number; meals: number }> =
      {};
    for (const meal of allMeals) {
      const day = mealCalendar[meal.date] ?? { calories: 0, meals: 0 };
      day.calories += meal.calories;
      day.meals++;
      mealCalendar[meal.date] = day;
    }
    return {
      plan,
      today,
      workoutHistory,
      nextSession: nextSession(
        plan,
        state.rotation.next,
        workoutHistory,
        today,
        state.recoveryRemaining,
      ),
      mealCalendar,
      weeklyHistory,
      ...data,
      measurements: measurements.reverse(),
      photos,
      week: summarize(data, plan, today, "week"),
    };
  },
});

// Persistent per-client limit; raw client IPs are never stored.
export const dashboard_login_attempt = mutation({
  args: { ...auth, client: v.string() },
  handler: async (ctx, { token, client }) => {
    requireToken(token);
    const now = Date.now(),
      row = await ctx.db
        .query("loginAttempts")
        .withIndex("by_client", (q) => q.eq("client", client))
        .unique();
    const stale = await ctx.db
      .query("loginAttempts")
      .withIndex("by_window", (q) => q.lt("windowStart", now - 86400000))
      .take(50);
    for (const old of stale)
      if (old._id !== row?._id) await ctx.db.delete(old._id);
    if (!row) {
      await ctx.db.insert("loginAttempts", {
        client,
        windowStart: now,
        count: 1,
      });
      return { allowed: true };
    }
    if (now - row.windowStart >= 15 * 60 * 1000) {
      await ctx.db.patch(row._id, { client, windowStart: now, count: 1 });
      return { allowed: true };
    }
    if (row.count >= 10) return { allowed: false };
    await ctx.db.patch(row._id, { count: row.count + 1 });
    return { allowed: true };
  },
});

export const get_exercise_history = query({
  args: { ...auth, name: v.string() },
  handler: async (ctx, { token, name }) => {
    requireToken(token);
    if (!name.trim() || name.length > 160)
      throw new Error("Exercise name required");
    const plan = await readPlan(ctx);
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_date_ts")
      .order("desc")
      .collect();
    return exerciseHistory(workouts, name, plan);
  },
});
