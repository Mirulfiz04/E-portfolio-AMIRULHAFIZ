import { test, expect } from "./fixtures.js";

// Proof folders and the [hidden] attribute (QA bugs B-05, B-06, B-08, B-09; QA's own versions are in tests/qa-folders.spec.js on test/cross-device).
// These set their own viewport, so one project is enough.
test.describe.configure({ mode: "parallel" });
test.skip(({ isMobile }) => isMobile, "sets its own viewport sizes");

const folder = (page, i) => page.locator(".folder").nth(i);
const files = (page) => page.locator("#foldBody");

async function ready(page, w, h = 900) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto("/");
  await page.evaluate(() => document.querySelector("#folders").scrollIntoView({ block: "center" }));
  await expect(page.locator("#folders")).toHaveClass(/\bin\b/); // .reveal keeps the folders 24px low until then
}
// folders tilt and slide when opened: judge positions only once two reads agree
async function geometry(page, i) {
  const read = () => page.evaluate((i) => {
    const y = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY }; };
    const all = [...document.querySelectorAll(".folder")].map(y);
    return { tapped: all[i], next: all[i + 1] ?? null, panel: y(document.querySelector("#foldBody")), rowBottom: Math.max(...all.map((f) => f.bottom)) };
  }, i);
  let last = JSON.stringify(await read());
  for (let n = 0; n < 30; n++) {
    await page.waitForTimeout(100);
    const now = JSON.stringify(await read());
    if (now === last) break;
    last = now;
  }
  return JSON.parse(last);
}

for (const w of [320, 390, 430, 760, 761, 1280]) {
  const one = w <= 760;
  test.describe(`B-05 panel position at ${w}px`, () => {
    for (const i of [0, 1, 2]) {
      test(`folder ${i + 1}: its files come ${one ? "right after it, above the next folder" : "under the whole row"}`, async ({ page }) => {
        await ready(page, w);
        await folder(page, i).click();
        await expect(files(page).locator("> *").first()).toBeVisible();
        const g = await geometry(page, i);
        expect(g.panel.top).toBeGreaterThanOrEqual(g.tapped.bottom - 1);
        if (one) {
          expect(await folder(page, i).evaluate((f) => f.nextElementSibling.id)).toBe("foldBody"); // DOM order too, so Tab reaches the files next
          if (g.next) expect(g.panel.bottom).toBeLessThanOrEqual(g.next.top + 1);
          expect(g.panel.top - g.tapped.bottom).toBeLessThan(40); // was 370 / 196 / 22px
        } else {
          expect(await files(page).evaluate((p) => p.previousElementSibling.id)).toBe("folders");
          expect(g.panel.top).toBeGreaterThanOrEqual(g.rowBottom - 1);
          expect(g.panel.top - g.rowBottom).toBeLessThan(40);
        }
      });
    }
  });
}

test.describe("B-05 behaviour on one column", () => {
  test("Enter on a folder, then Tab, lands on one of its files", async ({ page }) => {
    await ready(page, 390);
    await folder(page, 0).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement.closest("#foldBody"))).toBe(true);
  });

  test("switching folders moves the panel and the expanded mark, and keeps focus on the pressed folder", async ({ page }) => {
    await ready(page, 390);
    await folder(page, 0).click();
    const first = await files(page).locator(".f-item, .f-doc").first().innerText();
    await folder(page, 2).click();
    await expect(folder(page, 2)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('.folder[aria-expanded="true"]')).toHaveCount(1);
    expect(await folder(page, 2).evaluate((f) => f.nextElementSibling.id)).toBe("foldBody");
    expect(await files(page).locator(".f-item, .f-doc").first().innerText()).not.toBe(first);
    await expect(folder(page, 2)).toBeFocused();
    await expect(files(page)).toHaveAttribute("aria-live", "polite");
    await expect(folder(page, 2)).toHaveAttribute("aria-controls", "foldBody");
  });

  test("closing hides the files and leaves focus on the folder", async ({ page }) => {
    await ready(page, 390);
    await folder(page, 1).click();
    await folder(page, 1).click();
    await expect(folder(page, 1)).toHaveAttribute("aria-expanded", "false");
    await expect(files(page)).toBeHidden();
    await expect(folder(page, 1)).toBeFocused();
  });

  test("resizing across 760px moves the panel with the open folder and keeps focus inside it", async ({ page }) => {
    await ready(page, 390);
    await folder(page, 1).click();
    const item = files(page).locator(".f-item").first();
    await item.focus();
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect.poll(() => files(page).evaluate((p) => p.previousElementSibling.id)).toBe("folders"); // the media query fires a moment after the resize
    await expect(files(page)).toBeVisible();
    await expect(folder(page, 1)).toHaveAttribute("aria-expanded", "true");
    await expect(item).toBeFocused();
    await page.setViewportSize({ width: 390, height: 900 });
    await expect.poll(() => folder(page, 1).evaluate((f) => f.nextElementSibling.id)).toBe("foldBody");
    await expect(files(page)).toBeVisible();
    await expect(item).toBeFocused();
  });

  test("the CV print layout still leaves the proof section out", async ({ page }) => {
    await ready(page, 390);
    await folder(page, 0).click();
    await page.emulateMedia({ media: "print" });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("#evidence")).display)).toBe("none");
  });
});

test.describe("B-06 / B-08 the hidden attribute", () => {
  for (const [name, w, h] of [["phone", 390, 844], ["desktop", 1280, 800]]) {
    test(`a closed folder shows no files (${name})`, async ({ page }) => {
      await ready(page, w, h);
      await expect(files(page)).toBeHidden(); // before any folder is opened
      await folder(page, 0).click();
      await expect(files(page)).toBeVisible();
      await folder(page, 0).click();
      await expect(files(page)).toBeHidden();
      expect(await files(page).evaluate((p) => p.getBoundingClientRect().height)).toBe(0);
    });

    test(`nothing with [hidden] is still displayed (${name})`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.waitForTimeout(800); // the visit counter (blocked here) and reviews.json have settled
      const leaks = await page.evaluate(() => [...document.querySelectorAll("[hidden]")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.id || e.className));
      expect(leaks).toEqual([]);
    });
  }

  test("the visits tile disappears when the counter cannot be reached", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".rv-stat").filter({ has: page.locator("#visits") })).toBeHidden();
  });

  test("print still shows every project whatever filter is on, and the lesson button keeps working on a phone", async ({ page }) => {
    await ready(page, 390);
    await page.locator('.proj-head [data-filter="web"]').click();
    await page.emulateMedia({ media: "print" });
    expect(await page.locator(".p-card").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").length)).toBe(9);
    await page.emulateMedia({ media: "screen" });
    await expect(page.locator(".more-lessons")).toBeVisible(); // shown on phones while lessons are folded, kept by :not([hidden])
  });
});

test.describe("B-09 folder icons", () => {
  for (const w of [320, 390, 430, 760, 761, 1024, 1280]) {
    test(`the icon sits inside the front panel at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto("/");
      await page.addStyleTag({ content: ".f-front { letter-spacing: 0.12em }" }); // stands in for a wider fallback font
      const over = await page.evaluate(() => [...document.querySelectorAll(".folder")].map((f) => f.querySelector(".f-front").getBoundingClientRect().top - f.querySelector(".f-ico").getBoundingClientRect().top).filter((d) => d > 0.5));
      expect(over).toEqual([]);
    });
  }
});
