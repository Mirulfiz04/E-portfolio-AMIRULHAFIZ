import { test, expect } from "./fixtures.js";

// "Search on mobile" basics: what Google's mobile-first indexing and a phone's browser need from the page.
// These run against the local copy, so they check the files, not the live site (scripts/verify-live.mjs does that).

const SITE = "https://mirulfiz04.github.io/E-portfolio-AMIRULHAFIZ/";

test.describe("Head tags on index.html", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/"); });

  test("language, title and description are set and a sensible length", async ({ page }) => {
    expect(await page.locator("html").getAttribute("lang")).toBeTruthy();
    const title = await page.title();
    expect(title.length).toBeGreaterThanOrEqual(10);
    expect(title.length).toBeLessThanOrEqual(65); // longer titles are cut off in results
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc.length).toBeGreaterThanOrEqual(50);
    expect(desc.length).toBeLessThanOrEqual(170);
  });

  test("the viewport tag makes phones lay the page out at device width and lets people zoom", async ({ page }) => {
    const vp = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(vp).toMatch(/width=device-width/);
    expect(vp).not.toMatch(/user-scalable\s*=\s*(no|0)/);
    expect(vp).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/);
  });

  test("the canonical URL is absolute https and matches og:url", async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe(SITE);
    expect(await page.locator('meta[property="og:url"]').getAttribute("content")).toBe(canonical);
  });

  test("link previews have a title, description and an absolute image", async ({ page }) => {
    for (const p of ["og:title", "og:description", "og:image"]) {
      expect(await page.locator(`meta[property="${p}"]`).getAttribute("content"), p).toBeTruthy();
    }
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(/^https:\/\//);
  });

  test("the structured data is valid JSON", async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) expect(() => JSON.parse(b)).not.toThrow();
  });

  test("the page is not blocked from search engines", async ({ page }) => {
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBe(0);
  });

  test("exactly one visible h1, and every image has alt text", async ({ page }) => {
    const visibleH1 = await page.evaluate(() => [...document.querySelectorAll("h1")].filter((h) => h.getClientRects().length > 0).length); // the print-only CV header has its own h1, hidden on screen
    expect(visibleH1).toBe(1);
    expect(await page.locator("img:not([alt])").count()).toBe(0);
  });
});

test.describe("robots.txt and sitemap.xml", () => {
  test("robots.txt allows crawling and points at the sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const txt = await res.text();
    expect(txt).not.toMatch(/^\s*Disallow:\s*\/\s*$/m);
    expect(txt).toContain(`Sitemap: ${SITE}sitemap.xml`);
  });

  test("sitemap.xml lists the canonical page", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain(`<loc>${SITE}</loc>`);
  });
});

test.describe("Links and images", () => {
  test("every in-page link has a target and every local link resolves", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")))]);
    const ids = await page.evaluate(() => new Set([...document.querySelectorAll("[id]")].map((e) => e.id)).size && [...document.querySelectorAll("[id]")].map((e) => e.id));
    const bad = [];
    for (const h of hrefs) {
      if (h === "#" || /^(mailto:|tel:|javascript:)/.test(h) || /^https?:/.test(h)) continue;
      if (h.startsWith("#")) { if (!ids.includes(h.slice(1))) bad.push(`${h} has no target`); continue; }
      const res = await request.get("/" + h.split("#")[0]);
      if (res.status() >= 400) bad.push(`${h} -> ${res.status()}`);
    }
    expect(bad).toEqual([]);
  });

  test("links that open a new tab use rel=noopener", async ({ page }) => {
    await page.goto("/");
    const unsafe = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/noopener|noreferrer/.test(a.rel)).map((a) => a.href));
    expect(unsafe).toEqual([]);
  });

  test("every image loads once scrolled into view", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
    });
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll("img[src]")].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src")))) // img#lbImg (lightbox) has no src until opened
      .toEqual([]);
  });
});

test.describe("Old page URLs (redirect stubs)", () => {
  // BUG B-03: the stubs declare a relative canonical with a #fragment ("index.html#about"), which search engines ignore.
  for (const file of ["about.html", "academic.html", "contact.html", "qualities.html", "works.html"]) {
    test(`${file} has an absolute canonical without a fragment`, async ({ request }) => {
      test.fail(true, "B-03: relative canonical with a fragment on the redirect stubs");
      const html = await (await request.get("/" + file)).text();
      const href = html.match(/rel="canonical" href="([^"]+)"/)?.[1] ?? "";
      expect(href).toMatch(/^https:\/\/[^#]+$/);
    });
  }
});
