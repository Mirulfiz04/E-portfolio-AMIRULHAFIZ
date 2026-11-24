import { test, expect } from "./fixtures.js";

// Proof folders, the `hidden` attribute and the guestbook sort chips.
// Tests tagged B-0x are EXPECTED FAILURES (test.fail): they pass while the bug exists and go red when it is fixed.
// To see them fail today, delete the test.fail line.

const measure = (page, i) =>
  page.evaluate((i) => {
    const y = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY }; };
    const folders = [...document.querySelectorAll(".folder")].map(y);
    const panel = y(document.querySelector("#foldBody"));
    return { tapped: folders[i], next: folders[i + 1] ?? null, panel, maxFolderBottom: Math.max(...folders.map((f) => f.bottom)) };
  }, i);

// The folders slide in (.reveal) and tilt when opened, so wait until two reads 100ms apart agree before judging positions.
async function geometry(page, i) {
  let last = JSON.stringify(await measure(page, i));
  for (let n = 0; n < 30; n++) {
    await page.waitForTimeout(100);
    const now = JSON.stringify(await measure(page, i));
    if (now === last) return JSON.parse(now);
    last = now;
  }
  return JSON.parse(last);
}

// Single column at <= 760px (css/style.css), three columns from 761px.
for (const w of [320, 390, 430, 760, 761, 1280]) {
  const oneColumn = w <= 760;
  test.describe(`Folder panel position at ${w}px`, () => {
    test.use({ viewport: { width: w, height: 900 }, hasTouch: oneColumn, isMobile: oneColumn && w < 700 });

    for (const i of [0, 1, 2]) {
      test(`folder ${i + 1}: its files appear right below it, above the next folder`, async ({ page, press }) => {
        // B-05 (fixed in bb08f34): the shared #foldBody used to sit after the LAST folder, so on one column folders 1 and 2 opened far below them
        await page.goto("/");
        const folder = page.locator(".folder").nth(i);
        // .reveal keeps #folders 24px low until it has scrolled well into view; measure only after that
        await page.evaluate(() => document.querySelector("#folders").scrollIntoView({ block: "center" }));
        await expect(page.locator("#folders")).toHaveClass(/\bin\b/);
        await press(folder);
        await expect(page.locator("#foldBody > *").first()).toBeVisible();
        const g = await geometry(page, i);
        expect(g.panel.top, "panel starts below the tapped folder").toBeGreaterThanOrEqual(g.tapped.bottom - 1);
        if (oneColumn && g.next) expect(g.panel.bottom, "panel ends above the next folder").toBeLessThanOrEqual(g.next.top + 1);
        if (!oneColumn) expect(g.panel.top, "three columns: below the whole row").toBeGreaterThanOrEqual(g.maxFolderBottom - 1);
      });
    }
  });
}

test.describe("Folder state", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("opening one folder marks exactly one expanded, and switching moves the mark", async ({ page, press }) => {
    await page.goto("/");
    const f = page.locator(".folder");
    await press(f.nth(0));
    await expect(f.nth(0)).toHaveAttribute("aria-expanded", "true");
    await press(f.nth(1));
    await expect(f.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(f.nth(0)).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('.folder[aria-expanded="true"]')).toHaveCount(1);
  });

  test("closing a folder hides its files", async ({ page, press }) => {
    // B-06 (fixed in bb08f34): foldBody.hidden = true used to be overridden by `.fold-body { display: grid }`, so the files stayed on screen
    await page.goto("/");
    const f = page.locator(".folder").first();
    await press(f);
    await press(f);
    await expect(f).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#foldBody > *").first()).toBeHidden();
  });

  test("the open folder looks open (photos lifted)", async ({ page, press }) => {
    await page.goto("/");
    const f = page.locator(".folder").nth(1);
    await press(f);
    await expect.poll(() => f.locator(".f-peek img").first().evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42)).toBeLessThan(-10);
  });

  test("folder icons sit inside the front panel, not over its top edge", async ({ page }) => {
    // B-09 (cosmetic, fixed in bb08f34): at phone width the emoji box used to start ~5px above the front panel's top edge
    await page.goto("/");
    const over = await page.evaluate(() =>
      [...document.querySelectorAll(".folder")].map((f) => f.querySelector(".f-front").getBoundingClientRect().top - f.querySelector(".f-ico").getBoundingClientRect().top).filter((d) => d > 0.5)
    );
    expect(over).toEqual([]);
  });

  test("keyboard: after Enter on a folder the next Tab stop is one of its files", async ({ page }) => {
    // B-05 again (fixed in bb08f34): the panel used to be after the last folder, so Tab went to the next folder first
    await page.goto("/");
    await page.locator(".folder").first().focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement.closest("#foldBody"))).toBe(true);
  });
});

test.describe("The hidden attribute", () => {
  for (const [name, vp] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 800 }]]) {
    test(`every element with [hidden] is really hidden (${name})`, async ({ page }) => {
      // B-06/B-07/B-08 (fixed: .rv-sort in b4873c0, the rest by the global `[hidden] { display: none !important }` in bb08f34):
      // author CSS `display` used to beat the UA's [hidden] rule.
      await page.setViewportSize(vp);
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.waitForTimeout(800); // let the visit counter and reviews.json settle
      const leaks = await page.evaluate(() => [...document.querySelectorAll("[hidden]")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.id || e.className));
      expect(leaks).toEqual([]);
    });
  }
});

test.describe("Guestbook sort chips and project filter", () => {
  const reviews = (n) => JSON.stringify(Array.from({ length: n }, (_, k) => ({ name: `Tester ${k}`, comment: "Great work, thanks!", rating: 5 - k, date: `2026-11-0${k + 1}` })));

  for (const [name, vp] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 800 }]]) {
    test.describe(name, () => {
      test.use({ viewport: vp });

      test("with no reviews the sort chips are not shown", async ({ page }) => {
        await page.route("**/reviews.json", (r) => r.fulfill({ contentType: "application/json", body: "[]" }));
        await page.goto("/");
        await expect(page.locator("#rvList .empty")).toBeVisible();
        await expect(page.locator(".rv-sort")).toBeHidden();
      });

      test("sorting two reviews does not hide any project", async ({ page }) => {
        await page.route("**/reviews.json", (r) => r.fulfill({ contentType: "application/json", body: reviews(2) }));
        await page.goto("/");
        await expect(page.locator("#rvList li")).toHaveCount(2);
        const shown = () => page.locator(".p-card:not([hidden])").count();
        const before = await shown();
        expect(before).toBe(9);
        for (const chip of await page.locator(".rv-sort .chip").all()) await chip.click();
        expect(await shown()).toBe(before);
      });
    });
  }
});
