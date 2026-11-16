import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
process.loadEnvFile(".env.local");
if (new URL(process.env.CONVEX_URL).hostname !== "127.0.0.1")
  throw new Error("Browser check refuses nonlocal backend.");
const passwords = JSON.parse(
  readFileSync(".vercel/wardrobe-local.json", "utf8"),
);
const origin = process.env.WARDROBE_ORIGIN;
const evidence = ".daso/evidence/wardrobe";
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  await page.screenshot({ path: `${evidence}/login.png`, fullPage: true });
  assert.equal(
    (await context.request.get(`${origin}/wardrobe/api/items`)).status(),
    401,
  );
  await page.getByLabel("Username", { exact: true }).fill("max");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByText("Incorrect username or password.").waitFor();
  await page.getByLabel("Password", { exact: true }).fill(passwords.max);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.locator(".w-grid").waitFor();
  const catalogue = await (
    await context.request.get(`${origin}/wardrobe/api/items`)
  ).json();
  assert(catalogue.items.length >= 8);
  assert.equal(catalogue.owner, "max");
  assert.equal(await page.locator("script[data-website-id]").count(), 0);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${evidence}/catalogue.png`, fullPage: true });
  await page.getByRole("button", { name: "Filter items", exact: true }).click();
  await page.getByLabel("Color", { exact: true }).selectOption("Black");
  assert.equal(
    await page.locator(".w-card").count(),
    catalogue.items.filter((item) => item.color === "Black").length,
  );
  await page.getByLabel("Category", { exact: true }).selectOption("Shirts");
  assert.equal(
    await page.locator(".w-card").count(),
    catalogue.items.filter(
      (item) => item.color === "Black" && item.category === "Shirts",
    ).length,
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("searchbox").fill("linen");
  assert.equal(await page.locator(".w-card").count(), 1);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.locator(".w-card").click();
  await page.getByRole("heading", { name: "Black linen shirt" }).waitFor();
  const image = page.locator(".w-main-image img");
  await image.waitFor();
  assert.equal(
    (
      await context.request.get(`${origin}${await image.getAttribute("src")}`)
    ).status(),
    200,
  );
  await page.getByRole("button", { name: "Side", exact: true }).click();
  assert(
    (await page.locator(".w-main-image img").getAttribute("src")).endsWith(
      "/side",
    ),
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.screenshot({ path: `${evidence}/detail.png`, fullPage: true });
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.getByLabel("Material optional").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Changes saved.").waitFor();
  await page.reload();
  await page.getByText("Not specified", { exact: true }).waitFor();
  // Restore the fixture's material and confirm edits persist on the backend.
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.getByLabel("Material optional").fill("Linen");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Changes saved.").waitFor();
  const id = catalogue.items.find(
    (item) => item.name === "Black linen shirt",
  )._id;
  assert.equal(
    (
      await context.request.post(`${origin}/wardrobe/api/update`, {
        headers: { origin: "https://wrong.example" },
        data: { id, fields: {}, expectedUpdatedAt: 0 },
      })
    ).status(),
    403,
  );
  await page.getByRole("link", { name: "My wardrobe" }).click();
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  assert.equal(
    (
      await context.request.get(`${origin}/wardrobe/api/image/${id}/front`)
    ).status(),
    401,
  );
  await page.getByLabel("Username", { exact: true }).fill("zhanel");
  await page.getByLabel("Password", { exact: true }).fill(passwords.zhanel);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.locator(".w-grid").waitFor();
  assert.equal(
    (await (await context.request.get(`${origin}/wardrobe/api/items`)).json())
      .owner,
    "zhanel",
  );
  assert.equal(
    (
      await context.request.get(`${origin}/wardrobe/api/image/${id}/front`)
    ).status(),
    404,
  );
  assert.equal(
    (
      await context.request.post(`${origin}/wardrobe/api/update`, {
        headers: { origin },
        data: {
          id,
          fields: {
            name: "Attempted change",
            category: "Shirts",
            color: "Black",
            material: "",
          },
          expectedUpdatedAt: 0,
        },
      })
    ).status(),
    404,
  );
  await page.screenshot({ path: `${evidence}/zhanel.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: `${evidence}/desktop.png`, fullPage: true });
  assert.equal(
    (await context.request.get(`${origin}/fitness/api/data`)).status(),
    404,
  );
  assert.equal((await context.request.get(`${origin}/blog`)).status(), 404);
  assert.equal(
    (await context.request.get("http://localhost:3000")).status(),
    200,
  );
  // Click through consent in the browser so its actual Origin policy is exercised.
  const callback = "https://chatgpt.com/connector_platform_oauth_redirect";
  const consentParams = new URLSearchParams({
    client_id: "https://chatgpt.com/oauth/client.json",
    redirect_uri: callback,
    resource: origin + "/wardrobe/mcp",
    response_type: "code",
    scope: "wardrobe.upload",
    state: randomBytes(16).toString("hex"),
    code_challenge_method: "S256",
    code_challenge: randomBytes(32).toString("base64url"),
  });
  await page.route(callback + "?*", (route) =>
    route.fulfill({ status: 200, body: "Callback reached" }),
  );
  for (const allow of [false, true]) {
    await page.goto(origin + "/#connect?" + consentParams);
    await page
      .getByRole("button", {
        name: allow ? "Connect Zhanel’s closet" : "Cancel",
        exact: true,
      })
      .click();
    await page.waitForURL(callback + "?*");
    const result = new URL(page.url()).searchParams;
    assert.equal(result.get("state"), consentParams.get("state"));
    assert.equal(result.get("iss"), origin);
    if (allow) assert.ok(result.get("code"));
    else assert.equal(result.get("error"), "access_denied");
  }
  assert.deepEqual(errors, []);
  console.log(
    "Phone layouts, both logins, filtering, views, persistent edits, CSRF, anonymous denial and cross-account access checks passed.",
  );
} finally {
  await browser.close();
}
