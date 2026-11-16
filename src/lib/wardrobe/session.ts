import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { owners, type WardrobeOwner } from "../../../shared/wardrobe";

export const sessionCookie = "__Host-wardrobe";
export const sessionSeconds = 30 * 24 * 60 * 60;
function secret() {
  const value = process.env.WARDROBE_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error("Wardrobe sessions are not configured");
  return value;
}
export function passwordMatches(owner: WardrobeOwner, password: string) {
  const stored =
    process.env[`WARDROBE_${owner.toUpperCase()}_PASSWORD_HASH`] ?? "";
  const [salt, hash] = stored.split(":");
  if (!salt || !/^[a-f0-9]{128}$/.test(hash ?? "") || password.length > 256)
    return false;
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(hash, "hex"),
  );
}
export function createSession(owner: WardrobeOwner, now = Date.now()) {
  const payload = `${owner}.${Math.floor(now / 1000) + sessionSeconds}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
}
export function sessionOwner(
  value: string | undefined,
  now = Date.now(),
): WardrobeOwner | null {
  if (!value) return null;
  const [owner, expiry, nonce, signature, extra] = value.split(".");
  if (
    extra ||
    !owners.includes(owner as WardrobeOwner) ||
    !/^\d+$/.test(expiry) ||
    !/^[a-f0-9]{32}$/.test(nonce ?? "") ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  )
    return null;
  const end = Number(expiry),
    current = Math.floor(now / 1000);
  if (end <= current || end > current + sessionSeconds) return null;
  try {
    const expected = createHmac("sha256", secret())
      .update(`${owner}.${expiry}.${nonce}`)
      .digest();
    return timingSafeEqual(Buffer.from(signature, "hex"), expected)
      ? (owner as WardrobeOwner)
      : null;
  } catch {
    return null;
  }
}
export function loginClient(ip: string) {
  return createHmac("sha256", secret()).update(ip).digest("hex");
}
