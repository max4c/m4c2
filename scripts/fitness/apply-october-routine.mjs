// Apply the user-approved routine while preserving goals, targets and all logged data.
// Local by default. --production selects the existing private production config.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import ts from "typescript";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
const production = process.argv.includes("--production");
const config = production
  ? JSON.parse(readFileSync(".vercel/fitness-production.json", "utf8"))
  : Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .filter((s) => s.includes("=") && !s.startsWith("#"))
        .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1)]),
    );
assert(
  production
    ? new URL(config.CONVEX_URL).hostname === "quiet-yak-684.convex.cloud"
    : new URL(config.CONVEX_URL).hostname === "127.0.0.1",
);
const { outputText } = ts.transpileModule(
  readFileSync("shared/routine-october.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
);
const { octoberRoutine } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const db = new ConvexHttpClient(config.CONVEX_URL);
const auth = { token: config.CONVEX_SERVICE_TOKEN };
try {
  const before = await db.query(api.fitness.get_plan, auth);
  const beforeNext = await db.query(api.fitness.get_next_session, auth);
  mkdirSync(".vercel", { recursive: true });
  const backup = `.vercel/plan-before-october-${production ? "production" : "local"}-${Date.now()}.json`;
  writeFileSync(backup, JSON.stringify(before, null, 2), { mode: 0o600 });
  await db.mutation(api.fitness.update_plan, {
    ...auth,
    patch: octoberRoutine,
  });
  const after = await db.query(api.fitness.get_plan, auth);
  const afterNext = await db.query(api.fitness.get_next_session, auth);
  assert.deepEqual(after.program, octoberRoutine.program);
  assert.deepEqual(after.schedule, octoberRoutine.schedule);
  assert.deepEqual(after.rules, octoberRoutine.rules);
  assert.deepEqual(after.rotation, octoberRoutine.rotation);
  assert.deepEqual(after.targets, before.targets);
  assert.deepEqual(after.goals, before.goals);
  assert.equal(afterNext.next, beforeNext.next);
  console.log(
    JSON.stringify({
      applied: production ? "production" : "local",
      exercises: Object.values(after.program).reduce(
        (n, es) => n + es.length,
        0,
      ),
      scheduleDays: after.schedule.length,
      rotation: after.rotation,
      next: afterNext.next,
      goalsAndTargetsPreserved: true,
      backup,
    }),
  );
} catch (error) {
  let message = String(error?.message ?? error);
  for (const value of Object.values(config))
    if (typeof value === "string" && value.length >= 20)
      message = message.replaceAll(value, "[REDACTED]");
  console.error(message);
  process.exitCode = 1;
}
