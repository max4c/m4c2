import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter(x => x.includes("=")).map(x => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]));
assert.equal(new URL(env.CONVEX_URL).hostname, "127.0.0.1", "Test writes must stay local");
const client = new Client({ name: "delete-local-check", version: "1" });
async function call(name, args) {
  const result = await client.callTool({ name, arguments: args });
  assert(!result.isError, `${name} failed`);
  return JSON.parse(result.content[0].text);
}
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://app.localhost:3000/mcp/${env.MCP_PATH_TOKEN}`)));
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 16);
  assert.equal(tools.tools.find(t => t.name === "delete_entry").annotations.destructiveHint, true);
  const entry = await call("log_weight", { date: "2026-10-28", lbs: 170 });
  try {
    const rows = await call("query_entries", { table: "weights", start: "2026-10-28", end: "2026-10-28" });
    assert(rows.page.some(row => row._id === entry.id));
    assert.equal((await call("delete_entry", { table: "weights", id: entry.id })).deleted, true);
    const after = await call("query_entries", { table: "weights", start: "2026-10-28", end: "2026-10-28" });
    assert(!after.page.some(row => row._id === entry.id));
    console.log("PASS MCP discovery, log result ID, query confirmation, delete_entry, and row removal (local only)");
  } finally {
    await call("delete_entry", { table: "weights", id: entry.id });
  }
} catch {
  console.error("Local MCP deletion check failed; credentials omitted.");
  process.exitCode = 1;
} finally {
  await client.close();
}
