import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .filter((x) => x.includes("=") && !x.startsWith("#"))
    .map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
);
if (new URL(env.CONVEX_URL).hostname !== "127.0.0.1")
  throw new Error("Visual fixture refuses nonlocal backend");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  recordVideo: {
    dir: ".daso/evidence/fitness/video",
    size: { width: 390, height: 844 },
  },
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://app.localhost:3000");
await page.getByText("A quiet place for your progress.").waitFor();
await page.screenshot({ path: ".daso/evidence/fitness/locked.png" });
await page.goto(`http://app.localhost:3000/#token=${env.DASHBOARD_TOKEN}`);
await page
  .getByRole("heading", { name: "The three numbers", exact: true })
  .waitFor();
await page.evaluate(() => history.replaceState(null, "", "/"));
await page.waitForTimeout(500);
await page.screenshot({
  path: ".daso/evidence/fitness/phone.png",
  fullPage: true,
});
await page.screenshot({ path: ".daso/evidence/fitness/phone-overview.png" });
await page.getByRole("button", { name: "90 days" }).tap();
assert.equal(
  await page
    .getByRole("button", { name: "90 days" })
    .getAttribute("aria-pressed"),
  "true",
);
await page
  .getByRole("navigation", { name: "Fitness sections" })
  .getByRole("link", { name: "Meals" })
  .tap();
await page.waitForTimeout(700);
await page.screenshot({ path: ".daso/evidence/fitness/phone-meals.png" });
await page.goto("http://app.localhost:3000/fitness");
await page
  .getByRole("heading", { name: "The three numbers", exact: true })
  .waitFor(); // remembered token, including home-screen start URL
const db = new ConvexHttpClient(env.CONVEX_URL);
await db.mutation(api.fitness.log, {
  token: env.CONVEX_SERVICE_TOKEN,
  operation: "log_meal",
  input: {
    name: "Live phone check",
    calories: 200,
    protein: 25,
    carbs: 20,
    fat: 4,
    quality: 8,
    requestId: "m4c2-visual-reactive-0001",
  },
});
await page
  .getByRole("cell", { name: "Live phone check", exact: true })
  .waitFor();
for (const width of [320, 390, 430]) {
  await page.setViewportSize({ width, height: 844 });
  await page.waitForTimeout(350);
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `overflow at ${width}`,
  );
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.waitForTimeout(400);
await page.screenshot({
  path: ".daso/evidence/fitness/desktop.png",
  fullPage: true,
});
assert.equal(await page.locator("script[data-website-id]").count(), 0);
assert.equal(
  (await page.request.get("http://app.localhost:3000/blog")).status(),
  404,
);
assert(
  (
    await (
      await page.request.get("http://app.localhost:3000/robots.txt")
    ).text()
  ).includes("Disallow: /"),
);
await page.getByRole("button", { name: "Forget this device" }).click();
await page.getByText("A quiet place for your progress.").waitFor();
assert.deepEqual(errors, []);
const video = page.video();
await context.close();
await video.saveAs(".daso/evidence/fitness/phone-flow.webm");
await video.delete();
const site = await browser.newPage();
await site.goto("http://localhost:3000");
await site.getByText("Writing", { exact: true }).last().waitFor();
await site.goto("http://localhost:3000/blog");
assert.equal(
  (await site.request.get("http://localhost:3000/about")).status(),
  200,
);
assert.equal(
  (await site.request.get("http://localhost:3000/wiki")).status(),
  200,
);
await site.screenshot({ path: ".daso/evidence/fitness/blog-regression.png" });
await browser.close();
console.log(
  "PASS: phone 320/390/430px, charts, meal cards, reactive update, remembered link, forget device, hostname isolation, no tracker analytics, existing homepage/blog/about/wiki.",
);
