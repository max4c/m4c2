// Read-only checks against the deployed app. Never inserts sample health records.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const config = JSON.parse(
  readFileSync(".vercel/fitness-production.json", "utf8"),
);
const base = `https://${config.FITNESS_APP_HOST}`;
try {
  const root = await fetch(base);
  assert.equal(root.status, 200);
  assert.equal(root.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal((await fetch(base + "/mcp/invalid")).status, 404);
  assert.equal((await fetch(base + "/blog")).status, 404);
  assert.equal((await fetch(base + "/fitness/api/data")).status, 401);
  const password = readFileSync(".vercel/supermedium-password.txt", "utf8").trim();
  const login = (value, origin = base) => fetch(base + "/fitness/api/login", {method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({password:value})});
  assert.equal((await login("wrong", "https://example.com")).status,403);
  assert.equal((await login("wrong")).status,401);
  const session = await login(password);
  assert.equal(session.status,200);
  const cookie = session.headers.get("set-cookie");
  assert(cookie.includes("HttpOnly") && cookie.includes("Secure") && /SameSite=strict/i.test(cookie));
  const data = await fetch(base + "/fitness/api/data",{headers:{Cookie:cookie.split(";")[0]}});
  assert.equal(data.status,200);
  const body = await data.text();
  assert(!body.includes(config.DASHBOARD_TOKEN));
  const dashboard=JSON.parse(body);
  assert(dashboard.weeklyHistory.length>=1);
  assert.equal(typeof dashboard.weeklyHistory[0].training.cardioSessions,"number");
  assert("normalPrevious28Days" in dashboard.weeklyHistory[0].stepsDetail);
  assert("photos" in dashboard.weeklyHistory[0].checkIns);
  console.log("PASS password login, cookie flags, private data, wrong password and cross-origin rejection");
  const client = new Client({
    name: "fitness-production-check",
    version: "1.0",
  });
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(`${base}/mcp/${config.MCP_PATH_TOKEN}`),
    ),
  );
  const list = await client.listTools();
  assert.equal(list.tools.length, 16);
  for (const [name, args] of [
    ["get_plan", {}],
    ["get_next_session", {}],
    ["get_remaining", {}],
    ["get_summary", { period: "week", asOf: "2026-10-25" }],
    ["get_exercise_history", { name: "Incline DB curl" }],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert(!result.isError, `${name} failed`);
    assert(result.content[0].text);
    console.log(`PASS ${name}`);
  }
  await client.close();
  console.log(
    "PASS live HTTPS, hostname isolation, invalid-token rejection, MCP discovery, and production database reads. No test data inserted.",
  );
} catch (error) {
  // SDK errors can embed the credential-bearing URL. Never print them verbatim.
  console.error(
    "Production check failed:",
    String(error?.message ?? error)
      .replaceAll(config.MCP_PATH_TOKEN, "[REDACTED]")
      .replaceAll(config.DASHBOARD_TOKEN, "[REDACTED]"),
  );
  process.exitCode = 1;
}
