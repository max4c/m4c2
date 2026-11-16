import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { execFileSync } from "node:child_process";
let content = readFileSync(".env.local", "utf8");
const url = content.match(/^NEXT_PUBLIC_CONVEX_URL=(.+)$/m)?.[1];
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error("Start anonymous local Convex first.");
const credentialsPath = ".vercel/wardrobe-local.json";
const credentials = existsSync(credentialsPath)
  ? JSON.parse(readFileSync(credentialsPath, "utf8"))
  : {
      max: randomBytes(12).toString("base64url"),
      zhanel: randomBytes(12).toString("base64url"),
    };
const existing = (key) => content.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1];
const values = {
  CONVEX_URL: url,
  WARDROBE_APP_HOST: "app2.localhost",
  WARDROBE_ORIGIN: "http://app2.localhost:3000",
  WARDROBE_SERVICE_TOKEN:
    existing("WARDROBE_SERVICE_TOKEN") || randomBytes(32).toString("hex"),
  WARDROBE_SESSION_SECRET:
    existing("WARDROBE_SESSION_SECRET") || randomBytes(32).toString("hex"),
};
for (const owner of ["max", "zhanel"]) {
  const salt = randomBytes(16).toString("hex");
  values[`WARDROBE_${owner.toUpperCase()}_PASSWORD_HASH`] =
    `${salt}:${scryptSync(credentials[owner], salt, 64).toString("hex")}`;
}
for (const [key, value] of Object.entries(values)) {
  content = content.replace(new RegExp(`^${key}=.*(?:\r?\n|$)`, "gm"), "");
  content += `\n${key}=${value}\n`;
}
mkdirSync(".vercel", { recursive: true });
writeFileSync(".env.local", content, { mode: 0o600 });
writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), {
  mode: 0o600,
});
execFileSync(
  "npx",
  [
    "convex",
    "env",
    "set",
    "WARDROBE_SERVICE_TOKEN",
    values.WARDROBE_SERVICE_TOKEN,
  ],
  { stdio: "pipe" },
);
console.log(
  "Local wardrobe configured at http://app2.localhost:3000. Two local passwords saved in ignored .vercel/wardrobe-local.json.",
);
