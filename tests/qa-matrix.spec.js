import { test, expect } from "./fixtures.js";

// Cross-device QA matrix (see docs/qa/test-plan.md). Chromium emulation only: it is NOT a real iPhone/Android.
// The shared fixture blocks all third-party requests, so this covers the "site works without its CDNs" path;
// qa-motion.spec.js covers the animated path with the real GSAP/Lenis.

const DEVICES = [
  { name: "laptop 1366x768", w: 1366, h: 768 },
  { name: "laptop 1440x900", w: 1440, h: 900 },
  { name: "desktop 1920x1080", w: 1920, h: 1080 },
  { name: "tablet portrait 768x1024", w: 768, h: 1024, touch: true },
  { name: "tablet landscape 1024x768", w: 1024, h: 768, touch: true },
  { name: "phone 320x640", w: 320, h: 640, touch: true },
  { name: "phone 360x740", w: 360, h: 740, touch: true },
  { name: "phone 390x844", w: 390, h: 844, touch: true },
  { name: "phone 430x932", w: 430, h: 932, touch: true },
  { name: "phone landscape 844x390", w: 844, h: 390, touch: true },
  { name: "phone landscape 740x360", w: 740, h: 360, touch: true }
];
const MENU_BREAKPOINT = 1080; // css/style.css: the nav collapses into the menu button at <= 1080px

for (const d of DEVICES) {
  test.describe(d.name, () => {
    test.use({ viewport: { width: d.w, height: d.h }, hasTouch: !!d.touch, isMobile: !!d.touch && d.w < 700 });

    test("loads cleanly and never scrolls sideways, even at the bottom of the page", async ({ page, pageErrors }, testInfo) => {
      await page.goto("/");
      await page.waitForLoadState("load");
      const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(await overflow()).toBeLessThanOrEqual(0);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      expect(await overflow()).toBeLessThanOrEqual(0);
      expect(pageErrors).toEqual([]);
      // full-page picture for a human to eyeball; Playwright cannot judge "looks right"
      await testInfo.attach("full-page", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    });

    test("navigation: links on wide screens, a working menu on narrow ones", async ({ page }) => {
      await page.goto("/");
      const menu = page.locator("#menuBtn");
      if (d.w <= MENU_BREAKPOINT) {
        await expect(menu).toBeVisible();
        await expect(page.locator("#nav")).toBeHidden();
        await menu.click();
        await expect(menu).toHaveAttribute("aria-expanded", "true");
        await expect(page.locator("#nav a").first()).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(menu).toHaveAttribute("aria-expanded", "false");
        await menu.click();
      } else {
        await expect(menu).toBeHidden();
        await expect(page.locator("#nav a").first()).toBeVisible();
      }
      const link = page.locator("#nav a[href='#contact']");
      await link.scrollIntoViewIfNeeded(); // on a short screen the menu itself scrolls (B-01)
      await link.click();
      await expect.poll(() => page.evaluate(() => document.querySelector("#contact").getBoundingClientRect().top)).toBeLessThan(d.h * 0.6);
    });

    test("the open menu fits on screen, or scrolls, so every link can be reached", async ({ page }) => {
      test.skip(d.w > MENU_BREAKPOINT, "no menu button on wide screens");
      await page.goto("/");
      await page.locator("#menuBtn").click();
      const reachable = await page.evaluate(() => {
        const nav = document.querySelector("#nav");
        const last = [...nav.querySelectorAll("a")].at(-1).getBoundingClientRect();
        const scrolls = ["auto", "scroll"].includes(getComputedStyle(nav).overflowY) && nav.scrollHeight > nav.clientHeight;
        return last.bottom <= window.innerHeight || scrolls;
      });
      expect(reachable).toBe(true);
    });

    if (d.h < 480) {
      // B-01 fix: the menu is capped to the screen and scrolls; check a real touch swipe, not just the CSS
      test("a touch swipe scrolls the open menu to Contact and the page behind stays put", async ({ page }) => {
        await page.goto("/");
        await page.locator("#menuBtn").tap();
        const nav = page.locator("#nav");
        await expect(nav).toBeVisible();
        const box = await nav.boundingBox();
        const cdp = await page.context().newCDPSession(page);
        // raw touch events: Input.synthesizeScrollGesture does nothing in this headless setup, real touch events scroll as a finger would
        const x = box.x + box.width / 2, y0 = box.y + box.height - 40, y1 = box.y + 40;
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
        for (let i = 1; i <= 12; i++) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / 12 }] });
          await page.waitForTimeout(16);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await expect.poll(() => nav.evaluate((el) => el.scrollTop)).toBeGreaterThan(20);
        expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
        const contact = page.locator("#nav a[href='#contact']");
        await expect(contact).toBeInViewport();
        await contact.tap();
        await expect.poll(() => page.evaluate(() => document.querySelector("#contact").getBoundingClientRect().top)).toBeLessThan(d.h * 0.6);
      });
    }

    test("header buttons are big enough to hit (WCAG 2.2 target size, 24px minimum)", async ({ page }) => {
      await page.goto("/");
      const small = await page.evaluate(() =>
        [...document.querySelectorAll(".topbar button, .topbar a")]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({ el: el.id || el.className || el.textContent.trim(), ...(({ width, height }) => ({ width, height }))(el.getBoundingClientRect()) }))
          .filter((b) => b.width < 24 || b.height < 24)
      );
      expect(small).toEqual([]);
    });

    test("body text stays readable (no tiny text on this screen)", async ({ page }) => {
      await page.goto("/");
      const size = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".lead")).fontSize));
      expect(size).toBeGreaterThanOrEqual(15);
    });
  });
}

test.describe("Themes", () => {
  for (const scheme of ["light", "dark"]) {
    test(`first visit follows the system (${scheme}) and every page text is readable`, async ({ page, pageErrors }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const contrast = await page.evaluate(() => {
        const parse = (c) => c.match(/[\d.]+/g).map(Number);
        const lum = ([r, g, b]) => [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        const bg = parse(getComputedStyle(document.body).backgroundColor);
        const ratio = (sel) => {
          const fg = parse(getComputedStyle(document.querySelector(sel)).color);
          const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
          return (a + 0.05) / (b + 0.05);
        };
        return { body: ratio("body"), lead: ratio(".lead"), muted: ratio(".muted") };
      });
      expect(contrast.body, "body text").toBeGreaterThanOrEqual(4.5);
      expect(contrast.lead, ".lead").toBeGreaterThanOrEqual(4.5);
      expect(contrast.muted, ".muted").toBeGreaterThanOrEqual(4.5);
      expect(pageErrors).toEqual([]);
    });
  }

  test("the toggle flips the theme and the choice survives a reload", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const before = await bg();
    await page.locator("#themeBtn").click();
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBeTruthy();
    await expect.poll(bg).not.toBe(before); // the colour eases over, so wait for it
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
  });
});

test.describe("Keyboard only", () => {
  test("the skip link is the first stop and jumps to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#main");
  });

  test("tabbing through the header never loses focus and always shows where it is", async ({ page }) => {
    await page.goto("/");
    const problems = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        const s = getComputedStyle(el);
        const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
        return { tag: el.tagName, id: el.id || el.className, ring };
      });
      if (info.tag === "BODY") problems.push(`focus fell to <body> after ${i + 1} tabs`);
      else if (!info.ring) problems.push(`no visible focus ring on ${info.tag} ${info.id}`);
    }
    expect(problems).toEqual([]);
  });

  test("the terminal opens from the keyboard, Escape closes it and focus goes back", async ({ page }) => {
    await page.goto("/");
    const opener = page.locator("#termBtn");
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#term")).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(page.locator("#term")).not.toHaveAttribute("open", "");
    await expect(opener).toBeFocused();
  });
});

test.describe("Print CV", () => {
  test("the printed page drops the site chrome and shows the CV header", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    const shown = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).display !== "none");
    expect(await shown(".print-head")).toBe(true);
    expect(await shown(".topbar")).toBe(false);
    expect(await shown("#trophy")).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});

test.describe("Reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("nothing keeps animating forever and the page still loads", async ({ page, pageErrors }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    const endless = await page.evaluate(() =>
      document.getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations === Infinity && a.playState === "running")
        .map((a) => a.effect.target?.className || a.effect.target?.tagName)
    );
    expect(endless).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});

// about/academic/contact/qualities/works.html are old-URL stubs: a meta refresh to a section of index.html
test.describe("Old page URLs still land on the right section", () => {
  const stubs = { "about.html": "about", "academic.html": "academic", "contact.html": "contact", "qualities.html": "qualities", "works.html": "works" };
  for (const [file] of Object.entries(stubs)) {
    test(`${file} redirects into index.html on a phone and a laptop`, async ({ page, pageErrors }) => {
      for (const [w, h] of [[360, 740], [1366, 768]]) {
        await page.setViewportSize({ width: w, height: h });
        const res = await page.goto("/" + file);
        expect(res.status()).toBe(200);
        await page.waitForURL(/index\.html#\w+/);
        const target = new URL(page.url()).hash.slice(1);
        await expect(page.locator("#" + target), `${file} -> #${target} must exist on index.html`).toBeAttached();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${file} at ${w}px`).toBe(true);
      }
      expect(pageErrors).toEqual([]);
    });
  }
});
