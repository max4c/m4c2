// Real MCP acceptance checks. Writes are explicitly limited to the local Convex backend.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((x) => x.includes("="))
    .map((x) => [
      x.slice(0, x.indexOf("=")),
      x.slice(x.indexOf("=") + 1).replace(/^"|"$/g, ""),
    ]),
);
assert.equal(
  new URL(env.CONVEX_URL).hostname,
  "127.0.0.1",
  "Test writes must stay local",
);
const client = new Client({ name: "entry-local-check", version: "1" });
const cleanup = [],
  date = "2000-01-02",
  requestPrefix = `acceptance-${Date.now()}`;
async function call(name, args) {
  const result = await client.callTool({ name, arguments: args });
  assert(!result.isError, `${name} failed`);
  return JSON.parse(result.content[0].text);
}
async function log(name, table, input) {
  const result = await call(name, input);
  cleanup.push({ table, id: result.id });
  return result;
}
try {
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`http://app.localhost:3000/mcp/${env.MCP_PATH_TOKEN}`),
    ),
  );
  const { tools } = await client.listTools();
  assert.equal(tools.length, 18);
  const reads = [
    "query_entries",
    "get_summary",
    "get_plan",
    "get_next_session",
    "get_exercise_history",
    "get_remaining",
    "get_sleep",
    "lookup_food",
  ];
  for (const name of reads)
    assert.equal(
      tools.find((t) => t.name === name).annotations.readOnlyHint,
      true,
    );
  const expectedWrite = tools.find((t) => t.name === "log_meal").annotations;
  for (const t of tools) {
    assert.equal(t.annotations.destructiveHint, t.name === "delete_entry");
    if (t.name.startsWith("log_") || t.name === "update_entry")
      assert.deepEqual(t.annotations, expectedWrite);
  }
  console.log(
    "PASS actual MCP discovery: 18 tools, matching log/edit annotations, read-only hints, only delete marked destructive",
  );
  const plan = await call("get_plan", {});
  const baseline = await call("get_summary", { period: "day", asOf: date });
  const original = {
    date,
    name: "Acceptance breakfast",
    calories: 400,
    protein: 30,
    carbs: 35,
    fat: 15,
    quality: 8,
    requestId: `${requestPrefix}-meal`,
  };
  const meal = await log("log_meal", "meals", original);
  const patch = {
    id: meal.id,
    fields: {
      name: "Acceptance breakfast + 2 toast",
      calories: 560,
      protein: 36,
      carbs: 65,
      fat: 17,
    },
    requestId: `${requestPrefix}-edit`,
  };
  const edited = await call("update_entry", patch);
  assert.equal(edited.entry._id, meal.id);
  assert.equal(edited.day.mealEntries, baseline.day.mealEntries + 1);
  assert.equal(edited.day.totals.calories, baseline.day.totals.calories + 560);
  assert.equal(edited.day.targets.protein, plan.targets.protein);
  assert.equal(edited.entry.quality, 8);
  assert.deepEqual(
    (await call("get_summary", { period: "day", asOf: date })).day,
    edited.day,
  );
  console.log(
    "PASS one-call toast correction: same row, preserved fields, corrected live totals and plan targets",
  );
  const bad = await client.callTool({
    name: "update_entry",
    arguments: { id: meal.id, fields: { count: 100 } },
  });
  assert.equal(bad.isError, true);
  const walk = await log("log_workout", "workouts", {
    date,
    label: "Acceptance walk",
    kind: "cardio",
    intensity: "easy",
    durationMin: 50,
  });
  assert.equal(
    walk.day.movement.minutes,
    (baseline.day.movement.minutes ?? 0) + 50,
  );
  const hike = await log("log_workout", "workouts", {
    date,
    label: "Acceptance hike",
    kind: "cardio",
    intensity: "easy",
    distanceMi: 3,
    distanceMiMax: 4,
  });
  assert.equal(
    hike.day.movement.distanceMi,
    (baseline.day.movement.distanceMi ?? 0) + 3,
  );
  assert.equal(
    hike.day.movement.distanceMiMax,
    (baseline.day.movement.distanceMiMax ?? 0) + 4,
  );
  const summary = await call("get_summary", { period: "day", asOf: date });
  assert.deepEqual(summary.movement, hike.day.movement);
  console.log(
    "PASS persisted 50-minute walk and 3–4-mile hike; numeric summary and write totals agree",
  );
  const retry = await call("log_meal", original);
  assert.equal(retry.day.movement.sessions, hike.day.movement.sessions);
  assert.equal(retry.entry.calories, 560);
  const nextDate = "2000-01-03";
  const moved = await call("update_entry", {
    id: meal.id,
    fields: { date: nextDate },
  });
  assert.equal(moved.previousDay.totals.calories, baseline.day.totals.calories);
  assert.equal((await call("log_meal", original)).date, nextDate);
  const deleted = await call("delete_entry", { table: "meals", id: meal.id });
  assert.equal(deleted.deleted, true);
  assert.equal(deleted.entry, null);
  assert.equal(
    (await call("delete_entry", { table: "meals", id: meal.id })).day.date,
    nextDate,
  );
  console.log(
    "PASS bad-table edit rejected, retries return current totals, date edits return both days, deletion retries retain date",
  );
  const before = Date.now();
  const weight = await log("log_weight", "weights", { lbs: 170 });
  const after = Date.now();
  assert(weight.entry.ts >= before && weight.entry.ts <= after);
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: plan.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(weight.entry.ts));
  assert.equal(weight.entry.date, localDate);
  console.log(
    "PASS omitted date/time stored server timestamp and correct plan-local day",
  );
  // A real provider read complements the fixture tests without logging nutrition.
  const food = await call("lookup_food", {
    barcode: "3017620422003",
    count: 1,
    unit: "serving",
  });
  assert.equal(food.source, "off");
  assert(food.matches.length > 0);
  assert("gramsPerServing" in food.matches[0]);
  assert("portion" in food.matches[0]);
  console.log(
    "PASS live Open Food Facts barcode/household lookup returns serving metadata and portion resolution",
  );
} catch (error) {
  console.error(
    "Local entry acceptance failed:",
    String(error?.message ?? error).replaceAll(
      env.MCP_PATH_TOKEN,
      "[REDACTED]",
    ),
  );
  process.exitCode = 1;
} finally {
  for (const entry of cleanup.reverse()) {
    try {
      await call("delete_entry", entry);
    } catch {
      console.error("Local test cleanup failed; no credentials printed");
      process.exitCode = 1;
    }
  }
  await client.close();
}
