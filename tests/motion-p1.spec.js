/* global mood, __seen */
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

test.describe("2. Send a heartbeat", () => {
  const STOPS = ["ESP32 + MAX30102", "Flutter app", "On-device TFLite", "Flutter app", "Supabase", "Edge Functions", "Claude API"];
  const beat = (page) => page.locator("#sendBeat");
  const dots = (page) => page.locator(".beat-dot");
  const start = async (page) => {
    await page.goto("/");
    await beat(page).scrollIntoViewIfNeeded();
    await beat(page).click();
    await expect(dots(page)).toHaveCount(1);
  };

  test("a run visits the seven stops in order, takes about 13 s, ends on Claude and leaves no dot", async ({ page }) => {
    test.setTimeout(40000);
    await page.goto("/");
    await page.evaluate(() => {
      window.__seen = [];
      new MutationObserver(() => { const t = document.querySelector("#beatStatus").textContent; if (t) __seen.push(t.replace("Reading reached: ", "")); })
        .observe(document.querySelector("#beatStatus"), { childList: true, characterData: true, subtree: true });
    });
    await beat(page).scrollIntoViewIfNeeded();
    const t0 = Date.now();
    await beat(page).click();
    await expect(dots(page)).toHaveCount(1);
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "off"); // seven long texts must not queue up
    await expect(beat(page)).toHaveText("↻ Send again", { timeout: 25000 });
    const seconds = (Date.now() - t0) / 1000;
    expect(seconds).toBeGreaterThan(10);
    expect(seconds).toBeLessThan(18);
    expect(await page.evaluate(() => __seen)).toEqual(STOPS);
    await expect(page.locator("#arch .node.on")).toHaveAttribute("data-k", "claude");
    await expect(dots(page)).toHaveCount(0);
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("#archInfo")).toContainText("Claude writes plain-language session summaries");
  });

  test("the dot stays in #arch, never takes pointer events and the button is not a node", async ({ page }) => {
    await start(page);
    expect(await dots(page).evaluate((d) => ({ pe: getComputedStyle(d).pointerEvents, inside: !!d.closest("#arch"), hidden: d.getAttribute("aria-hidden") }))).toEqual({ pe: "none", inside: true, hidden: "true" });
    expect(await beat(page).evaluate((b) => b.closest("#arch") || b.matches(".node"))).toBeFalsy();
    await beat(page).click(); // skip the pause: moves on, still one dot
    await expect(dots(page)).toHaveCount(1);
  });

  test("hovering a part mid-run stops it and that part's text stays", async ({ page }) => {
    await start(page);
    await page.locator('#arch .node[data-k="edge"]').hover();
    await expect(dots(page)).toHaveCount(0);
    await expect(beat(page)).toHaveText("▶ Send a heartbeat");
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("#archInfo")).toContainText("TypeScript Edge Functions");
    await page.waitForTimeout(3000);
    await expect(page.locator("#archInfo")).toContainText("TypeScript Edge Functions");
    await expect(dots(page)).toHaveCount(0);
  });

  test("focusing a part, pressing Escape or scrolling away also stops it", async ({ page }) => {
    await start(page);
    await page.locator('#arch .node[data-k="ml"]').focus();
    await expect(dots(page)).toHaveCount(0);

    await beat(page).click();
    await expect(dots(page)).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(dots(page)).toHaveCount(0);
    await expect(beat(page)).toBeEnabled();

    await beat(page).click();
    await expect(dots(page)).toHaveCount(1);
    await page.evaluate(() => scrollTo(0, 0)); // the architecture leaves the screen
    await expect(dots(page)).toHaveCount(0);
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
  });

  test("hiding the tab mid-run leaves no dot and an enabled button", async ({ page }) => {
    await start(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(dots(page)).toHaveCount(0);
    await expect(beat(page)).toBeEnabled();
    await expect(beat(page)).toHaveText("▶ Send a heartbeat");
  });

  test("two fast presses never run two dots, and it works from the keyboard with focus kept", async ({ page }) => {
    await page.goto("/");
    await beat(page).scrollIntoViewIfNeeded();
    await beat(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(dots(page)).toHaveCount(1);
    await page.waitForTimeout(700);
    expect(await dots(page).count()).toBe(1);
    await expect(beat(page)).toBeFocused();
  });

  test("with reduced motion each press moves exactly one stop: no dot, no timer", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await beat(page).scrollIntoViewIfNeeded();
    const keys = ["sensor", "app", "ml", "app", "supa", "edge", "claude"];
    for (const [i, k] of keys.entries()) {
      await beat(page).click();
      await expect(page.locator("#arch .node.on")).toHaveAttribute("data-k", k);
      await expect(dots(page)).toHaveCount(0);
      await expect(beat(page)).toHaveText(i < keys.length - 1 ? "Next part →" : "↻ Send again");
    }
    await page.waitForTimeout(1700); // nothing advances on its own
    await expect(page.locator("#arch .node.on")).toHaveAttribute("data-k", "claude");
    await beat(page).click(); // "Send again" starts over
    await expect(page.locator("#arch .node.on")).toHaveAttribute("data-k", "sensor");
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
  });
});
