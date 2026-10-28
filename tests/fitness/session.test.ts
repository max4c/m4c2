import { beforeEach, expect, it, vi } from "vitest";
import { scryptSync } from "node:crypto";
import {
  createSession,
  validSession,
  passwordMatches,
  sessionSeconds,
} from "../../src/lib/fitness/session";
beforeEach(() => {
  vi.stubEnv("SUPERMEDIUM_SESSION_SECRET", "a".repeat(64));
  vi.stubEnv(
    "SUPERMEDIUM_PASSWORD_HASH",
    "salt:" + scryptSync("a-long-test-password", "salt", 64).toString("hex"),
  );
});
it("validates passwords and fails closed without a hash", () => {
  expect(passwordMatches("a-long-test-password")).toBe(true);
  expect(passwordMatches("wrong")).toBe(false);
  vi.stubEnv("SUPERMEDIUM_PASSWORD_HASH", "");
  expect(passwordMatches("")).toBe(false);
});
it("rejects forged, expired and rotated sessions", () => {
  const now = Date.now();
  const session = createSession(now);
  expect(validSession(session, now)).toBe(true);
  expect(validSession(session + "bad", now)).toBe(false);
  expect(validSession(session, now + (sessionSeconds + 1) * 1000)).toBe(false);
  expect(validSession(undefined)).toBe(false);
  vi.stubEnv("SUPERMEDIUM_SESSION_SECRET", "b".repeat(64));
  expect(validSession(session, now)).toBe(false);
});
