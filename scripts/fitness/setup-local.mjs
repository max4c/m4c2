import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
let content = readFileSync(".env.local", "utf8");
const url = content.match(/^NEXT_PUBLIC_CONVEX_URL=(.+)$/m)?.[1];
if (!url || new URL(url).hostname !== "127.0.0.1")
  throw new Error("Start an anonymous local Convex deployment first.");
const token = () => randomBytes(32).toString("hex");
const values = {
  CONVEX_URL: url,
  CONVEX_SERVICE_TOKEN: token(),
  MCP_PATH_TOKEN: token(),
  DASHBOARD_TOKEN: token(),
  DASHBOARD_ORIGIN: "http://localhost:3000",
  FITNESS_APP_HOST: "app.localhost",
  NEXT_PUBLIC_FITNESS_TEST_DATA: "true",
};
for (const [key, value] of Object.entries(values)) {
  content = content.replace(new RegExp(`^${key}=.*\\n?`, "gm"), "");
  content += `\n${key}=${value}\n`;
}
writeFileSync(".env.local", content, { mode: 0o600 });
for (const key of ["CONVEX_SERVICE_TOKEN", "DASHBOARD_TOKEN"])
  execFileSync("npx", ["convex", "env", "set", key, values[key]], {
    stdio: "pipe",
  });
execFileSync(
  "npx",
  [
    "convex",
    "run",
    "fitness:seed",
    JSON.stringify({ token: values.CONVEX_SERVICE_TOKEN }),
  ],
  { stdio: "pipe" },
);
console.log(
  "Local fitness secrets configured and plan seeded. Tokens were not printed.",
);
