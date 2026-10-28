import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
);
if (new URL(env.CONVEX_URL).hostname !== "127.0.0.1")
  throw new Error("Smoke test refuses nonlocal Convex deployment");
const base = "http://app.localhost:3000";
const headers = { Host: "app.localhost:3000" };
const url = `${base}/mcp/${env.MCP_PATH_TOKEN}`;
assert.equal((await fetch(base + "/mcp/wrong", { headers })).status, 404);
assert.equal(
  (
    await fetch(url, {
      headers: { ...headers, Origin: "https://untrusted.example" },
    })
  ).status,
  403,
);
assert.equal(
  (await fetch(url, { headers: { ...headers, Accept: "text/event-stream" } }))
    .status,
  405,
);
const client = new Client({ name: "supermedium-smoke", version: "1.0" });
await client.connect(
  new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers } }),
);
const list = await client.listTools();
assert.equal(list.tools.length, 14);
assert(list.tools.every((t) => t.description.includes("source of truth")));
async function call(name, args = {}) {
  const r = await client.callTool({ name, arguments: args });
  assert(!r.isError, `${name} failed: ${JSON.stringify(r)}`);
  return JSON.parse(r.content[0].text);
}
const plan = await call("get_plan");
assert.equal(plan.targets.protein, 150);
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: plan.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format();
await call("log_meal", {
  name: "Local test lunch",
  calories: 650,
  protein: 50,
  carbs: 70,
  fat: 20,
  quality: 8,
  requestId: "smoke-meal-0001",
});
await call("log_weight", { lbs: 170, requestId: "smoke-weight-0001" });
await call("log_supplements", {
  items: ["creatine"],
  requestId: "smoke-supplements-0001",
});
await call("log_steps", { date, count: 6500 });
await call("log_measurements", {
  arm: 14,
  shoulders: 45,
  chest: 40,
  waist: 32,
  requestId: "smoke-measurements-0001",
});
const w = {
  label: "Push",
  kind: "lift",
  intensity: "hard",
  exercises: [
    {
      name: "Cable overhead triceps extension",
      sets: [
        { w: 30, r: 12 },
        { w: 30, r: 12 },
        { w: 30, r: 12 },
        { w: 30, r: 12 },
      ],
    },
  ],
  requestId: "smoke-workout-0001",
};
const a = await call("log_workout", w);
assert.equal(a.id, (await call("log_workout", w)).id);
assert.equal((await call("get_next_session")).next, "pull");
assert((await call("get_remaining")).soFar.protein >= 50);
assert((await call("get_summary", { period: "week" })).THE_THREE_NUMBERS);
assert(
  (await call("query_entries", { table: "meals", start: date, end: date })).page
    .length >= 1,
);
const invalid = await client.callTool({
  name: "log_weight",
  arguments: { lbs: -5 },
});
assert(invalid.isError);
await client.close();
console.log(
  "PASS: real MCP SDK client → local Next.js → local Convex: discovery, all six log types, retries, next session, remaining, weekly summary, queries, validation, wrong-path and hostile-origin rejection.",
);
