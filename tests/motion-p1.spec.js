/* global mood */
import { test, expect } from "./fixtures.js";

// Acceptance tests for the P1 motion items in docs/design/motion-spec.md (Designer, commit 587ed19):
//   1 Set the mood, 2 Send a heartbeat, 3 Cards that travel.
// The fixtures block every CDN, so these also prove the effects work without GSAP and Lenis.

test.describe("1. Set the mood", () => {
  const moodBtn = (page, name) => page.locator(`.mood-btn[data-mood="${name}"]`);
  const state = (page) => page.evaluate(() => ({ speed: mood.speed, link: mood.link, tint: mood.tint, chosen: mood.chosen }));

  test("choosing a mood sets the label, marks one button pressed and stays put (no automatic cycling)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("group", { name: "Set the demo mood" }).locator("button")).toHaveCount(5);
    await expect(page.locator(".meds .pill-sm")).toHaveText("simulated");
    await moodBtn(page, "Excited").click();
    await expect(page.locator("#medsEmotion")).toHaveText("Excited");
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(1);
    await expect(moodBtn(page, "Excited")).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(4000);
    await expect(page.locator("#medsEmotion")).toHaveText("Excited");
    await expect(moodBtn(page, "Excited")).toHaveAttribute("aria-pressed", "true");
  });

  test("pressing the chosen mood again clears it and automatic cycling resumes within 4 s", async ({ page }) => {
    await page.goto("/");
    await moodBtn(page, "Excited").click();
    await moodBtn(page, "Excited").click();
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator("#medsEmotion")).not.toHaveText("Excited", { timeout: 4000 });
  });

  test("the hero network follows the mood: speed, link distance and tint ease to the target, and back", async ({ page }) => {
    await page.goto("/");
    const accent = (name) => page.evaluate((v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(), name);
    const settled = (want) => expect.poll(() => state(page), { timeout: 3000 }).toMatchObject(want); // eases over 800 ms
    await moodBtn(page, "Calm").click();
    await settled({ speed: 0.5, link: 150, tint: await accent("--accent-2") });
    await moodBtn(page, "Excited").click();
    await settled({ speed: 1.9, link: 110, tint: await accent("--accent") });
    await moodBtn(page, "Excited").click();
    await settled({ speed: 1, link: 130, chosen: null });
  });

  test("the buttons work from the keyboard and the hidden face click is gone", async ({ page }) => {
    await page.goto("/");
    await moodBtn(page, "Surprised").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#medsEmotion")).toHaveText("Surprised");
    await page.locator("#medsFace").dispatchEvent("click"); // used to jump to the next state
    await page.waitForTimeout(300);
    await expect(page.locator("#medsEmotion")).toHaveText("Surprised");
  });

  test("with reduced motion the state changes at once, the heart rate is set and the canvas stands still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await moodBtn(page, "Calm").click();
    await expect(page.locator("#medsEmotion")).toHaveText("Calm");
    await expect(page.locator("#medsHr")).toHaveText("66");
    await expect(moodBtn(page, "Calm")).toHaveAttribute("aria-pressed", "true");
    const frame = () => page.evaluate(() => document.querySelector("#net").toDataURL());
    const first = await frame();
    await page.waitForTimeout(500);
    expect(await frame()).toBe(first);
  });

  test("at 320 px the five buttons stay on one row inside the card, 44 px each", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const boxes = await page.locator(".mood-btn").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    const card = await page.locator(".meds").evaluate((e) => e.getBoundingClientRect().toJSON());
    expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
    for (const b of boxes) {
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(b.left).toBeGreaterThanOrEqual(card.left);
      expect(b.right).toBeLessThanOrEqual(card.right);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
