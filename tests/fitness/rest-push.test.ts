import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { pushSubscription } from "../../shared/push";
const modules = import.meta.glob("../../convex/**/*.ts");
const token = "push-test".padEnd(64, "x"),
  deviceId = "d8eb836f-5dbe-4c4a-b570-d6b7bd566543",
  version = "b91b2b92-3049-43bb-870e-e157a084a85b";
const subscription = {
  endpoint: "https://web.push.apple.com/test",
  keys: { p256dh: "a".repeat(87), auth: "b".repeat(22) },
};
beforeEach(() => {
  vi.stubEnv("CONVEX_SERVICE_TOKEN", token);
  vi.stubEnv("VAPID_PUBLIC_KEY", "test");
  vi.stubEnv("VAPID_PRIVATE_KEY", "test");
});
afterEach(() => vi.unstubAllEnvs());
it("limits push endpoints to HTTPS providers with no credentials or arbitrary ports", () => {
  for (const endpoint of [
    "http://web.push.apple.com/test",
    "https://evil.com/test",
    "https://web.push.apple.com.evil.com/test",
    "https://localhost/test",
    "https://web.push.apple.com:8080/test",
    "https://user@web.push.apple.com/test",
  ])
    expect(
      pushSubscription.safeParse({ ...subscription, endpoint }).success,
    ).toBe(false);
  expect(pushSubscription.safeParse(subscription).success).toBe(true);
});
it("rescheduling cancels the pending job, cancel clears it, stale expiration keeps replacement subscription", async () => {
  const t = convexTest(schema, modules),
    call = (input: unknown) => t.mutation(api.rest.configure, { token, input });
  await call({ action: "subscribe", deviceId, subscription });
  await call({
    action: "start",
    deviceId,
    version,
    endsAt: Date.now() + 60_000,
  });
  const original = (await t.run((ctx) =>
    ctx.db.query("restDevices").unique(),
  ))!;
  await call({
    action: "start",
    deviceId,
    version: "a91b2b92-3049-43bb-870e-e157a084a85b",
    endsAt: Date.now() + 90_000,
  });
  const job = await t.run((ctx) => ctx.db.system.get(original.scheduledId!));
  expect(job?.state.kind).toBe("canceled");
  await call({ action: "cancel", deviceId });
  expect(
    (await t.run((ctx) => ctx.db.get(original._id)))?.endsAt,
  ).toBeUndefined();
  await call({
    action: "start",
    deviceId,
    version,
    endsAt: Date.now() + 60_000,
  });
  await call({
    action: "subscribe",
    deviceId,
    subscription: {
      ...subscription,
      endpoint: "https://web.push.apple.com/replaced",
    },
  });
  await t.mutation(internal.rest.expire, {
    id: original._id,
    version,
    endpoint: subscription.endpoint,
  });
  expect(await t.run((ctx) => ctx.db.get(original._id))).not.toBeNull();
  await call({ action: "cancel", deviceId });
  await expect(
    t.mutation(api.rest.configure, {
      token: "wrong",
      input: { action: "cancel", deviceId },
    }),
  ).rejects.toThrow();
});
it("service worker suppresses queued old versions and only displays the current timer", async () => {
  const handlers: Record<string, (e: unknown) => void> = {},
    shown: unknown[] = [];
  const context = vm.createContext({
    self: {
      addEventListener: (name: string, fn: (e: unknown) => void) =>
        (handlers[name] = fn),
      registration: {
        showNotification: async (...args: unknown[]) => {
          shown.push(args);
        },
      },
    },
    Date,
    Number,
  });
  vm.runInContext(readFileSync("public/fitness-sw.js", "utf8"), context);
  vm.runInContext('state = async () => "active-version";', context);
  const push = async (version: string) => {
    let work = Promise.resolve();
    handlers.push({
      data: { json: () => ({ version, endsAt: Date.now() }) },
      waitUntil: (p: Promise<void>) => {
        work = p;
      },
    });
    await work;
  };
  await push("old-version");
  expect(shown).toHaveLength(0);
  await push("active-version");
  expect(shown).toHaveLength(1);
  vm.runInContext("state = async () => null;", context);
  await push("active-version");
  expect(shown).toHaveLength(1);
});
