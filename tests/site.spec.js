import { test, expect } from "./fixtures.js";

// Which issue each group guards: Proof folders -> #2, skill logos -> #3, playful skills -> #4, Download CV -> #7.

const folderGeometry = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".folder")].map((f) => {
      const box = f.getBoundingClientRect();
      const photoBottom = Math.max(...[...f.querySelectorAll(".f-peek img")].map((i) => i.getBoundingClientRect().bottom - box.top));
      return { height: box.height, width: box.width, photoBottom, frontWidth: f.querySelector(".f-front").getBoundingClientRect().width };
    })
  );

test.describe("Page basics", () => {
  test("loads without script errors", async ({ page, pageErrors }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Amirul Hafiz/);
    await expect(page.locator(".folder").first()).toBeAttached();
    await expect(page.locator(".skill-group li").first()).toBeAttached();
    expect(pageErrors).toEqual([]);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("the 404 page is served for unknown URLs", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res.status()).toBe(404);
  });
});

test.describe("Proof folders (#2)", () => {
  test("photos stay inside their folder and never cover the next one", async ({ page }) => {
    await page.goto("/");
    for (const g of await folderGeometry(page)) expect(g.photoBottom).toBeLessThanOrEqual(g.height);
  });

  test("photos stay inside at every phone and desktop width", async ({ page, isMobile }) => {
    test.skip(isMobile, "resizes the viewport itself, so one project is enough");
    await page.goto("/");
    for (const width of [320, 390, 430, 600, 740, 761, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const g of await folderGeometry(page)) expect(g.photoBottom, `viewport ${width}px`).toBeLessThanOrEqual(g.height);
    }
  });

  test("a tap opens one folder, tilts it only slightly and leaves the others flush", async ({ page, press, isMobile }) => {
    test.skip(!isMobile, "touch behaviour");
    await page.goto("/");
    const folders = page.locator(".folder");
    await press(folders.nth(0));
    await press(folders.nth(1));
    await expect(folders.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(folders.nth(0)).toHaveAttribute("aria-expanded", "false");
    const extraWidth = async (i) => {
      const g = (await folderGeometry(page))[i];
      return Math.abs(g.frontWidth - g.width);
    };
    // the tilt eases back over 0.45s, so wait for it to settle instead of measuring mid-animation
    await expect.poll(() => extraWidth(0)).toBeLessThan(0.5); // closed: no leftover tilt
    await expect.poll(() => extraWidth(2)).toBeLessThan(0.5); // never touched
    await expect // wait until the opened folder has finished tilting, then check its final size
      .poll(async () => {
        const before = await extraWidth(1);
        await page.waitForTimeout(100);
        return Math.abs(before - (await extraWidth(1))) < 0.05;
      })
      .toBe(true);
    expect(await extraWidth(1)).toBeLessThan(8); // opened tilt stays within the page margin (it was 16px before the fix)
  });

  test("opening a folder lists every file it promises", async ({ page, press }) => {
    await page.goto("/");
    const folder = page.locator(".folder").first();
    const promised = Number((await folder.locator("small").innerText()).match(/\d+/)[0]);
    await press(folder);
    await expect(page.locator("#foldBody")).toBeVisible();
    await expect(page.locator("#foldBody .f-item, #foldBody .f-doc")).toHaveCount(promised);
  });
});

test.describe("Skills (#3, #4)", () => {
  test("every skill has a logo and every logo loads", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.querySelectorAll(".sk-ico").forEach((i) => (i.loading = "eager")));
    const pills = await page.locator(".skill-group li").count();
    expect(pills).toBeGreaterThan(0);
    await expect(page.locator(".skill-group li .sk-ico")).toHaveCount(pills);
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll(".sk-ico")].filter((i) => !i.complete || i.naturalWidth === 0).length))
      .toBe(0);
  });

  test("tapping a skill selects it and shows its logo and projects", async ({ page, press }) => {
    await page.goto("/");
    const flutter = page.locator(".skill-group li", { hasText: "Flutter" });
    await press(flutter);
    await expect(flutter).toHaveClass(/\bon\b/);
    await expect(page.locator("#skillInfo")).toContainText(/Flutter shows up in \d+ projects?/);
    await expect(page.locator("#skillInfo .si-ico img")).toBeVisible();
  });

  test("a skill can be selected from the keyboard", async ({ page }) => {
    await page.goto("/");
    const dart = page.locator(".skill-group li", { hasText: "Dart" });
    await dart.focus();
    await page.keyboard.press("Enter");
    await expect(dart).toHaveClass(/\bon\b/);
  });

  test("Surprise me picks one skill and says what it found", async ({ page, press }) => {
    await page.goto("/");
    await press(page.locator("#skillRoll"));
    await expect(page.locator(".skill-group li.on")).toHaveCount(1);
    await expect(page.locator("#toast")).toContainText("🎲");
  });

  test("a tap sets off sparkles that clean up after themselves", async ({ page, press }) => {
    await page.goto("/");
    const layer = page.locator('body > div[aria-hidden="true"][style*="z-index: 96"]');
    await press(page.locator(".skill-group li", { hasText: "Python" }));
    await expect(layer).toHaveCount(1);
    await expect(layer).toHaveCount(0, { timeout: 3000 });
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("no sparkles are created", async ({ page, press }) => {
      await page.goto("/");
      await press(page.locator(".skill-group li", { hasText: "Python" }));
      await expect(page.locator("#skillInfo")).toContainText("Python");
      await expect(page.locator('body > div[aria-hidden="true"][style*="z-index: 96"]')).toHaveCount(0);
    });

    test("tapping five different skills unlocks the Toolbox tourist badge", async ({ page, press }) => {
      await page.goto("/");
      const pills = page.locator(".skill-group li");
      for (let i = 0; i < 5; i++) await press(pills.nth(i));
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("badges") || "[]"))).toContain("toolbox");
      await expect(page.locator("#trophyCount")).toHaveText(/^\d+\/\d+$/);
    });
  });

  test("logos are left out of the printed CV", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    expect(await page.locator(".sk-ico").first().evaluate((el) => getComputedStyle(el).display)).toBe("none");
    expect(await page.locator(".sk-sticker").first().evaluate((el) => getComputedStyle(el).display)).toBe("none");
  });
});

test.describe("Download CV (#7)", () => {
  test("opens the browser's real print dialog instead of the terminal helper", async ({ page }) => {
    await page.goto("/");
    // the terminal's own helper must never replace the browser's window.print
    expect(await page.evaluate(() => /\[native code\]/.test(Function.prototype.toString.call(window.print)))).toBe(true);
    await page.evaluate(() => {
      window.__printCalls = 0;
      window.print = () => { window.__printCalls++; };
    });
    const terminalLines = await page.locator("#termOut > *").count();
    await page.locator("[data-print-cv]").last().click();
    await expect.poll(() => page.evaluate(() => window.__printCalls)).toBe(1);
    expect(await page.locator("#termOut > *").count()).toBe(terminalLines); // no stray "undefined" line
  });
});

test.describe("Dialogs and terminal", () => {
  test("the terminal opens, answers a command and closes with the X button", async ({ page, press }) => {
    await page.goto("/");
    await press(page.locator("[data-open-term]").first());
    await expect(page.locator("#term")).toHaveAttribute("open", "");
    await expect(page.locator("#termOut")).toContainText("Welcome to amirul.sh");
    await page.locator("#termInput").fill("skills");
    await page.keyboard.press("Enter");
    await expect(page.locator("#termOut")).toContainText("languages");
    await press(page.locator("#term .close"));
    await expect(page.locator("#term")).not.toHaveAttribute("open", "");
  });

  test("the achievements dialog opens and closes with the X button", async ({ page, press }) => {
    await page.goto("/");
    await press(page.locator("#trophy"));
    await expect(page.locator("#badges")).toHaveAttribute("open", "");
    await press(page.locator("#badges .close"));
    await expect(page.locator("#badges")).not.toHaveAttribute("open", "");
  });

  test("a project opens in a dialog that closes with the X button", async ({ page, press }) => {
    await page.goto("/");
    await press(page.locator(".p-more").first());
    await expect(page.locator("#projectModal")).toHaveAttribute("open", "");
    await press(page.locator("#projectModal .close"));
    await expect(page.locator("#projectModal")).not.toHaveAttribute("open", "");
  });
});
