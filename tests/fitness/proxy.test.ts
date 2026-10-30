import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";
afterEach(() => vi.unstubAllEnvs());
function request(host: string, path: string) {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}
it("rewrites only the configured app root and preserves public site", () => {
  vi.stubEnv("FITNESS_APP_HOST", "app.maxforsey.com");
  const app = proxy(request("app.maxforsey.com", "/"));
  expect(app.headers.get("x-middleware-rewrite")).toBe(
    "https://app.maxforsey.com/fitness",
  );
  expect(app.headers.get("referrer-policy")).toBe("no-referrer");
  expect(
    proxy(request("maxforsey.com", "/")).headers.get("x-middleware-rewrite"),
  ).toBeNull();
});
it("isolates persistent dashboard tokens from the blog origin and analytics", () => {
  vi.stubEnv("FITNESS_APP_HOST", "app.maxforsey.com");
  expect(proxy(request("app.maxforsey.com", "/blog")).status).toBe(404);
  expect(proxy(request("app.maxforsey.com", "/api/subscribe")).status).toBe(
    404,
  );
  expect(
    proxy(request("maxforsey.com", "/fitness")).headers.get("location"),
  ).toBe("https://app.maxforsey.com/fitness");
  expect(proxy(request("app.maxforsey.com", "/icon-192.png")).status).toBe(200);
});
it("disallows indexing and fails closed without hostname config", async () => {
  vi.stubEnv("FITNESS_APP_HOST", "app.maxforsey.com");
  expect(
    await proxy(request("app.maxforsey.com", "/robots.txt")).text(),
  ).toContain("Disallow: /");
  vi.stubEnv("FITNESS_APP_HOST", "");
  expect(proxy(request("maxforsey.com", "/fitness")).status).toBe(503);
  expect(proxy(request("maxforsey.com", "/blog")).status).toBe(200);
});
it("uses Supermedium icons on the app host and preserves the site's icons", () => {
  vi.stubEnv("FITNESS_APP_HOST", "app.maxforsey.com");
  expect(proxy(request("app.maxforsey.com", "/apple-touch-icon.png")).headers.get("x-middleware-rewrite"))
    .toBe("https://app.maxforsey.com/supermedium-icons/apple-touch-icon.png");
  expect(proxy(request("maxforsey.com", "/apple-touch-icon.png")).headers.get("x-middleware-rewrite"))
    .toBeNull();
  expect(proxy(request("app.maxforsey.com", "/supermedium-icons/icon-512.png")).status).toBe(200);
});
