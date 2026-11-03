// Actual MCP transport + local Convex. Never write production records.
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
const base = process.env.FOOD_TEST_ORIGIN ?? "http://app.localhost:3001";
assert.equal(new URL(base).hostname, "app.localhost");
const client = new Client({ name: "food-acceptance", version: "1" });
const cleanup = [],
  completeDates = [];
const prefix = `Food acceptance ${Date.now()}`;
const macros = { calories: 100, protein: 5, carbs: 15, fat: 2 };
const day = (i) =>
  new Date(Date.UTC(2000, 5, 1 + i)).toISOString().slice(0, 10);
async function call(name, args = {}) {
  const r = await client.callTool({ name, arguments: args });
  assert(!r.isError, `${name}: ${r.content?.[0]?.text}`);
  return JSON.parse(r.content[0].text);
}
async function log(name, table, args) {
  const r = await call(name, args);
  cleanup.push({ table, id: r.id });
  return r;
}
try {
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${base}/mcp/${env.MCP_PATH_TOKEN}`),
    ),
  );
  const list = await client.listTools();
  assert.equal(list.tools.length, 26);
  assert.equal(
    list.tools.find((t) => t.name === "lookup_food").annotations.readOnlyHint,
    false,
  );
  assert(
    list.tools.find((t) => t.name === "update_entry").inputSchema.properties
      .itemChange,
  );
  for (const table of ["meals", "weights"])
    assert.equal(
      (await call("query_entries", { table, start: day(0), end: day(14) })).page
        .length,
      0,
      "Fixture period must be empty",
    );
  const food = await call("save_food", {
    name: `${prefix} bowl`,
    brand: "Test restaurant",
    servingSize: "1 bowl",
    unitsPerServing: { count: 1, unit: "bowl" },
    macrosPerServing: macros,
    source: "restaurant",
    aliases: [`${prefix} usual`],
  });
  const lookup = await call("lookup_food", {
    query: `${prefix} usual`,
    count: 0.5,
    unit: "bowl",
  });
  assert.equal(lookup.source, "library");
  assert.equal(lookup.matches[0].calories, 50);
  assert.equal(lookup.matches[0].confidence, "medium");
  const meal = await log("log_meal", "meals", {
    date: day(14),
    name: "Acceptance lunch",
    quality: 8,
    items: [
      {
        name: `${prefix} bowl`,
        quantity: 2,
        unit: "bowl",
        macros,
        foodId: food.foodId,
      },
    ],
  });
  assert.equal(meal.day.totals.calories, 200);
  assert.equal(meal.day.confidence.mediumCalories, 200);
  const itemId = meal.entry.items[0].id;
  const add = {
    id: meal.id,
    requestId: `${prefix} add`,
    itemChange: {
      action: "add",
      item: {
        name: `${prefix} toast`,
        quantity: 2,
        unit: "slice",
        macros,
        source: "estimate",
        estimateConfirmed: true,
        needsRecheck: true,
      },
    },
  };
  const added = await call("update_entry", add);
  await call("update_entry", add);
  assert.equal(added.day.totals.calories, 400);
  assert.equal(
    (
      await call("lookup_food", {
        query: `${prefix} toast`,
        count: 1,
        unit: "slice",
      })
    ).matches[0].calories,
    100,
  );
  const replaced = await call("update_entry", {
    id: meal.id,
    itemChange: { action: "replace", id: itemId, item: { quantity: 1 } },
  });
  assert.equal(replaced.day.totals.calories, 300);
  const removed = await call("update_entry", {
    id: meal.id,
    itemChange: { action: "remove", id: added.entry.items[1].id },
  });
  assert.equal(removed.day.totals.calories, 100);
  await call("save_food", {
    foodId: food.foodId,
    name: `${prefix} bowl`,
    brand: "Test restaurant",
    servingSize: "1 bowl",
    unitsPerServing: { count: 1, unit: "bowl" },
    macrosPerServing: { ...macros, calories: 650 },
    source: "restaurant",
    aliases: [`${prefix} usual`],
  });
  assert.equal(
    (
      await call("lookup_food", {
        query: `${prefix} usual`,
        count: 0.5,
        unit: "bowl",
      })
    ).matches[0].calories,
    325,
  );
  assert.equal(
    (
      await call("update_entry", {
        id: meal.id,
        fields: { note: "Keep snapshot" },
      })
    ).entry.calories,
    100,
  );
  console.log(
    "PASS 26-tool discovery, library aliases/restaurant portions, estimate autosave, item add/retry/replace/remove and historical snapshots",
  );
  for (let i = 0; i < 14; i++) {
    await log("log_meal", "meals", {
      date: day(i),
      name: "Maintenance acceptance",
      calories: 2500,
      protein: 150,
      carbs: 300,
      fat: 80,
      quality: 8,
    });
    await call("mark_food_day_complete", { date: day(i) });
    completeDates.push(day(i));
    if ([0, 2, 4, 7, 9, 13].includes(i))
      await log("log_weight", "weights", { date: day(i), lbs: 170 });
  }
  const summary = await call("get_summary", { period: "day", asOf: day(14) });
  assert.equal(summary.maintenance.status, "provisional");
  assert.equal(summary.maintenance.stillNeeded.consecutiveCompleteDays, 0);
  const plan = await call("get_plan");
  assert.equal(
    summary.day.remaining.calories,
    (plan.targets.calories ?? 2500) - 100,
  );
  if (plan.targets.calories === null)
    assert.equal(summary.calorieBudget.basis, "maintenance_estimate");
  assert.equal(summary.nutrition.confidenceByDay[0].mediumCalories, 100);
  const reopened = await call("update_entry", {
    id: cleanup.find((e) => e.table === "meals" && e.id !== meal.id).id,
    fields: { calories: 2600 },
  });
  assert.equal(reopened.day.foodLog.complete, false);
  assert.equal(
    (await call("get_summary", { period: "day", asOf: day(14) })).maintenance
      .status,
    "insufficient_data",
  );
  console.log(
    "PASS readiness counts, available-maintenance calorie budget, per-day confidence, and invalidation after correction",
  );
  console.log(`Local fixture prefix: ${prefix}`);
} catch (error) {
  console.error(
    String(error?.message ?? error).replaceAll(
      env.MCP_PATH_TOKEN,
      "[REDACTED]",
    ),
  );
  process.exitCode = 1;
} finally {
  for (const date of completeDates)
    try {
      await call("mark_food_day_complete", { date, complete: false });
    } catch {
      process.exitCode = 1;
    }
  for (const row of cleanup.reverse())
    try {
      await call("delete_entry", row);
    } catch {
      process.exitCode = 1;
    }
  await client.close();
}
