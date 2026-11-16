import { createHash, randomBytes } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";

export const clientId = "https://chatgpt.com/oauth/client.json";
export const callback = "https://chatgpt.com/connector_platform_oauth_redirect";
export const scope = "wardrobe.upload";
export function origin() {
  const value = process.env.WARDROBE_ORIGIN;
  if (!value) throw new Error("Wardrobe origin is missing");
  return new URL(value).origin;
}
export const resource = () => origin() + "/wardrobe/mcp";
export function backend() {
  const token = process.env.WARDROBE_SERVICE_TOKEN;
  if (!token || !process.env.CONVEX_URL)
    throw new Error("Wardrobe backend is missing");
  return { db: new ConvexHttpClient(process.env.CONVEX_URL), token };
}
export const digest = (input: string | Buffer) =>
  createHash("sha256").update(input).digest("base64url");
export const credential = () => randomBytes(32).toString("base64url");
export const oauthJson = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
export function validConsent(p: URLSearchParams) {
  const scopes = (p.get("scope") ?? scope).split(" ");
  return (
    [...p.keys()].every((k) => p.getAll(k).length === 1) &&
    p.get("client_id") === clientId &&
    p.get("redirect_uri") === callback &&
    p.get("resource") === resource() &&
    p.get("response_type") === "code" &&
    p.get("code_challenge_method") === "S256" &&
    /^[A-Za-z0-9_-]{43}$/.test(p.get("code_challenge") ?? "") &&
    scopes.includes(scope) &&
    scopes.every((s) => s === scope || s === "offline_access") &&
    (p.get("state")?.length ?? 0) <= 2048
  );
}
