// This acceptance harness writes only to the local Convex database.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { voicePlan } from "./voice-plan.mjs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((x) => x.includes("="))
    .map((x) => [
      x.slice(0, x.indexOf("=")),
      x.slice(x.indexOf("=") + 1).replace(/^"|"$/g, ""),
    ]),
);
assert.equal(new URL(env.CONVEX_URL).hostname, "127.0.0.1");
const client = new Client({ name: "voice-local-test", version: "1" });
const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  assert(!r.isError, `${name} failed: ${r.content[0].text}`);
  return JSON.parse(r.content[0].text);
};
try {
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`http://app.localhost:3000/mcp/${env.MCP_PATH_TOKEN}`),
    ),
  );
  assert.equal((await client.listTools()).tools.length, 25);
  const config = JSON.parse(
    readFileSync(".vercel/fitness-production.json", "utf8"),
  );
  const reference = await new ConvexHttpClient(config.CONVEX_URL).query(
    api.fitness.get_plan,
    { token: config.CONVEX_SERVICE_TOKEN },
  );
  await call("update_plan", {
    patch: {
      program: voicePlan(reference),
      rotation: reference.rotation,
      schedule: reference.schedule,
    },
  });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: reference.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const yesterday = new Date(Date.parse(today + "T12:00:00Z") - 86400000)
    .toISOString()
    .slice(0, 10);
  const old = await call("query_entries", {
    table: "workouts",
    start: today,
    end: today,
  });
  for (const row of old.page)
    await call("delete_entry", { table: "workouts", id: row._id });
  const sets = [
      [14, 14, 16],
      [12, 12, 12],
      [12, 12, 12],
      [10, 12, 10],
      [6, 6, 5],
      [8, 8, 8],
    ],
    weights = [10, 20, 40, 37.5, 0, 0];
  const plan = await call("get_plan");
  await call("log_workout", {
    date: yesterday,
    label: "Upper",
    kind: "lift",
    intensity: "hard",
    exercises: plan.program.upper.map((e, i) => ({
      name: e.name,
      sets: sets[i].map((r, j) => ({
        w: weights[i],
        r,
        ...(j === 2 && i === 1
          ? { rir: 0 }
          : j === 2 && i === 2
            ? { rir: 3 }
            : {}),
      })),
    })),
    requestId: `voice-replay-${Date.now()}`,
  });
  // Adoption of an existing same-day Upper row is part of acceptance; it leaves Legs next.
  await call("log_workout", {
    label: "Upper",
    kind: "lift",
    intensity: "hard",
    exercises: [{ name: "Lateral raise", sets: [{ w: 10, r: 15 }] }],
    requestId: `voice-adopt-${Date.now()}`,
  });
  const first = await call("get_current_session");
  assert.equal(first.label, "upper");
  assert.equal(first.exercises[0].setsDone, 1);
  assert.equal(first.exercises[1].aims[0].w, 25);
  assert.equal(first.exercises[2].aims[0].wMax, 50);
  assert.equal(first.exercises[4].aims[0].w, 5);
  const login = await fetch("http://app.localhost:3000/fitness/api/login", {
    method: "POST",
    headers: {
      Origin: "http://app.localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: "voice-test-only" }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const abort = new AbortController();
  const stream = await fetch(
    "http://app.localhost:3000/fitness/api/session-stream",
    { headers: { Cookie: cookie }, signal: abort.signal },
  );
  assert.equal(stream.status, 200);
  const reader = stream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  async function nextState(predicate) {
    const end = Date.now() + 15000;
    while (Date.now() < end) {
      const result = await reader.read();
      if (result.done) throw new Error("SSE closed");
      buffer += decoder.decode(result.value);
      let i;
      while ((i = buffer.indexOf("\n\n")) >= 0) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);
        if (line.startsWith("data: ")) {
          const state = JSON.parse(line.slice(6));
          if (predicate(state)) return state;
        }
      }
    }
    throw new Error("No live event");
  }
  await nextState((s) => s.exercises[0].setsDone === 1);
  const input = {
    exercise: "Lateral raise",
    weight: 10,
    reps: 15,
    requestId: `voice-stream-${Date.now()}`,
  };
  const result = await call("log_set", input);
  assert.equal(result.session.exercises[0].setsDone, 2);
  assert.equal(result.day.movement.liftDays, 1);
  assert.equal((await call("log_set", input)).replayed, true);
  const event = await nextState((s) => s.rest?.eventId === input.requestId);
  assert.equal(event.exercises[0].setsDone, 2);
  assert.equal(event.rest.seconds, 60);
  abort.abort();
  assert.equal((await call("get_next_session")).next, "legs");
  await call("log_set", {
    exercise: "Lateral raise",
    weight: 10,
    reps: 17,
    requestId: `voice-third-${Date.now()}`,
  });
  const pair = await call("log_set", {
    exercise: "Preacher curl",
    weight: 25,
    reps: 8,
    rir: 2,
    requestId: `voice-pair-${Date.now()}`,
  });
  assert.equal(pair.session.rest.seconds, 0);
  assert.equal(pair.session.next.exercise, "Overhead DB triceps extension");
  writeFileSync(
    ".vercel/voice-local-evidence.json",
    JSON.stringify(
      {
        date: today,
        setsDone: pair.session.setsDone,
        next: pair.session.next,
        rest: pair.session.rest,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS real MCP: 25 tools, single-set append, retry dedup, daily totals, rotation, Nov 2 targets, superset next-step; authenticated Convex SSE delivered the new set without polling.",
  );
} catch (e) {
  console.error(
    String(e?.message ?? e)
      .replaceAll(env.MCP_PATH_TOKEN, "[REDACTED]")
      .replaceAll(env.CONVEX_SERVICE_TOKEN, "[REDACTED]"),
  );
  process.exitCode = 1;
} finally {
  await client.close();
}
