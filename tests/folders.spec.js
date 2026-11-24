import { test, expect } from "./fixtures.js";

// Proof folders and the [hidden] attribute (QA bugs B-05, B-06, B-08, B-09; QA's own versions are in tests/qa-folders.spec.js on test/cross-device).
// These set their own viewport, so one project is enough.
test.describe.configure({ mode: "parallel" });
test.skip(({ isMobile }) => isMobile, "sets its own viewport sizes");

const folder = (page, i) => page.locator(".folder").nth(i);
const files = (page) => page.locator("#foldBody");

async function ready(page, w, h = 900) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto("/");
  await page.evaluate(() => document.querySelector("#folders").scrollIntoView({ block: "center" }));
  await expect(page.locator("#folders")).toHaveClass(/\bin\b/); // .reveal keeps the folders 24px low until then
}
test.describe("B-06 / B-08 the hidden attribute", () => {
  for (const [name, w, h] of [["phone", 390, 844], ["desktop", 1280, 800]]) {
    test(`a closed folder shows no files (${name})`, async ({ page }) => {
      await ready(page, w, h);
      await expect(files(page)).toBeHidden(); // before any folder is opened
      await folder(page, 0).click();
      await expect(files(page)).toBeVisible();
      await folder(page, 0).click();
      await expect(files(page)).toBeHidden();
      expect(await files(page).evaluate((p) => p.getBoundingClientRect().height)).toBe(0);
    });

    test(`nothing with [hidden] is still displayed (${name})`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.waitForTimeout(800); // the visit counter (blocked here) and reviews.json have settled
      const leaks = await page.evaluate(() => [...document.querySelectorAll("[hidden]")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.id || e.className));
      expect(leaks).toEqual([]);
    });
  }

  test("the visits tile disappears when the counter cannot be reached", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".rv-stat").filter({ has: page.locator("#visits") })).toBeHidden();
  });

  test("print still shows every project whatever filter is on, and the lesson button keeps working on a phone", async ({ page }) => {
    await ready(page, 390);
    await page.locator('.proj-head [data-filter="web"]').click();
    await page.emulateMedia({ media: "print" });
    expect(await page.locator(".p-card").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").length)).toBe(9);
    await page.emulateMedia({ media: "screen" });
    await expect(page.locator(".more-lessons")).toBeVisible(); // shown on phones while lessons are folded, kept by :not([hidden])
  });
});

