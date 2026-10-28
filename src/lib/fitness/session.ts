import {
  createHmac,
  timingSafeEqual,
  scryptSync,
  randomBytes,
} from "node:crypto";
export const sessionCookie = "__Host-supermedium";
export const sessionSeconds = 30 * 24 * 60 * 60;
function key() {
  const value = process.env.SUPERMEDIUM_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error("Session configuration missing");
  return value;
}
export function passwordMatches(password: string) {
  const stored = process.env.SUPERMEDIUM_PASSWORD_HASH ?? "";
  const [salt, hash] = stored.split(":");
  if (!salt || !/^[a-f0-9]{128}$/.test(hash ?? "") || password.length > 256)
    return false;
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(hash, "hex"),
  );
}
export function createSession(now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + sessionSeconds}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${createHmac("sha256", key()).update(payload).digest("hex")}`;
}
export function validSession(value: string | undefined, now = Date.now()) {
  if (!value) return false;
  const [expiry, nonce, signature, extra] = value.split(".");
  if (
    extra ||
    !/^\d+$/.test(expiry) ||
    !/^[a-f0-9]{32}$/.test(nonce ?? "") ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  )
    return false;
  const end = Number(expiry),
    current = Math.floor(now / 1000);
  if (end <= current || end > current + sessionSeconds) return false;
  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      createHmac("sha256", key()).update(`${expiry}.${nonce}`).digest(),
    );
  } catch {
    return false;
  }
}
