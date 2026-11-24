/* global mood, __seen, openProject */
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

test.describe("3. Cards that travel", () => {
  const chip = (page, f) => page.locator(`.proj-head [data-filter="${f}"]`);
  const shownNow = (page) => page.locator(".p-card:not([hidden])").count();
  const expected = (page, f) => page.evaluate((x) => [...document.querySelectorAll(".p-card")].filter((c) => x === "all" || c.dataset.cats.includes(x)).length, f);

  test("each filter shows exactly the cards whose categories contain it, and the status says how many", async ({ page }) => {
    await page.goto("/");
    expect(await shownNow(page)).toBe(9);
    for (const f of ["ai", "web", "mobile", "design", "all"]) {
      await chip(page, f).click();
      const n = await expected(page, f);
      expect(n).toBeGreaterThan(0);
      expect(await shownNow(page)).toBe(n);
      await expect(page.locator("#projStatus")).toHaveText(`${n} project${n === 1 ? "" : "s"} shown`);
      await expect(chip(page, f)).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('.proj-head .chip[aria-pressed="true"]')).toHaveCount(1);
    }
    expect(await shownNow(page)).toBe(9);
  });

  test("four chips pressed within 500 ms end on the last filter and leave nothing running after 1 s", async ({ page }) => {
    await page.goto("/");
    await page.locator("#projectList").scrollIntoViewIfNeeded();
    await page.evaluate(() => ["ai", "web", "mobile", "design"].forEach((f) => document.querySelector(`.proj-head [data-filter="${f}"]`).click()));
    await page.waitForTimeout(1000);
    await expect(chip(page, "design")).toHaveAttribute("aria-pressed", "true");
    expect(await shownNow(page)).toBe(await expected(page, "design"));
    const leftovers = await page.evaluate(() => [...document.querySelectorAll(".p-card")].filter((c) => c.getAnimations().length || c.style.transform).length);
    expect(leftovers).toBe(0);
  });

  test("staying cards glide (420 ms, never more than 120 px away) and entering cards fade in", async ({ page }) => {
    await page.goto("/");
    await page.locator("#projectList").scrollIntoViewIfNeeded();
    const seen = await page.evaluate(() => {
      const out = { glide: 0, enter: 0, far: 0, timings: new Set() };
      for (const f of ["design", "all", "web", "all", "mobile", "ai"]) {
        document.querySelector(`.proj-head [data-filter="${f}"]`).click();
        for (const c of document.querySelectorAll(".p-card")) for (const a of c.getAnimations()) {
          if (a instanceof CSSTransition || a instanceof CSSAnimation) continue; // the page's own reveal and hover transitions
          const k = a.effect.getKeyframes(), t = a.effect.getTiming();
          out.timings.add(`${t.duration}`);
          if (k[0].opacity !== undefined && k[0].opacity !== "1") out.enter++;
          else {
            out.glide++;
            const [x, y] = (k[0].transform.match(/-?[\d.]+/g) || []).map(Number);
            if (Math.abs(x) > 120.01 || Math.abs(y) > 120.01) out.far++;
          }
        }
      }
      return { ...out, timings: [...out.timings] };
    });
    expect(seen.glide).toBeGreaterThan(0);
    expect(seen.enter).toBeGreaterThan(0);
    expect(seen.far).toBe(0);
    expect(seen.timings.sort()).toEqual(["260", "420"]);
  });

  test("with reduced motion the filter is instant, nothing animates and the status is still announced", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const animations = await page.evaluate(() => {
      document.querySelector('.proj-head [data-filter="web"]').click();
      return [...document.querySelectorAll(".p-card")].reduce((n, c) => n + c.getAnimations().length, 0);
    });
    expect(animations).toBe(0);
    expect(await shownNow(page)).toBe(await expected(page, "web"));
    await expect(page.locator("#projStatus")).toContainText("shown");
  });

  test("sorting two reviews leaves all 9 projects visible", async ({ page }) => {
    const review = (n) => ({ name: `Visitor ${n}`, comment: "Nice portfolio, thank you.", rating: n, date: `2026-0${n}-01` });
    await page.route("**/reviews.json", (route) => route.fulfill({ json: [review(1), review(2)] }));
    await page.goto("/");
    for (const s of ["top", "new"]) await page.locator(`.rv-sort [data-sort="${s}"]`).click();
    expect(await shownNow(page)).toBe(9);
  });

  test("Details grows out of the pressed card, and focus returns to that button after Escape", async ({ page }) => {
    await page.goto("/");
    const details = page.locator(".p-more").nth(2);
    await details.scrollIntoViewIfNeeded();
    await details.click();
    const from = await page.evaluate(() => {
      const m = document.querySelector("#projectModal");
      return { open: m.open, origin: m.style.transformOrigin, grows: m.getAnimations().some((a) => a.effect.getKeyframes()[0].transform === "scale(0.94)") };
    });
    expect(from.open).toBe(true);
    expect(from.origin).toMatch(/px/);
    expect(from.grows).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.locator("#projectModal")).not.toHaveAttribute("open", "");
    await expect(details).toBeFocused();
  });

  test("a project opened any other way keeps the normal entrance", async ({ page }) => {
    await page.goto("/");
    const grows = await page.evaluate(() => {
      openProject("meds");
      const m = document.querySelector("#projectModal");
      return { open: m.open, origin: m.style.transformOrigin, animation: m.style.animation, grows: m.getAnimations().some((a) => a.effect.getKeyframes()[0].transform === "scale(0.94)") };
    });
    expect(grows).toEqual({ open: true, origin: "", animation: "", grows: false });
  });

  test("printing shows every project whatever filter is active", async ({ page }) => {
    await page.goto("/");
    await chip(page, "web").click();
    await page.emulateMedia({ media: "print" });
    const visible = await page.locator(".p-card").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").length);
    expect(visible).toBe(9);
  });

  test("at 320 px the page never scrolls sideways while cards move", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await page.locator("#projectList").scrollIntoViewIfNeeded();
    const widest = await page.evaluate(() => {
      let w = 0;
      for (const f of ["design", "all", "web", "all"]) {
        document.querySelector(`.proj-head [data-filter="${f}"]`).click();
        w = Math.max(w, document.documentElement.scrollWidth);
      }
      return w;
    });
    expect(widest).toBeLessThanOrEqual(320);
  });
});

test.describe("An older cached index.html with the new script", () => {
  // GitHub Pages ignores ?v=, so a visitor can get a cached index.html from before these items together with the new js/script.js.
  const STRIP = [/<div class="mood"[\s\S]*?<\/div>\s*/, /<p class="beat-row">[\s\S]*?<\/p>\s*/, /<p class="sr" id="beatStatus"[^>]*><\/p>\s*/, /<p class="sr" id="projStatus"[^>]*><\/p>\s*/];

  test("without the new elements nothing throws and the old features still work", async ({ page, pageErrors }) => {
    await page.route((url) => url.pathname === "/", async (route) => {
      const response = await route.fetch();
      let body = await response.text();
      for (const re of STRIP) {
        expect(re.test(body), `${re} is in the page`).toBe(true);
        body = body.replace(re, "");
      }
      await route.fulfill({ response, body });
    });
    await page.goto("/");
    await expect(page.locator(".mood-btn, #sendBeat, #beatStatus, #projStatus")).toHaveCount(0);
    await page.locator("#projectList").scrollIntoViewIfNeeded();
    await page.locator('.proj-head [data-filter="web"]').click(); // used to need #projStatus
    await expect.poll(() => page.locator(".p-card:not([hidden])").count()).toBeLessThan(9);
    await page.locator('#arch .node[data-k="edge"]').hover(); // the explorer itself still works
    await expect(page.locator("#archInfo")).toContainText("TypeScript Edge Functions");
    await page.locator("#net").evaluate((c) => c.toDataURL()); // the hero canvas is alive
    expect(pageErrors).toEqual([]);
  });
});

test.describe("Designer review of items 1 and 2 (spec fad4d98)", () => {
  for (const w of [320, 430, 760, 1280]) {
    test(`the hero fade targets only the hero text, never the MEDS card (${w}px)`, async ({ page }) => {
      // The fixtures block GSAP, so this uses a stand-in that records what js/motion.js asks it to fade. It proves the target, not the
      // opacity itself: with the real GSAP the Designer measured the card at 0.80 (430px) and 0.64 (320px) before this change.
      await page.addInitScript(() => {
        const noop = () => {};
        window.gsap = { registerPlugin: noop, from: noop, fromTo: noop, ticker: { add: noop, lagSmoothing: noop }, to: (target) => { window.__fade = target; } };
        window.ScrollTrigger = { update: noop };
      });
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto("/");
      expect(await page.evaluate(() => ({ asked: !!window.__fade, copy: window.__fade?.classList.contains("hero-copy"), holdsCard: window.__fade?.contains(document.querySelector(".meds")) })))
        .toEqual({ asked: true, copy: true, holdsCard: false });
    });
  }

  test("at 320px the card keeps one height for all five moods", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/");
    // the blocked web font is narrower than the real one; a slightly larger label makes "Surprised" wrap while "Calm" does not
    await page.addStyleTag({ content: ".meds-label { font-size: 1.05rem; }" });
    const heights = [];
    for (const m of ["Calm", "Neutral", "Happy", "Surprised", "Excited"]) {
      await page.locator(`.mood-btn[data-mood="${m}"]`).click();
      heights.push(await page.locator(".meds").evaluate((c) => Math.round(c.offsetHeight * 10) / 10));
    }
    expect(new Set(heights).size, heights.join(" / ")).toBe(1);
  });

  test("the heartbeat dot rests on the top edge of each part, never on its icon", async ({ page }) => {
    await page.goto("/");
    await page.locator("#sendBeat").scrollIntoViewIfNeeded();
    // measured inside the page, from the arrival itself: the run's own 1.4 s pause must not expire between two round trips to the test
    const stops = await page.evaluate(async () => {
      const btn = document.querySelector("#sendBeat"), arch = document.querySelector("#arch"), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const arrival = () => new Promise((r) => { const mo = new MutationObserver(() => { mo.disconnect(); r(); }); mo.observe(arch, { attributes: true, subtree: true, attributeFilter: ["class"] }); });
      const out = [];
      btn.click(); // the first stop (the sensor) is reached before click() returns
      for (let stop = 0; stop < 3; stop++) {
        await sleep(400); // the part has lifted and finished its pulse
        const d = document.querySelector(".beat-dot").getBoundingClientRect(), n = document.querySelector("#arch .node.on"), r = n.getBoundingClientRect(), i = n.querySelector("span").getBoundingClientRect();
        out.push({ dx: d.left + d.width / 2 - (r.left + r.width / 2), dy: d.top + d.height / 2 - r.top, onIcon: d.bottom > i.top && d.top < i.bottom && d.right > i.left && d.left < i.right });
        const next = arrival();
        btn.click(); // next part
        await next;
      }
      return out;
    });
    for (const [stop, g] of stops.entries()) {
      expect(Math.abs(g.dx), `stop ${stop} horizontal`).toBeLessThan(3);
      expect(Math.abs(g.dy), `stop ${stop} vertical`).toBeLessThan(5);
      expect(g.onIcon, `stop ${stop} covers the icon`).toBe(false);
    }
  });

  for (const w of [320, 430, 760]) {
    test(`the heartbeat button never meets the trophy at any scroll position (${w}px)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto("/");
      await expect(page.locator(".beat-row")).toHaveCSS("text-align", "right");
      const hits = await page.evaluate(() => {
        const b = document.querySelector("#sendBeat"), t = document.querySelector(".trophy"), top = b.getBoundingClientRect().top + scrollY, hits = [];
        if (!t.getBoundingClientRect().width) return ["trophy has no box"];
        for (let y = top - innerHeight; y <= top + 40; y += 20) {
          scrollTo({ top: Math.max(0, y), behavior: "instant" });
          const a = b.getBoundingClientRect(), c = t.getBoundingClientRect();
          if (a.right > c.left && a.left < c.right && a.bottom > c.top && a.top < c.bottom) hits.push(Math.round(y));
        }
        return hits;
      });
      expect(hits).toEqual([]);
    });
  }
});
