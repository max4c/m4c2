// Exercises the actual MCP transport + local Convex. Never creates production health records.
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
const client = new Client({ name: "maintenance-local-check", version: "1" });
const cleanup = [],
  completedDates = [],
  prefix = `maintenance-${Date.now()}`;
const date = (i) =>
  new Date(Date.UTC(2001, 0, 1 + i)).toISOString().slice(0, 10);
async function call(name, args = {}) {
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
  assert.equal(tools.length, 26);
  assert.equal(
    tools.find((t) => t.name === "estimate_maintenance").annotations
      .readOnlyHint,
    true,
  );
  assert.equal(
    tools.find((t) => t.name === "mark_food_day_complete").annotations
      .destructiveHint,
    false,
  );
  const plan = await call("get_plan");
  const remaining = await call("get_remaining");
  if (plan.targets.calories === null)
    assert.equal(remaining.nextAction.tool, "estimate_maintenance");
  for (const table of ["meals", "weights"]) {
    const rows = await call("query_entries", {
      table,
      start: date(0),
      end: date(13),
    });
    assert.equal(
      rows.page.length,
      0,
      "Fixture dates already contain data; refusing to mix test records",
    );
  }
  let correctedMeal;
  for (let i = 0; i < 14; i++) {
    const saved = await log("log_meal", "meals", {
      date: date(i),
      name: "Maintenance acceptance day",
      calories: 2500,
      protein: 150,
      carbs: 300,
      fat: 78,
      quality: 8,
    });
    if (i === 9) correctedMeal = saved;
    await call("mark_food_day_complete", {
      date: date(i),
      requestId: `${prefix}-complete-${i}`,
    });
    completedDates.push(date(i));
  }
  const insufficient = await call("estimate_maintenance", {
    asOf: date(13),
    days: 14,
  });
  assert.equal(insufficient.status, "insufficient_data");
  assert.equal(insufficient.estimateKcalPerDay, null);
  assert.equal(insufficient.coverage.consecutiveCompleteDays, 14);
  for (const i of [0, 2, 4, 7, 9, 13])
    await log("log_weight", "weights", { date: date(i), lbs: 170 });
  const ready = await call("estimate_maintenance", {
    asOf: date(13),
    days: 14,
  });
  assert.equal(ready.status, "provisional");
  assert.equal(ready.estimateKcalPerDay, 2500);
  assert.equal(ready.confidence, "low");
  assert.equal(ready.targetChanged, false);
  assert.deepEqual((await call("get_plan")).targets, plan.targets);
  console.log(
    "PASS 26-tool discovery, incomplete-data response, explicit completion, 14-day/6-weigh-in estimate, unchanged live targets",
  );
  const edited = await call("update_entry", {
    id: correctedMeal.id,
    fields: { calories: 2600 },
  });
  assert.equal(edited.day.foodLog.complete, false);
  assert.equal(edited.day.foodLog.needsReconfirmation, true);
  const retry = await call("mark_food_day_complete", {
    date: date(9),
    requestId: `${prefix}-complete-9`,
  });
  assert.equal(retry.day.foodLog.complete, false);
  assert.equal(
    (await call("estimate_maintenance", { asOf: date(13), days: 14 }))
      .estimateKcalPerDay,
    null,
  );
  console.log(
    "PASS corrections invalidate completeness and old completion retries cannot override the correction",
  );
  const workout = await log("log_workout", "workouts", {
    date: date(0),
    label: "Name match acceptance",
    kind: "lift",
    intensity: "hard",
    exercises: [{ name: "Incline dumbbell curls", sets: [{ w: 30, r: 10 }] }],
  });
  assert.equal(workout.entry.exercises[0].name, "Incline dumbbell curls");
  assert.equal(
    workout.exerciseNameMatches[0].suggestions[0].name,
    "Incline DB curl",
  );
  assert.equal(workout.exerciseNameMatches[0].requiresConfirmation, true);
  console.log(
    "PASS workout write returns existing name suggestions and preserves the user's logged movement/sets",
  );
} catch (error) {
  console.error(
    "Maintenance acceptance failed:",
    String(error?.message ?? error).replaceAll(
      env.MCP_PATH_TOKEN,
      "[REDACTED]",
    ),
  );
  process.exitCode = 1;
} finally {
  for (const date of completedDates)
    try {
      await call("mark_food_day_complete", { date, complete: false });
    } catch {
      process.exitCode = 1;
    }
  for (const entry of cleanup.reverse())
    try {
      await call("delete_entry", entry);
    } catch {
      process.exitCode = 1;
    }
  await client.close();
}
