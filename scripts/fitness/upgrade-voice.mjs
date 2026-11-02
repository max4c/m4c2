import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { voicePlan } from "./voice-plan.mjs";
const production = process.argv.includes("--production");
const env = production
  ? JSON.parse(readFileSync(".vercel/fitness-production.json", "utf8"))
  : Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .filter((x) => x.includes("="))
        .map((x) => [
          x.slice(0, x.indexOf("=")),
          x.slice(x.indexOf("=") + 1).replace(/^"|"$/g, ""),
        ]),
    );
if (!production && new URL(env.CONVEX_URL).hostname !== "127.0.0.1")
  throw new Error("Local only");
const db = new ConvexHttpClient(env.CONVEX_URL),
  auth = { token: env.CONVEX_SERVICE_TOKEN };
try {
  const plan = await db.query(api.fitness.get_plan, auth),
    program = voicePlan(plan);
  const page = production
    ? await db.query(api.fitness.query_entries, {
        ...auth,
        input: {
          table: "workouts",
          start: "2026-11-02",
          end: "2026-11-02",
          limit: 100,
        },
      })
    : null;
  const row = page?.page?.find(
    (w) => w._id === "k17e07xdg33csryw4tahwjxva58hfyth",
  );
  if (production && !row)
    throw new Error("Expected Nov 2 entry not found; no changes made");
  const backup = ".vercel/voice-before-production.json";
  if (production && !existsSync(backup))
    writeFileSync(backup, JSON.stringify({ plan, row }, null, 2), {
      mode: 0o600,
    });
  await db.mutation(api.fitness.update_plan, { ...auth, patch: { program } });
  if (row) {
    const exercises = row.exercises.map((e) => {
      const p = program.upper.find(
        (p) => p.name === e.name || p.aliases?.includes(e.name),
      );
      return {
        ...e,
        name: p?.name ?? e.name,
        ...(p ? { loadConvention: p.loadConvention } : {}),
        sets: e.sets.map((s, i) => ({
          ...s,
          ...(i === 2 && e.name === "Preacher curl" && s.rir === undefined
            ? { effort: "atLimit" }
            : {}),
          ...(i === 2 &&
          /overhead.*triceps/i.test(e.name) &&
          s.rir === undefined
            ? { effort: "easy" }
            : {}),
        })),
      };
    });
    await db.mutation(api.fitness.update_entry, {
      ...auth,
      input: {
        id: row._id,
        fields: { exercises },
        requestId: "voice-nov2-effort-migration-v1",
      },
    });
    for (const [exercise, note] of [
      [
        "Preacher curl",
        "Nov 2's final set was at the limit. Take the smallest increase: 25 lb of plates, +2.5 lb per side.",
      ],
      [
        "Overhead DB triceps extension",
        "Nov 2's 40 lb sets felt easy. Try 45–50 lb next time; take the last round to true failure with good form.",
      ],
    ])
      await db.mutation(api.voice.set_next_session_note, {
        ...auth,
        input: { exercise, note },
      });
  }
  console.log(
    `Updated ${production ? "production" : "local"} load conventions, stations and backups; ${row ? "Nov 2 qualitative effort and one-use notes saved" : "no historical entries changed"}.`,
  );
} catch (e) {
  console.error(
    "Voice migration failed:",
    String(e?.message ?? e).replaceAll(env.CONVEX_SERVICE_TOKEN, "[REDACTED]"),
  );
  process.exitCode = 1;
}
