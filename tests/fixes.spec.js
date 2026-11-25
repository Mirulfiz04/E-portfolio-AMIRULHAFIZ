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

test.describe("Guestbook sort", () => {
  const review = (n) => ({ name: `Visitor ${n}`, comment: "Nice portfolio, thank you.", rating: n, date: `2026-0${n}-01` });
  const visibleProjects = (page) => page.locator(".p-card:not([hidden])").count();

  test("is not shown while there are fewer than 2 reviews (the real reviews.json is empty)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#rvList .empty")).toBeAttached();
    await expect(page.locator(".rv-sort")).toBeHidden();
  });

  test("sorting reviews leaves every project visible and the project filter alone", async ({ page }) => {
    await page.route("**/reviews.json", (route) => route.fulfill({ json: [review(1), review(2)] }));
    await page.goto("/");
    const total = await page.locator(".p-card").count();
    expect(total).toBeGreaterThan(1);
    await expect(page.locator(".rv-sort")).toBeVisible();

    await page.locator('.rv-sort [data-sort="top"]').click();
    await expect(page.locator('.rv-sort [data-sort="top"]')).toHaveAttribute("aria-pressed", "true");
    expect(await visibleProjects(page)).toBe(total);
    await expect(page.locator('.proj-head [data-filter="all"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.proj-head .chip[aria-pressed="true"]')).toHaveCount(1);
  });

  test("the project chips still filter the projects", async ({ page }) => {
    await page.goto("/");
    const total = await page.locator(".p-card").count();
    await page.locator('.proj-head [data-filter="web"]').click();
    await expect(page.locator('.proj-head [data-filter="web"]')).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => visibleProjects(page)).toBeLessThan(total); // the filter may animate through a view transition
    expect(await visibleProjects(page)).toBeGreaterThan(0);
    await page.locator('.proj-head [data-filter="all"]').click();
    await expect.poll(() => visibleProjects(page)).toBe(total);
  });
});

test.describe("Published files", () => {
  test("docs and backend are kept out of the published site", () => {
    expect(excludedPaths(process.cwd())).toEqual(expect.arrayContaining(["docs", "backend"]));
  });
});

test.describe("Menu on a landscape phone (B-01)", () => {
  test.skip(({ isMobile }) => isMobile, "sets its own viewport sizes");
  for (const [width, height] of [[844, 390], [740, 360]]) {
    test(`the open menu fits ${width}x${height} and scrolls to its last link`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.locator(".menu-btn").click();
      const nav = page.locator("#nav");
      await expect(nav).toHaveClass(/open/);
      await nav.evaluate((n) => Promise.all(n.getAnimations().map((a) => a.finished))); // the menu slides in; measure it at rest
      const box = await nav.evaluate((n) => ({ bottom: n.getBoundingClientRect().bottom, scrolls: n.scrollHeight > n.clientHeight }));
      expect(box.bottom).toBeLessThanOrEqual(height);
      expect(box.scrolls).toBe(true); // still the full list, now reachable by scrolling it
      await nav.evaluate((n) => n.scrollTo(0, n.scrollHeight));
      await expect(page.locator("#nav a").last()).toBeInViewport({ ratio: 1 });
      await expect(nav).toHaveAttribute("data-lenis-prevent", ""); // smooth scroll must leave the menu's own scrolling alone
    });
  }
});

test.describe("Redirect stubs (B-03)", () => {
  for (const stub of ["about", "academic", "contact", "qualities", "works"]) {
    test(`${stub}.html has an absolute canonical without a fragment`, async ({ request }) => {
      const html = await (await request.get(`/${stub}.html`)).text();
      const href = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
      expect(href).toBe("https://mirulfiz04.github.io/E-portfolio-AMIRULHAFIZ/");
      expect(html).toContain("url=index.html#"); // the visitor is still sent to the right section
    });
  }
});

test.describe("Typing headline (B-13)", () => {
  test("keeps one height for every greeting and role, so the page below never jumps", async ({ page }) => {
    await page.goto("/");
    await page.addStyleTag({ content: ".hero h1 { letter-spacing: 0.04em }" }); // stands in for a wider fallback font
    for (const width of [321, 320, 360, 389, 390, 430, 480, 540, 599, 600, 680, 760, 820, 960, 961, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForFunction((w) => innerWidth === w, width);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); // WebKit resizes asynchronously
      const heights = await page.evaluate(() => {
        /* global hellos, roles */
        const h1 = document.querySelector(".hero h1"), type = document.querySelector("#type"), hello = document.querySelector("#hello");
        const seen = new Set();
        for (const [word] of hellos) for (const role of roles) for (let i = 0; i <= role.length; i++) {
          hello.textContent = word; type.textContent = role.slice(0, i);
          seen.add(Math.round(h1.getBoundingClientRect().height));
        }
        return [...seen];
      });
      expect(heights, `${width}px`).toHaveLength(1);
    }
  });
});
