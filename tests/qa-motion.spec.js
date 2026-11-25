import { test as base, expect } from "@playwright/test";

// The normal suite blocks every CDN, so js/motion.js (Lenis smooth scroll + GSAP ScrollTrigger) never runs there.
// These tests let ONLY the three animation libraries through (cdnjs + jsDelivr, the exact URLs and SRI hashes in
// index.html), so they need internet. They are OPT-IN: CI must not depend on a CDN (docs decision 006), so the
// whole file is skipped unless you run   PW_REAL_CDN=1 npx playwright test --project=qa tests/qa-motion.spec.js
// (also skipped if the CDN cannot be reached). Cases that need no network live in qa-fallback.spec.js.
// Fonts, the GitHub API and the visit counter stay blocked.

const CDN_HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net"];
const LIBS = { gsap: "/gsap.min.js", scrolltrigger: "/ScrollTrigger.min.js", lenis: "/lenis.min.js" };

// `block` lists which libraries to hold back, to model a CDN that is partly down or partly blocked.
const test = base.extend({
  block: [[], { option: true }],
  page: async ({ page, baseURL, block }, use) => {
    const origin = new URL(baseURL).origin;
    const blocked = block.map((k) => LIBS[k]);
    await page.route(
      (url) => url.origin !== origin,
      (route) => {
        const u = new URL(route.request().url());
        const allowed = CDN_HOSTS.includes(u.hostname) && !blocked.some((s) => u.pathname.endsWith(s));
        return allowed ? route.continue() : route.abort();
      }
    );
    await use(page);
  },
  pageErrors: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await use(errors);
  }
});

test.skip(!process.env.PW_REAL_CDN, "real-CDN tests are opt-in: set PW_REAL_CDN=1 (needs internet; CI stays CDN-free)");

test.beforeAll(async ({ playwright }) => {
  const ctx = await playwright.request.newContext();
  const ok = await ctx.get("https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js", { timeout: 8000 }).then((r) => r.ok(), () => false);
  await ctx.dispose();
  test.skip(!ok, "CDN not reachable from this machine");
});

const libsLoaded = (page) => page.evaluate(() => ({ gsap: !!window.gsap, st: !!window.ScrollTrigger, lenis: !!window.Lenis }));
const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));

test.describe("Animated path (all three libraries load)", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("the libraries load (SRI hashes and URLs are still valid) and nothing throws", async ({ page, pageErrors }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    expect(pageErrors).toEqual([]);
  });

  test("the mouse wheel scrolls the page", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => scrollY(page), { timeout: 5000 }).toBeGreaterThan(400);
  });

  test("section headings split into words and end up visible once scrolled to", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => page.locator(".section h2 .w").count()).toBeGreaterThan(0);
    const h2 = page.locator("#projects h2").first();
    await h2.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 50);
    await expect(h2).toHaveAttribute("aria-label", /.+/); // the split keeps a readable label for screen readers
    await expect.poll(() => h2.evaluate((el) => [...el.querySelectorAll(".w > span")].every((s) => new DOMMatrix(getComputedStyle(s).transform).m42 < 1))).toBe(true);
  });

  test("the folders pop in and finish fully visible, not stuck half-faded", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    await page.locator("#folders").scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 10);
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll(".folder")].map((f) => Number(getComputedStyle(f).opacity))), { timeout: 6000 }).toEqual([1, 1, 1].slice(0, await page.locator(".folder").count()));
  });

  test("the hero drifts up as you scroll and comes back when you return", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    // .hero-copy only: the old selector ".hero-copy, .hero > div" matched the outer grid and dimmed the MEDS card too (fixed in 31602a9)
    const heroOpacity = () => page.evaluate(() => Number(getComputedStyle(document.querySelector(".hero-copy")).opacity));
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 500);
    await expect.poll(heroOpacity, { timeout: 5000 }).toBeLessThan(0.9);
    await page.mouse.wheel(0, -1500);
    await expect.poll(heroOpacity, { timeout: 5000 }).toBeGreaterThan(0.95);
  });

  test("a menu link glides to its section", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    await page.locator("#nav a[href='#contact']").click();
    await expect.poll(() => page.evaluate(() => Math.abs(document.querySelector("#contact").getBoundingClientRect().top)), { timeout: 6000 }).toBeLessThan(200);
  });

  test("a dialog stops page scrolling while open and gives it back after", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    await page.locator("[data-open-term]").first().click();
    await expect(page.locator("#term")).toHaveAttribute("open", "");
    const before = await scrollY(page);
    await page.mouse.move(100, 100); // outside the dialog, over the page
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(600);
    expect(await scrollY(page)).toBe(before);
    await page.keyboard.press("Escape");
    await expect(page.locator("#term")).not.toHaveAttribute("open", "");
    await page.mouse.wheel(0, 600);
    await expect.poll(() => scrollY(page), { timeout: 5000 }).toBeGreaterThan(before + 200);
  });

  test("no horizontal scroll appears while the animations play", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(250);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `after wheel ${i + 1}`).toBe(true);
    }
  });
});

test.describe("Animated path on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("touch scrolling works and the folders still end up visible", async ({ page, pageErrors }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    await page.locator("#folders").scrollIntoViewIfNeeded();
    await expect.poll(() => scrollY(page)).toBeGreaterThan(300);
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll(".folder")].every((f) => Number(getComputedStyle(f).opacity) === 1)), { timeout: 6000 }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(pageErrors).toEqual([]);
  });
});

test.describe("Animated path with reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1366, height: 768 } });

  test("motion.js stays out of the way: no word-splitting, normal wheel scroll", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    expect(await page.locator(".section h2 .w").count()).toBe(0);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => scrollY(page)).toBeGreaterThan(400);
  });
});

// CDN partly down: each combination must leave a page that still scrolls and shows its content.
// (All three blocked needs no network, so it lives in qa-fallback.spec.js.)
const PARTIAL = [
  // B-02 (fixed in b4873c0): Lenis only ticked from gsap.ticker, so without GSAP or ScrollTrigger it swallowed the wheel
  { name: "GSAP blocked, Lenis loads", block: ["gsap"] },
  { name: "ScrollTrigger blocked, GSAP and Lenis load", block: ["scrolltrigger"] },
  { name: "Lenis blocked, GSAP loads", block: ["lenis"] }
];

for (const c of PARTIAL) {
  test.describe(`Partly blocked CDN: ${c.name}`, () => {
    test.use({ block: c.block, viewport: { width: 1366, height: 768 } });

    test("the wheel still scrolls the page and nothing throws", async ({ page, pageErrors }) => {
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.waitForTimeout(500); // let any library that does load start up
      await page.mouse.move(600, 400);
      await page.mouse.wheel(0, 900);
      await expect.poll(() => scrollY(page), { timeout: 3000 }).toBeGreaterThan(400);
      expect(pageErrors).toEqual([]);
    });

    test("headings and folders stay visible", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.evaluate(() => document.querySelector("#folders").scrollIntoView());
      await expect.poll(() => page.evaluate(() => [...document.querySelectorAll(".folder")].every((f) => Number(getComputedStyle(f).opacity) === 1)), { timeout: 6000 }).toBe(true);
      await expect(page.locator("#projects h2").first()).toBeVisible();
    });
  });
}

// B-01 fix with the real libraries: Lenis must not swallow the wheel inside the scrollable menu (data-lenis-prevent)
test.describe("Menu on a landscape phone with the real libraries", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test("the wheel scrolls the open menu, not the page, and Contact comes on screen", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
    await page.locator("#menuBtn").click();
    const nav = page.locator("#nav");
    const box = await nav.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => nav.evaluate((el) => el.scrollTop), { timeout: 4000 }).toBeGreaterThan(20);
    expect(await scrollY(page)).toBe(0);
    await expect(page.locator("#nav a[href='#contact']")).toBeInViewport();
  });
});

// D1 with the real libraries: the hero fade must never dim the MEDS card (or its mood buttons) at any width
test.describe("MEDS card stays fully visible with GSAP loaded (motion spec item 1)", () => {
  for (const w of [320, 430, 760, 1280]) {
    test(`card and all its ancestors have opacity 1 while the mood buttons are on screen at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: w < 761 ? 900 : 800 });
      await page.goto("/");
      await expect.poll(() => libsLoaded(page)).toEqual({ gsap: true, st: true, lenis: true });
      const worst = () => page.evaluate(() => {
        const btns = document.querySelector(".mood");
        const r = btns.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= innerHeight) return { onScreen: false, minOpacity: 1 };
        let min = 1;
        for (let e = document.querySelector(".meds"); e; e = e.parentElement) min = Math.min(min, Number(getComputedStyle(e).opacity));
        return { onScreen: true, minOpacity: min };
      });
      for (const dy of [0, 60, 120, 200]) {
        await page.evaluate((y) => window.scrollTo(0, y), dy);
        await page.waitForTimeout(500); // Lenis and ScrollTrigger scrub need a moment
        const s = await worst();
        if (s.onScreen) expect(s.minOpacity, `scrollY=${dy}`).toBe(1);
      }
    });
  }
});
