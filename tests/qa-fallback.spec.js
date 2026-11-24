import { test, expect } from "./fixtures.js";

// Cases that need no internet (the shared fixture blocks every third-party request), so they run in CI.
// The real-CDN animation cases are in qa-motion.spec.js and are opt-in (PW_REAL_CDN=1).
// Tests tagged B-0x are EXPECTED FAILURES (test.fail): they pass while the bug exists and go red when it is fixed.

test.describe("All three animation libraries blocked", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("the wheel scrolls the page and nothing throws", async ({ page, pageErrors }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 3000 }).toBeGreaterThan(400);
    expect(pageErrors).toEqual([]);
  });

  test("headings and folders are visible without any animation library", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.querySelector("#folders").scrollIntoView({ block: "center" }));
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll(".folder")].every((f) => Number(getComputedStyle(f).opacity) === 1)), { timeout: 6000 }).toBe(true);
    await expect(page.locator("#projects h2").first()).toBeVisible();
  });
});

// BUG B-04: the guestbook only opens a mail draft when no Formspree ID is set, yet it shows "Thank you!"
test.describe("Guestbook form", () => {
  test("does not claim the review was sent when it only opened an email draft", async ({ page }) => {
    test.fail(true, "B-04: success message shown although only a mailto: draft opened (js/script.js, FORMSPREE_ID is empty)");
    await page.goto("/");
    await page.locator("#rvForm label[for=r5]").click();
    await page.locator("#rvForm [name=name]").fill("QA Tester");
    await page.locator("#rvForm [name=comment]").fill("Automated check, please ignore.");
    await page.locator("#rvForm [type=submit]").click();
    await expect(page.locator("#rvMsg")).not.toHaveText(/thank you/i);
  });
});
