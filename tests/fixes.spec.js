import { test, expect } from "./fixtures.js";
import { excludedPaths } from "../scripts/site-config.mjs";

// Regression tests for the review findings: smooth scroll without GSAP, the honest guestbook message,
// escaped GitHub repo cards, a checked sessionStorage cache, and developer folders kept out of the published site.

const repo = (over = {}) => ({ name: "good-repo", html_url: "https://github.com/Mirulfiz04/good-repo", language: "Dart", pushed_at: "2026-11-01T10:00:00Z", fork: false, description: "", ...over });
const stubRepos = (page, body) =>
  page.route("https://api.github.com/**", (route) => (body ? route.fulfill({ json: body }) : route.abort()));
const showRepos = (page) => page.evaluate(() => document.querySelector("#projects").scrollIntoView());

test.describe("Smooth scroll without GSAP", () => {
  test.skip(({ isMobile }) => isMobile, "wheel input is a desktop thing");

  test("wheel scrolling still moves the page when Lenis loads but GSAP does not", async ({ page }) => {
    // the CDNs are blocked by the fixtures, so GSAP is missing. This stand-in for Lenis, like the real one, swallows
    // the wheel event and only moves the page when raf() is called, which is what motion.js must keep doing every frame.
    await page.addInitScript(() => {
      window.Lenis = class {
        constructor() {
          this.velocity = 0;
          this.goal = 0;
          addEventListener("wheel", (e) => { e.preventDefault(); this.goal += e.deltaY; }, { passive: false });
        }
        raf() { scrollTo(0, Math.ceil(scrollY + (this.goal - scrollY) * 0.5)); }
        stop() {}
        start() {}
        scrollTo() {}
        on() {}
      };
    });
    await page.goto("/");
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, 800);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  });
});

test.describe("Guestbook without a form service", () => {
  test("opens an email draft but does not claim the review was sent", async ({ page, pageErrors }) => {
    await page.goto("/");
    await page.locator('label[for="r5"]').click();
    await page.fill('#rvForm [name="name"]', "Ada");
    await page.fill('#rvForm [name="comment"]', "Lovely portfolio, well done.");
    await page.locator('#rvForm [type="submit"]').click();

    const msg = page.locator("#rvMsg");
    await expect(msg).toContainText(/email draft/i);
    await expect(msg).toContainText(/nothing has been sent/i);
    await expect(msg).not.toContainText(/thank you/i);
    await expect(page.locator('#rvForm [name="comment"]')).toHaveValue("Lovely portfolio, well done.");
    await expect(page.locator('#rvForm [name="name"]')).toHaveValue("Ada");
    expect(await page.evaluate(() => localStorage.getItem("badges") || "")).not.toContain("review");
    expect(pageErrors).toEqual([]);
  });
});

test.describe("GitHub repo cards", () => {
  test("repo data is escaped before it goes into the page", async ({ page }) => {
    await stubRepos(page, [repo({
      name: "evil",
      html_url: 'https://github.com/x/y" onmouseover="window.__pwn=1" data-x="',
      language: '<img src=x onerror="window.__pwn=1">'
    })]);
    await page.goto("/");
    await showRepos(page);
    const link = page.locator("#ghList a").first();
    await expect(link).toBeAttached();
    expect(await link.getAttribute("onmouseover")).toBeNull();
    await expect(page.locator("#ghList img")).toHaveCount(0);
    await expect(link).toContainText('<img src=x onerror="window.__pwn=1">');
    expect(await page.evaluate(() => window.__pwn)).toBeUndefined();
  });
});

test.describe("Cached GitHub repos", () => {
  const cache = (page, value) => page.addInitScript((v) => sessionStorage.setItem("gh-repos", v), value);

  test("a cache that is not a list of repos is ignored and refetched", async ({ page }) => {
    await cache(page, '{"oops":1}');
    await stubRepos(page, [repo()]);
    await page.goto("/");
    await showRepos(page);
    await expect(page.locator("#ghList li").first()).toContainText("good-repo");
  });

  test("a cached entry with a javascript: link is ignored and refetched", async ({ page }) => {
    await cache(page, JSON.stringify([repo({ name: "evil", html_url: "javascript:window.__pwn=1" })]));
    await stubRepos(page, [repo()]);
    await page.goto("/");
    await showRepos(page);
    await expect(page.locator("#ghList li").first()).toContainText("good-repo");
    await expect(page.locator('#ghList a[href^="javascript:"]')).toHaveCount(0);
  });

  test("a good cache is still used without asking GitHub again", async ({ page }) => {
    await cache(page, JSON.stringify([repo({ name: "from-cache" })]));
    await stubRepos(page, null); // any request to the API fails, so only the cache can fill the list
    await page.goto("/");
    await showRepos(page);
    await expect(page.locator("#ghList li").first()).toContainText("from-cache");
  });
});

test.describe("Published files", () => {
  test("docs and backend are kept out of the published site", () => {
    expect(excludedPaths(process.cwd())).toEqual(expect.arrayContaining(["docs", "backend"]));
  });
});
