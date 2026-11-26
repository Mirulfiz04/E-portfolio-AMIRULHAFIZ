import { test, expect } from "./fixtures.js";

// Acceptance criteria D1-D3 of the Designer's motion spec (docs/design/motion-spec.md @ 59f02fb), items 1-3:
//   D1 Set the mood (MEDS widget + hero network)   D2 Send a heartbeat (MEDS architecture)   D3 Cards that travel (project filters + Details dialog)
// Written from the spec, not from the developer's tests. Runs with every CDN blocked, which the spec says must behave identically.
// The version with the real GSAP/Lenis is in qa-motion.spec.js (opt-in). Timing-sensitive cases: run with --repeat-each to check for flakiness.

const MOODS = { Calm: 66, Neutral: 72, Happy: 78, Surprised: 91, Excited: 96 };
const ORDER = ["sensor", "app", "ml", "app", "supa", "edge", "claude"];
const mood = (page, name) => page.locator(`.mood-btn[data-mood="${name}"]`);
const displayed = (locator) => locator.evaluate((el) => getComputedStyle(el).display !== "none" && el.getClientRects().length > 0);
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// colour helpers installed in the page, so a test can ask for contrast ratios of composited colours
const CONTRAST = () => {
  const rgba = (c) => { const n = c.match(/-?[\d.]+/g).map(Number); return c.startsWith("color(") ? [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1] : [n[0], n[1], n[2], n[3] ?? 1]; };
  const over = (t, u) => [0, 1, 2].map((i) => t[i] * t[3] + u[i] * (1 - t[3])).concat(1);
  const bgOf = (el) => { const chain = []; for (let e = el; e; e = e.parentElement) chain.unshift(rgba(getComputedStyle(e).backgroundColor)); return chain.reduce((a, c) => (c[3] === 0 ? a : over(c, a)), [255, 255, 255, 1]); };
  const lum = ([r, g, b]) => [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  window.__c = { rgba, over, bgOf, ratio };
};

// ================================================================ D1 Set the mood
test.describe("D1 Set the mood", () => {
  test.use({ viewport: { width: 430, height: 900 } });

  test("five real buttons in a group named 'Set the demo mood', each with a name, and the 'simulated' label stays", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("group", { name: "Set the demo mood" });
    await expect(group).toBeVisible();
    await expect(group.locator("button[type=button]")).toHaveCount(5);
    for (const name of Object.keys(MOODS)) await expect(group.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".meds .pill-sm")).toHaveText(/simulated/i);
  });

  for (const w of [320, 360, 390, 430, 760, 1280]) {
    test(`at ${w}px the five buttons are 44x44 or more, on one row, inside the card`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto("/");
      const r = await page.evaluate(() => {
        // layout geometry (offset*), not getBoundingClientRect: on desktop the card is tilted in 3D by design, which skews screen rects
        const card = document.querySelector(".meds");
        return [...document.querySelectorAll(".mood-btn")].map((b) => ({ top: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight, inside: b.offsetLeft >= 0 && b.offsetLeft + b.offsetWidth <= card.offsetWidth }));
      });
      expect(new Set(r.map((b) => b.top)).size, "one row").toBe(1);
      for (const b of r) { expect(b.w).toBeGreaterThanOrEqual(44); expect(b.h).toBeGreaterThanOrEqual(44); expect(b.inside).toBe(true); }
      expect(await noSideways(page)).toBe(true);
    });
  }

  for (const w of [320, 430, 760, 1280]) {
    test(`the card keeps the same height for all five moods at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto("/");
      const height = () => page.locator(".meds").evaluate((el) => el.offsetHeight); // layout height: the desktop card tilts in 3D with the mouse
      const base = await height();
      for (const name of Object.keys(MOODS)) {
        await mood(page, name).click();
        await expect(page.locator("#medsEmotion")).toHaveText(name);
        await page.waitForTimeout(250);
        expect(Math.abs((await height()) - base), `${name} at ${w}px`).toBeLessThanOrEqual(1);
      }
    });
  }

  test("choosing Excited shows Excited, presses exactly one button, and it is still Excited 4 s later", async ({ page }) => {
    await page.goto("/");
    await mood(page, "Excited").click();
    await expect(page.locator("#medsEmotion")).toHaveText("Excited");
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(1);
    await expect(mood(page, "Excited")).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(4200); // the old automatic cycle fires every 3.2 s
    await expect(page.locator("#medsEmotion")).toHaveText("Excited");
    await expect(mood(page, "Excited")).toHaveAttribute("aria-pressed", "true");
  });

  test("another mood moves the pressed state; pressing the chosen one again clears it and cycling resumes within 4 s", async ({ page }) => {
    await page.goto("/");
    await mood(page, "Calm").click();
    await mood(page, "Surprised").click();
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(1);
    await expect(mood(page, "Surprised")).toHaveAttribute("aria-pressed", "true");
    const t0 = Date.now();
    await mood(page, "Surprised").click(); // again
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator("#medsEmotion")).not.toHaveText("Surprised", { timeout: 4000 });
    expect(Date.now() - t0, "cycling resumed").toBeLessThan(4000);
  });

  test("the hidden click on the face is gone: clicking the face changes nothing", async ({ page }) => {
    await page.goto("/");
    const before = await page.locator("#medsEmotion").innerText();
    await page.locator("#medsFace").click({ force: true });
    await expect(page.locator("#medsEmotion")).toHaveText(before);
  });

  test("keyboard: Tab reaches each button, Enter and Space choose and clear, focus stays, focus ring visible", async ({ page }) => {
    await page.goto("/");
    await mood(page, "Calm").focus();
    await page.keyboard.press("Enter");
    await expect(mood(page, "Calm")).toHaveAttribute("aria-pressed", "true");
    await expect(mood(page, "Calm")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(mood(page, "Neutral")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(mood(page, "Neutral")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(1);
    await page.keyboard.press("Space"); // again
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(0);
    const ring = await mood(page, "Neutral").evaluate((el) => { const s = getComputedStyle(el); return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0; });
    expect(ring, "visible focus ring").toBe(true);
  });

  test.describe("touch", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    test("a tap chooses, a second tap on it clears", async ({ page }) => {
      await page.goto("/");
      await mood(page, "Excited").tap();
      await expect(page.locator("#medsEmotion")).toHaveText("Excited");
      await mood(page, "Excited").tap();
      await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(0);
    });
  });

  test("rapid presses end in a consistent state: the last chosen mood, one button pressed", async ({ page }) => {
    await page.goto("/");
    for (const m of ["Calm", "Excited", "Neutral", "Surprised", "Calm", "Happy"]) await mood(page, m).click({ delay: 0 });
    await expect(page.locator("#medsEmotion")).toHaveText("Happy");
    await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(1);
    await expect(mood(page, "Happy")).toHaveAttribute("aria-pressed", "true");
  });

  test("choosing a mood changes what the hero network paints (it follows the mood)", async ({ page }) => {
    await page.goto("/");
    const painted = () => page.evaluate(() => { const c = document.querySelector("#net"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
    await mood(page, "Calm").click();
    await page.waitForTimeout(1300); // 800 ms ease + 600 ms ring
    const calm = await painted();
    await mood(page, "Excited").click();
    await page.waitForTimeout(1300);
    const excited = await painted();
    expect(calm, "something is painted").toBeGreaterThan(0);
    expect(excited, "something is painted").toBeGreaterThan(0);
    expect(calm, "Calm (links to 150px) and Excited (110px) paint different amounts").not.toBe(excited);
  });

  for (const scheme of ["light", "dark"]) {
    test(`${scheme} theme: idle button outlines are visible (3:1), the pressed state differs, the label is readable`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript(CONTRAST);
      await page.goto("/");
      await mood(page, "Calm").click();
      const r = await page.evaluate(() => {
        const { rgba, over, bgOf, ratio } = window.__c;
        const card = document.querySelector(".meds"), idle = document.querySelector('.mood-btn[data-mood="Neutral"]'), on = document.querySelector('.mood-btn[data-mood="Calm"]');
        const cardBg = bgOf(card);
        return {
          idleBorder: ratio(over(rgba(getComputedStyle(idle).borderTopColor), bgOf(idle)), cardBg),
          pressedFill: ratio(rgba(getComputedStyle(on).backgroundColor), bgOf(idle)),
          label: ratio(over(rgba(getComputedStyle(document.querySelector("#medsEmotion")).color), cardBg), cardBg)
        };
      });
      expect(r.idleBorder, "idle outline vs card").toBeGreaterThanOrEqual(3);
      expect(r.pressedFill, "pressed fill differs from the idle fill").toBeGreaterThan(1.1);
      expect(r.label, "label text").toBeGreaterThanOrEqual(4.5);
    });
  }

  test("print: the new controls are not printed", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    expect(await displayed(page.locator(".mood"))).toBe(false);
    for (const sel of ["#sendBeat", "#beatStatus"]) expect(await displayed(page.locator(sel)), sel).toBe(false);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("Calm shows Calm and 66 bpm at once; two canvas captures 500 ms apart are identical", async ({ page }) => {
      await page.goto("/");
      await mood(page, "Calm").click();
      await expect(page.locator("#medsEmotion")).toHaveText("Calm");
      await expect(page.locator("#medsHr")).toHaveText("66");
      await expect(mood(page, "Calm")).toHaveAttribute("aria-pressed", "true");
      const a = await page.locator("#net").evaluate((c) => c.toDataURL());
      await page.waitForTimeout(500);
      const b = await page.locator("#net").evaluate((c) => c.toDataURL());
      expect(a === b, "canvas unchanged").toBe(true);
    });

    test("every mood sets label, heart rate and pressed state at once, and the canvas redraws once in the new look", async ({ page }) => {
      await page.goto("/");
      let last = await page.locator("#net").evaluate((c) => c.toDataURL());
      // (link distance, tint) per the spec table; the canvas can only look different when one of them differs from the previous mood.
      // Neutral and Happy are both 130px and --accent, so with frozen nodes they legitimately paint the same picture.
      const look = { Calm: "150/accent-2", Neutral: "130/accent", Happy: "130/accent", Surprised: "120/accent-2", Excited: "110/accent" };
      let prev = "130/accent"; // the page starts on Happy (automatic cycle)
      for (const [name, bpm] of Object.entries(MOODS)) {
        await mood(page, name).click();
        await expect(page.locator("#medsEmotion")).toHaveText(name);
        await expect(page.locator("#medsHr")).toHaveText(String(bpm));
        const now = await page.locator("#net").evaluate((c) => c.toDataURL());
        if (look[name] !== prev) expect(now === last, `canvas redrew for ${name}`).toBe(false);
        last = now; prev = look[name];
      }
    });

    test("pressing the chosen mood again clears it", async ({ page }) => {
      await page.goto("/");
      await mood(page, "Excited").click();
      await mood(page, "Excited").click();
      await expect(page.locator('.mood-btn[aria-pressed="true"]')).toHaveCount(0);
    });
  });
});

// ================================================================ D2 Send a heartbeat
test.describe("D2 Send a heartbeat", () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  const node = (page, k) => page.locator(`#arch .node[data-k="${k}"]`);
  const btn = (page) => page.locator("#sendBeat");
  const dots = (page) => page.locator("#arch .beat-dot");
  // records which node is `.on` over time, so a test can compare the whole sequence, not only the end
  const record = (page) => page.evaluate(() => {
    window.__seen = [document.querySelector("#arch .node.on")?.dataset.k];
    new MutationObserver(() => { const k = document.querySelector("#arch .node.on")?.dataset.k; if (k && k !== window.__seen.at(-1)) window.__seen.push(k); })
      .observe(document.querySelector("#arch"), { attributes: true, subtree: true, attributeFilter: ["class"] });
  });
  const seen = (page) => page.evaluate(() => window.__seen);
  const toArch = (page) => page.evaluate(() => document.querySelector("#arch").scrollIntoView({ block: "center" }));
  // starts a run and waits for its first arrival (button turns into "Next part")
  const start = async (page) => { await toArch(page); await btn(page).click(); await expect(btn(page)).toHaveText("Next part →"); };

  test("the button is a real button, at least 44px high, and starts idle", async ({ page }) => {
    await page.goto("/");
    await expect(btn(page)).toHaveText("▶ Send a heartbeat");
    expect((await btn(page).boundingBox()).height).toBeGreaterThanOrEqual(43.9); // the .btn measures 43.997px: sub-pixel rounding of 44
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
    await expect(dots(page)).toHaveCount(0);
  });

  test("a full natural run visits the seven stops in order, ends on Claude API, leaves no dot, restores the live region", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await toArch(page);
    await record(page);
    await btn(page).click();
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "off"); // during the run
    await expect(btn(page)).toHaveText("↻ Send again", { timeout: 30000 });
    expect((await seen(page)).join(",")).toBe(ORDER.join(","));
    await expect(node(page, "claude")).toHaveClass(/\bon\b/);
    await expect(dots(page)).toHaveCount(0);
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("#beatStatus")).toHaveText("Reading reached: Claude API");
    await expect(btn(page)).toBeEnabled();
  });

  for (const w of [320, 430, 760]) {
    test.describe(`touch at ${w}px`, () => {
      test.use({ viewport: { width: w, height: 900 }, hasTouch: true, isMobile: w < 700 });

      test("tapping the button on each arrival skips the pauses: all seven stops in order, no dot left, no sideways scroll", async ({ page }) => {
        test.setTimeout(40000);
        await page.goto("/");
        await toArch(page);
        await record(page);
        await btn(page).tap();
        let sideways = false;
        for (let i = 0; i < 120; i++) {
          const t = await btn(page).innerText();
          if (t.includes("Send again")) break;
          if (t.includes("Next part")) await btn(page).tap();
          if (!(await noSideways(page))) sideways = true;
          await page.waitForTimeout(100);
        }
        await expect(btn(page)).toHaveText("↻ Send again");
        expect((await seen(page)).join(",")).toBe(ORDER.join(","));
        await expect(dots(page)).toHaveCount(0);
        expect(sideways, "no sideways scroll while the dot travels").toBe(false);
      });
    });
  }

  test("while it rests the dot sits on the top-centre edge of the stop, inside #arch, and takes no pointer events", async ({ page }) => {
    await page.goto("/");
    await start(page);
    const g = await page.evaluate(() => {
      const dot = document.querySelector("#arch .beat-dot"), a = document.querySelector("#arch").getBoundingClientRect();
      const d = dot.getBoundingClientRect(), n = document.querySelector('#arch .node[data-k="sensor"]').getBoundingClientRect();
      return { dx: Math.abs(d.left + d.width / 2 - (n.left + n.width / 2)), dy: Math.abs(d.top + d.height / 2 - n.top), w: d.width, inside: d.left >= a.left - 1 && d.right <= a.right + 1, pe: getComputedStyle(dot).pointerEvents, hidden: dot.getAttribute("aria-hidden") };
    });
    expect(g.dx).toBeLessThanOrEqual(2);
    expect(g.dy).toBeLessThanOrEqual(2);
    expect(g.w).toBe(12);
    expect(g.inside).toBe(true);
    expect(g.pe).toBe("none");
    expect(g.hidden).toBe("true");
  });

  test("hovering a stop mid-run stops it and that stop's text stays for 3 s", async ({ page }) => {
    await page.goto("/");
    await start(page);
    await node(page, "supa").hover();
    await expect(dots(page)).toHaveCount(0);
    await expect(btn(page)).toHaveText("▶ Send a heartbeat");
    await expect(btn(page)).toBeEnabled();
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
    await expect(node(page, "supa")).toHaveClass(/\bon\b/);
    const text = await page.locator("#archInfo").innerText();
    expect(text.length).toBeGreaterThan(20);
    await page.waitForTimeout(3100);
    await expect(page.locator("#archInfo")).toHaveText(text);
    await expect(node(page, "supa")).toHaveClass(/\bon\b/);
  });

  test("focusing a stop mid-run stops it (keyboard)", async ({ page }) => {
    await page.goto("/");
    await start(page);
    await node(page, "ml").focus();
    await expect(dots(page)).toHaveCount(0);
    await expect(btn(page)).toHaveText("▶ Send a heartbeat");
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
  });

  test.describe("touch stop", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    test("tapping a stop mid-run stops it and keeps that stop's text", async ({ page }) => {
      await page.goto("/");
      await toArch(page);
      await btn(page).tap();
      await expect(btn(page)).toHaveText("Next part →");
      await node(page, "edge").tap();
      await expect(dots(page)).toHaveCount(0);
      await expect(btn(page)).toHaveText("▶ Send a heartbeat");
      await expect(node(page, "edge")).toHaveClass(/\bon\b/);
    });
  });

  test("switching to another browser tab mid-run and back: no dot, enabled button, nothing restarts", async ({ page }) => {
    await page.goto("/");
    await start(page);
    // headless Chromium keeps every tab visible, so the hidden state is simulated the way the page sees it
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(dots(page)).toHaveCount(0);
    await expect(btn(page)).toHaveText("▶ Send a heartbeat");
    await expect(btn(page)).toBeEnabled();
    await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(1800); // longer than the 1.4 s pause a stale run would have woken from
    await expect(dots(page)).toHaveCount(0);
    await expect(btn(page)).toHaveText("▶ Send a heartbeat");
  });

  test("two fast presses never run two dots; later presses never add more", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/");
    await toArch(page);
    await page.evaluate(() => { const b = document.querySelector("#sendBeat"); b.click(); b.click(); b.click(); });
    let max = 0;
    for (let i = 0; i < 40; i++) { max = Math.max(max, await dots(page).count()); await page.waitForTimeout(50); }
    expect(max).toBeLessThanOrEqual(1);
    await expect(btn(page)).toBeEnabled();
  });

  test("Escape stops the run and focus stays on the button; Enter and Space both start it", async ({ page }) => {
    await page.goto("/");
    await toArch(page);
    await btn(page).focus();
    await page.keyboard.press("Enter");
    await expect(btn(page)).toHaveText("Next part →");
    await page.keyboard.press("Escape");
    await expect(dots(page)).toHaveCount(0);
    await expect(btn(page)).toHaveText("▶ Send a heartbeat");
    await expect(btn(page)).toBeFocused();
    await page.keyboard.press("Space");
    await expect(btn(page)).toHaveText("Next part →");
    await expect(btn(page)).toBeFocused();
    await expect(dots(page)).toHaveCount(1);
  });

  test("scrolling the explorer off screen stops the run", async ({ page }) => {
    await page.goto("/");
    await start(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(dots(page)).toHaveCount(0);
    await expect(btn(page)).toHaveText("▶ Send a heartbeat");
  });

  for (const w of [320, 430, 760, 761, 1280]) {
    test(`the button never overlaps the fixed trophy at any scroll position at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto("/");
      const hits = await page.evaluate(async () => {
        const b = document.querySelector("#sendBeat"), t = document.querySelector("#trophy"), out = [];
        const top = b.getBoundingClientRect().top + scrollY;
        for (let y = Math.max(0, top - 1000); y < top + 600; y += 60) {
          scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r));
          const x = b.getBoundingClientRect(), z = t.getBoundingClientRect();
          const visible = x.bottom > 0 && x.top < innerHeight;
          if (visible && x.left < z.right && x.right > z.left && x.top < z.bottom && x.bottom > z.top) out.push(Math.round(y));
        }
        return out;
      });
      expect(hits, "scroll positions where the button is under the trophy").toEqual([]);
    });
  }

  test("the dot stays visible against the explorer in both themes (3:1)", async ({ page }) => {
    for (const scheme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript(CONTRAST);
      await page.goto("/");
      await start(page);
      const r = await page.evaluate(() => { const { rgba, bgOf, ratio } = window.__c; const dot = document.querySelector("#arch .beat-dot"); return ratio(rgba(getComputedStyle(dot).backgroundColor), bgOf(document.querySelector("#arch"))); });
      expect(r, `${scheme}: dot vs explorer`).toBeGreaterThanOrEqual(3);
    }
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("no dot and no timer: each press moves exactly one stop, in order, then starts again", async ({ page }) => {
      await page.goto("/");
      await toArch(page);
      for (let i = 0; i < ORDER.length; i++) {
        await btn(page).click();
        await expect(node(page, ORDER[i]), `press ${i + 1}`).toHaveClass(/\bon\b/);
        await expect(page.locator("#arch .node.on")).toHaveCount(1);
        await expect(dots(page)).toHaveCount(0);
        await expect(btn(page)).toHaveText(i < ORDER.length - 1 ? "Next part →" : "↻ Send again");
      }
      await btn(page).click();
      await expect(node(page, "sensor")).toHaveClass(/\bon\b/);
      await page.waitForTimeout(1700);
      await expect(node(page, "sensor"), "nothing moves on its own").toHaveClass(/\bon\b/);
      await expect(page.locator("#archInfo")).toHaveAttribute("aria-live", "polite");
    });
  });
});

// ================================================================ D3 Cards that travel
test.describe("D3 Cards that travel", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const chips = (page) => page.locator(".proj-head .chip");
  // scroll to the cards and wait for the site's own 0.8 s reveal fade to finish: a filter pressed mid-reveal sees no layout change to animate
  // (the page scrolls smoothly, so also wait until the scroll has really arrived and cards are on screen)
  const toProjects = async (page) => {
    await page.evaluate(() => document.querySelector("#projectList").scrollIntoView({ block: "start" }));
    let last = -1;
    await expect.poll(async () => {
      const s = await page.evaluate(() => {
        const inView = [...document.querySelectorAll(".p-card")].filter((c) => { const r = c.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
        return { y: Math.round(scrollY), n: inView.length, settled: inView.every((c) => c.classList.contains("in") && c.getAnimations().length === 0) };
      });
      const stable = s.y === last; last = s.y;
      return s.n > 0 && s.settled && stable;
    }, { timeout: 8000 }).toBe(true);
  };
  const state = (page) => page.evaluate(() => {
    const cards = [...document.querySelectorAll(".p-card")];
    return {
      shown: cards.filter((c) => getComputedStyle(c).display !== "none").length,
      running: cards.reduce((n, c) => n + c.getAnimations().length, 0),
      inline: cards.filter((c) => c.style.transform).length,
      tilt: cards.filter((c) => c.classList.contains("tilt")).length,
      pressed: [...document.querySelectorAll(".proj-head .chip")].filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.filter),
      status: document.querySelector("#projStatus").textContent
    };
  });

  test("each filter shows exactly the cards whose data-cats contain it, All shows 9, and the status line says how many", async ({ page }) => {
    await page.goto("/");
    await toProjects(page);
    const n = await chips(page).count();
    expect(n).toBeGreaterThan(2);
    await expect(page.locator("#projStatus")).toHaveAttribute("role", "status");
    for (let i = 0; i < n; i++) {
      const f = await chips(page).nth(i).getAttribute("data-filter");
      await chips(page).nth(i).click();
      const expected = await page.evaluate((f) => [...document.querySelectorAll(".p-card")].filter((c) => f === "all" || c.dataset.cats.includes(f)).length, f);
      await expect.poll(async () => (await state(page)).shown, { message: `filter ${f}` }).toBe(expected);
      if (f === "all") expect(expected).toBe(9);
      expect((await state(page)).status).toBe(`${expected} project${expected === 1 ? "" : "s"} shown`);
    }
  });

  test("the status line is visually hidden but not removed from the accessibility tree", async ({ page }) => {
    await page.goto("/");
    const r = await page.locator("#projStatus").evaluate((el) => { const b = el.getBoundingClientRect(); return { w: b.width, h: b.height, display: getComputedStyle(el).display, vis: getComputedStyle(el).visibility }; });
    expect(r.display).not.toBe("none");
    expect(r.vis).not.toBe("hidden");
    expect(Math.max(r.w, r.h)).toBeLessThanOrEqual(2);
  });

  test("staying cards glide (within 120px), entering cards fade and grow, leaving cards go at once", async ({ page }) => {
    await page.goto("/");
    await toProjects(page);
    // pick a filter that removes the first card but keeps at least two others, so something has to move
    const pick = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".p-card")];
      return [...document.querySelectorAll(".proj-head .chip")].map((c) => c.dataset.filter).find((f) => f !== "all" && !cards[0].dataset.cats.includes(f) && cards.filter((c) => c.dataset.cats.includes(f)).length >= 2);
    });
    expect(pick, "a suitable filter exists").toBeTruthy();
    const out = await page.evaluate((f) => {
      const cards = [...document.querySelectorAll(".p-card")];
      document.querySelector(`.proj-head .chip[data-filter="${f}"]`).click();
      // only the new Web Animations: the site's own CSS transitions (the reveal fade) are not part of this feature
      const waapi = (c) => c.getAnimations().filter((a) => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation));
      const kf = cards.flatMap((c) => waapi(c).map((a) => ({ shown: getComputedStyle(c).display !== "none", frames: a.effect.getKeyframes(), dur: a.effect.getTiming().duration })));
      return { n: kf.length, leavingDisplay: getComputedStyle(cards[0]).display, offsets: kf.flatMap((k) => k.frames.map((fr) => fr.transform).filter((t) => /translate/.test(String(t)))), durations: kf.map((k) => k.dur) };
    }, pick);
    expect(out.leavingDisplay, "a leaving card goes at once").toBe("none");
    expect(out.n, "some staying card animates").toBeGreaterThan(0);
    for (const t of out.offsets) for (const m of String(t).matchAll(/-?[\d.]+(?=px)/g)) expect(Math.abs(Number(m[0])), `offset in ${t}`).toBeLessThanOrEqual(120.01);
    expect(Math.max(...out.durations)).toBeLessThanOrEqual(420);
    // and back to All: the returning cards fade and grow in
    const back = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".p-card")];
      document.querySelector('.proj-head .chip[data-filter="all"]').click();
      return cards.flatMap((c) => c.getAnimations().filter((a) => !(a instanceof CSSTransition)).map((a) => JSON.stringify(a.effect.getKeyframes().map((k) => [k.opacity, k.transform])))).filter((s) => /scale\(0\.96\)/.test(s)).length;
    });
    expect(back, "entering cards fade and scale in").toBeGreaterThan(0);
    await expect.poll(async () => (await state(page)).running, { timeout: 3000 }).toBe(0);
    expect((await state(page)).inline).toBe(0);
  });

  test("cards that are off screen before and after do not animate", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 0)); // the projects are far below the fold
    const running = await page.evaluate(() => {
      document.querySelector('.proj-head .chip:not([data-filter="all"])').click();
      // new Web Animations only; the reveal fade is a pre-existing CSS transition
      return [...document.querySelectorAll(".p-card")].reduce((n, c) => n + c.getAnimations().filter((a) => !(a instanceof CSSTransition)).length, 0);
    });
    expect(running).toBe(0);
  });

  for (const order of [[1, 2, 3, 0], [2, 1, 0, 3], [3, 1, 2, 1], [0, 3, 2, 1]]) {
    test(`four chips pressed within 500 ms (${order.join(",")}) end on the last filter; 1 s later nothing is running or left over`, async ({ page }) => {
      await page.goto("/");
      await toProjects(page);
      const last = await page.evaluate(async (order) => {
        const cs = [...document.querySelectorAll(".proj-head .chip")];
        for (const i of order) { cs[i].click(); await new Promise((r) => setTimeout(r, 110)); }
        return cs[order.at(-1)].dataset.filter;
      }, order);
      await page.waitForTimeout(1100);
      const s = await state(page);
      expect(s.pressed, "only the last chip is pressed").toEqual([last]);
      const expected = await page.evaluate((f) => [...document.querySelectorAll(".p-card")].filter((c) => f === "all" || c.dataset.cats.includes(f)).length, last);
      expect(s.shown).toBe(expected);
      expect(s.running, "running card animations").toBe(0);
      expect(s.inline, "inline transforms left").toBe(0);
      expect(s.tilt, "tilt class left").toBe(0);
      expect(s.status).toBe(`${expected} project${expected === 1 ? "" : "s"} shown`);
    });
  }

  test("chips work from the keyboard and focus stays on the chip", async ({ page }) => {
    await page.goto("/");
    await toProjects(page);
    const c = chips(page).nth(1);
    await c.focus();
    await page.keyboard.press("Enter");
    await expect(c).toHaveAttribute("aria-pressed", "true");
    await expect(c).toBeFocused();
    await chips(page).nth(2).focus();
    await page.keyboard.press("Space");
    await expect(chips(page).nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(chips(page).nth(2)).toBeFocused();
    await expect(page.locator('.proj-head .chip[aria-pressed="true"]')).toHaveCount(1);
  });

  test.describe("touch", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    test("a tap filters, cards stay inside the screen, offsets stay within 120px", async ({ page }) => {
      await page.goto("/");
      await toProjects(page);
      await chips(page).nth(1).tap();
      const out = await page.evaluate(() => [...document.querySelectorAll(".p-card")].flatMap((c) => c.getAnimations().map((a) => a.effect.getKeyframes().map((k) => String(k.transform)).join("|"))));
      for (const t of out) for (const m of t.matchAll(/-?[\d.]+(?=px)/g)) expect(Math.abs(Number(m[0]))).toBeLessThanOrEqual(120.01);
      expect(await noSideways(page)).toBe(true);
      await expect.poll(async () => (await state(page)).running, { timeout: 3000 }).toBe(0);
    });
  });

  test.describe("Details dialog", () => {
    const details = (page) => page.locator(".p-card .p-more").first();
    const modalInfo = (page) => page.evaluate(() => { const m = document.querySelector("#projectModal"); return { open: m.open, origin: m.style.transformOrigin, anim: m.style.animation, running: m.getAnimations().length }; });

    test("pressing Details grows the dialog out of that card: origin at the card centre, 0.94 to 1, opacity rises, 280 ms", async ({ page }) => {
      await page.goto("/");
      await toProjects(page);
      const r = await page.evaluate(async () => {
        const b = document.querySelector(".p-card .p-more"), card = b.closest(".p-card"), m = document.querySelector("#projectModal");
        b.click();
        // measure the card and the dialog in the same task as the click, which is when the site sets the origin (the page scroll-locks later)
        const c = card.getBoundingClientRect(), d = m.getBoundingClientRect();
        const ex = c.left + c.width / 2 - d.left, ey = c.top + c.height / 2 - d.top;
        const t0 = performance.now(), samples = [];
        await new Promise((res) => { const f = () => { samples.push([performance.now() - t0, Number(getComputedStyle(m).opacity)]); performance.now() - t0 < 500 ? requestAnimationFrame(f) : res(); }; f(); });
        const a = m.getAnimations().filter((x) => !(x instanceof CSSAnimation) && !(x instanceof CSSTransition)).length;
        return { min: Math.min(...samples.map((s) => s[1])), final: samples.at(-1)[1], origin: m.style.transformOrigin, ex, ey, transform: getComputedStyle(m).transform, leftover: a };
      });
      const [ox, oy] = r.origin.split(" ").map(parseFloat);
      // observed gap about 3.3px in x (the page scroll-lock removes the scrollbar as the dialog opens); at a 0.94 -> 1 scale that is far under 1px of visible shift
      expect(Math.abs(ox - r.ex), "origin x vs card centre").toBeLessThanOrEqual(8);
      expect(Math.abs(oy - r.ey), "origin y vs card centre").toBeLessThanOrEqual(8);
      expect(r.min, "starts transparent").toBeLessThan(0.9);
      expect(r.final).toBe(1);
      expect(r.transform === "none" || r.transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
      expect(r.leftover, "no animation left running").toBe(0);
    });

    test("opened any other way (a lesson card) it keeps today's entrance: no origin, no override", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => document.querySelector("#lessons").scrollIntoView());
      await page.locator("#lessonList .lesson").first().click();
      await expect.poll(async () => (await modalInfo(page)).open).toBe(true);
      const m = await modalInfo(page);
      expect(m.origin).toBe("");
      expect(m.anim).toBe("");
    });

    test("closing is instant and leaves nothing behind, so the next entrance is normal", async ({ page }) => {
      await page.goto("/");
      await toProjects(page);
      await details(page).click();
      await expect.poll(async () => (await modalInfo(page)).open).toBe(true);
      await page.keyboard.press("Escape");
      await expect.poll(async () => (await modalInfo(page)).open, { timeout: 150 }).toBe(false);
      // the dialog is hidden at once; the leftover origin/animation override is cleared by its "close" event a few ms later, so wait for that
      await expect.poll(async () => (await modalInfo(page)).origin, { timeout: 1500 }).toBe("");
      await expect.poll(async () => (await modalInfo(page)).anim, { timeout: 1500 }).toBe("");
      // opening from a card again after a lesson-open in between still works
      await page.evaluate(() => document.querySelector("#lessons").scrollIntoView());
      await page.locator("#lessonList .lesson").first().click();
      await expect.poll(async () => (await modalInfo(page)).open).toBe(true);
      await page.keyboard.press("Escape");
      expect((await modalInfo(page)).anim).toBe("");
    });

    test("focus returns to the same Details button after Escape (keyboard), and after the close button", async ({ page }) => {
      await page.goto("/");
      await toProjects(page);
      const b = page.locator(".p-card .p-more").nth(1);
      const label = await b.getAttribute("aria-label");
      await b.focus();
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await modalInfo(page)).open).toBe(true);
      await page.keyboard.press("Escape");
      await expect(page.locator(`.p-card .p-more[aria-label="${label}"]`)).toBeFocused();
      await b.focus();
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await modalInfo(page)).open).toBe(true);
      await page.locator("#projectModal .close").click();
      await expect(page.locator(`.p-card .p-more[aria-label="${label}"]`)).toBeFocused();
    });

    test.describe("touch", () => {
      test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      test("a tap on Details opens the dialog from that card and closing returns", async ({ page }) => {
        await page.goto("/");
        await toProjects(page);
        await details(page).tap();
        await expect.poll(async () => (await modalInfo(page)).open).toBe(true);
        expect((await modalInfo(page)).origin).toMatch(/px \d/);
        await page.locator("#projectModal .close").tap();
        await expect.poll(async () => (await modalInfo(page)).open).toBe(false);
      });
    });
  });

  test("no sideways scroll while cards travel, the mood changes and a heartbeat runs, at every spec width", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    for (const w of [320, 390, 430, 761, 1024, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.evaluate(() => { document.querySelector("#sendBeat").click(); document.querySelector('.mood-btn[data-mood="Excited"]').click(); });
      const samples = await page.evaluate(async () => {
        const out = [], cs = [...document.querySelectorAll(".proj-head .chip")];
        for (let i = 0; i < 12; i++) { if (i % 3 === 0) cs[(i / 3 + 1) % cs.length].click(); out.push(document.documentElement.scrollWidth <= innerWidth); await new Promise((r) => setTimeout(r, 90)); }
        return out;
      });
      expect(samples.every(Boolean), `sideways scroll at ${w}px`).toBe(true);
      await page.evaluate(() => { document.querySelector('.mood-btn[data-mood="Excited"]').click(); document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    }
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("filtering is instant (no card animation), the count is still announced, and print shows all projects", async ({ page }) => {
      await page.goto("/");
      await toProjects(page);
      const r = await page.evaluate(() => {
        document.querySelector('.proj-head .chip:not([data-filter="all"])').click();
        const cards = [...document.querySelectorAll(".p-card")];
        return { animations: cards.reduce((n, c) => n + c.getAnimations().length, 0), status: document.querySelector("#projStatus").textContent };
      });
      expect(r.animations).toBe(0);
      expect(r.status).toMatch(/^\d+ projects? shown$/);
      await page.emulateMedia({ media: "print" });
      const inPrint = await page.evaluate(() => [...document.querySelectorAll(".p-card")].filter((c) => getComputedStyle(c).display !== "none").length);
      expect(inPrint).toBe(9);
    });

    test("the dialog opens instantly: no origin set, no animation", async ({ page }) => {
      await page.goto("/");
      await toProjects(page);
      await page.locator(".p-card .p-more").first().click();
      await expect.poll(() => page.evaluate(() => document.querySelector("#projectModal").open)).toBe(true);
      // new Web Animations only: the dialog's own CSS "rise" still runs, shortened to ~0 ms by the reduced-motion rule
      const m = await page.evaluate(() => { const d = document.querySelector("#projectModal"); return { origin: d.style.transformOrigin, running: d.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).length }; });
      expect(m.origin).toBe("");
      expect(m.running).toBe(0);
    });
  });
});
