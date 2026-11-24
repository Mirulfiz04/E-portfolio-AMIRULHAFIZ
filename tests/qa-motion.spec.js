import { test as base, expect } from "@playwright/test";

// The normal suite blocks every CDN, so js/motion.js (Lenis smooth scroll + GSAP ScrollTrigger) never runs there.
// These tests let ONLY the three animation libraries through (cdnjs + jsDelivr, the exact URLs and SRI hashes in
// index.html), so they need internet. They skip themselves when the CDN cannot be reached.
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
    const heroOpacity = () => page.evaluate(() => Number(getComputedStyle(document.querySelector(".hero-copy, .hero > div")).opacity));
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
const PARTIAL = [
  { name: "all three blocked", block: ["gsap", "scrolltrigger", "lenis"] },
  { name: "GSAP blocked, Lenis loads", block: ["gsap"], bug: "B-02: Lenis only ticks from gsap.ticker, so without GSAP it swallows the wheel and the page cannot be scrolled with a mouse" },
  { name: "ScrollTrigger blocked, GSAP and Lenis load", block: ["scrolltrigger"], bug: "B-02b: same as B-02 (the ticker is only wired after the ScrollTrigger check)" },
  { name: "Lenis blocked, GSAP loads", block: ["lenis"] }
];

for (const c of PARTIAL) {
  test.describe(`Partly blocked CDN: ${c.name}`, () => {
    test.use({ block: c.block, viewport: { width: 1366, height: 768 } });

    test("the wheel still scrolls the page and nothing throws", async ({ page, pageErrors }) => {
      if (c.bug) test.fail(true, c.bug);
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
