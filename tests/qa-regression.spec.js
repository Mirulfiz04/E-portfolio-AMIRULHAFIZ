import { test, expect } from "./fixtures.js";

// Regression checks for the folder fix (bb08f34) and for the global `[hidden] { display: none !important }` rule.
// Every element the HTML or JS hides is exercised in each state it can be in: visible when it should be, hidden when it should be.
// Needs no internet: third-party requests are blocked by the shared fixture; the APIs the page calls are stubbed per test.

const displayed = (locator) => locator.evaluate((el) => getComputedStyle(el).display !== "none" && el.getClientRects().length > 0);

// ---------------------------------------------------------------- proof folders
test.describe("Proof folders: switching, keyboard, resize, themes, print", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const folder = (page, i) => page.locator(".folder").nth(i);
  const promised = async (page, i) => Number((await folder(page, i).locator("small").innerText()).match(/\d+/)[0]);
  const panelAfter = (page) => page.evaluate(() => {
    const prev = document.querySelector("#foldBody").previousElementSibling;
    return prev.classList.contains("folder") ? [...document.querySelectorAll(".folder")].indexOf(prev) : prev.id;
  });

  test("tapping folders in any order: one open, its own files, the panel right after it (DOM and screen)", async ({ page, press }) => {
    await page.goto("/");
    for (const i of [0, 2, 1, 0, 1]) {
      await press(folder(page, i));
      await expect(folder(page, i)).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator('.folder[aria-expanded="true"]')).toHaveCount(1);
      await expect(page.locator("#foldBody > *")).toHaveCount(await promised(page, i));
      expect(await panelAfter(page), `after tapping folder ${i + 1}`).toBe(i);
      const gap = await page.evaluate((i) => {
        const f = document.querySelectorAll(".folder")[i].getBoundingClientRect(), p = document.querySelector("#foldBody").getBoundingClientRect();
        return Math.round(p.top - f.bottom);
      }, i);
      expect(gap, "gap under the tapped folder").toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThan(40);
    }
  });

  test("keyboard: Enter opens, Tab reaches the files, Shift+Tab returns, Tab past the files reaches the next folder", async ({ page }) => {
    await page.goto("/");
    await folder(page, 0).focus();
    await page.keyboard.press("Enter");
    await expect(folder(page, 0)).toBeFocused(); // opening must not steal focus
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement.closest("#foldBody") !== null)).toBe(true);
    await page.keyboard.press("Shift+Tab");
    await expect(folder(page, 0)).toBeFocused();
    const n = await promised(page, 0);
    for (let k = 0; k < n; k++) await page.keyboard.press("Tab"); // one Tab per file...
    expect(await page.evaluate(() => document.activeElement.closest("#foldBody") !== null), "on the last file").toBe(true);
    await page.keyboard.press("Tab"); // ...then the next folder
    await expect(folder(page, 1)).toBeFocused();
    await page.keyboard.press("Enter"); // switch to folder 2 from the keyboard
    await expect(folder(page, 1)).toHaveAttribute("aria-expanded", "true");
    expect(await panelAfter(page)).toBe(1);
    await expect(folder(page, 1)).toBeFocused();
  });

  test("keyboard: closing leaves nothing hidden in the Tab order", async ({ page }) => {
    await page.goto("/");
    await folder(page, 0).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter"); // close again
    await expect(folder(page, 0)).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Tab");
    await expect(folder(page, 1)).toBeFocused(); // the closed panel is skipped
  });

  test("resizing and rotating with a folder open keeps it open, with its files, in the right place; focus in the panel survives", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1280, height: 800 });
    await folder(page, 1).click();
    await expect(folder(page, 1)).toHaveAttribute("aria-expanded", "true");
    expect(await panelAfter(page)).toBe("folders"); // three columns: under the whole row
    const files = await promised(page, 1);
    for (const [w, h, expectAfter] of [[390, 844, 1], [844, 390, "folders"], [390, 844, 1], [760, 900, 1], [761, 900, "folders"], [1280, 800, "folders"]]) {
      await page.setViewportSize({ width: w, height: h });
      await expect(folder(page, 1), `${w}x${h}`).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("#foldBody > *")).toHaveCount(files);
      expect(await panelAfter(page), `${w}x${h}`).toBe(expectAfter);
      expect(await displayed(page.locator("#foldBody")), `${w}x${h} panel shown`).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${w}x${h} no sideways scroll`).toBe(true);
    }
    // focus inside the panel must survive the panel moving to another place in the DOM
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator("#foldBody > *").first().focus();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.activeElement.closest("#foldBody") !== null), "focus kept when the panel moved").toBe(true);
  });

  test("a closed folder stays closed across a resize and the panel stays hidden", async ({ page, press }) => {
    await page.goto("/");
    await press(folder(page, 0));
    await press(folder(page, 0));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await displayed(page.locator("#foldBody"))).toBe(false);
    await expect(page.locator('.folder[aria-expanded="true"]')).toHaveCount(0);
  });

  for (const scheme of ["light", "dark"]) {
    test(`${scheme} theme: open folder text and the open outline stay readable`, async ({ page, press }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await press(folder(page, 2)); // reports: has both a photo card and PDF links
      await expect(page.locator("#foldBody > *").first()).toBeVisible();
      const worst = await page.evaluate(() => {
        const rgba = (c) => {
          const nums = c.match(/-?[\d.]+/g).map(Number);
          return c.startsWith("color(") ? [nums[0] * 255, nums[1] * 255, nums[2] * 255, nums[3] ?? 1] : [nums[0], nums[1], nums[2], nums[3] ?? 1];
        };
        const over = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
        const bgOf = (el) => { // composite the backgrounds from the root down to the element
          const chain = []; for (let e = el; e; e = e.parentElement) chain.unshift(rgba(getComputedStyle(e).backgroundColor));
          return chain.reduce((acc, c) => (c[3] === 0 ? acc : over(c, acc)), [255, 255, 255, 1]);
        };
        const lum = ([r, g, b]) => [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (fg, bg) => { const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };
        const out = {};
        const text = (name, el) => { const bg = bgOf(el); out[name] = ratio(over(rgba(getComputedStyle(el).color), bg), bg); };
        const open = document.querySelector('.folder[aria-expanded="true"]');
        text("folder name", open.querySelector("b"));
        text("file count", open.querySelector("small"));
        text("PDF title", document.querySelector("#foldBody .f-doc b"));
        text("PDF sub", document.querySelector("#foldBody .f-doc small"));
        text("photo caption", document.querySelector("#foldBody .f-item span") ?? document.querySelector("#foldBody .f-doc b"));
        const front = open.querySelector(".f-front"); // the outline that marks "open" must be visible against the page (3:1)
        const border = rgba(getComputedStyle(front).borderTopColor);
        out["open outline"] = ratio(over(border, bgOf(document.body)), bgOf(document.body));
        return out;
      });
      for (const k of ["folder name", "file count", "PDF title", "PDF sub", "photo caption"]) expect(worst[k], `${scheme}: ${k}`).toBeGreaterThanOrEqual(4.5);
      expect(worst["open outline"], `${scheme}: open outline`).toBeGreaterThanOrEqual(3);
    });
  }

  test("print with a folder open: the proof section is dropped and nothing overflows", async ({ page, press }) => {
    await page.goto("/");
    await press(folder(page, 1));
    await page.emulateMedia({ media: "print" });
    expect(await displayed(page.locator("#evidence"))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});

// ---------------------------------------------------------------- everything else that uses `hidden`
test.describe("[hidden] regressions: every element the HTML or JS hides, in each state", () => {
  const apis = {
    repos: JSON.stringify([
      { name: "demo-one", html_url: "https://github.com/Mirulfiz04/demo-one", pushed_at: "2026-11-01T00:00:00Z", language: "Dart" },
      { name: "demo-two", html_url: "https://github.com/Mirulfiz04/demo-two", pushed_at: "2026-10-01T00:00:00Z", language: null }
    ])
  };
  const reviews = (n) => JSON.stringify(Array.from({ length: n }, (_, k) => ({ name: `T${k}`, comment: "Good work indeed.", rating: 5 - k, date: `2026-11-0${k + 1}` })));

  test("tabs: exactly the selected panel is shown, the others are really hidden", async ({ page }) => {
    await page.goto("/");
    const tabs = page.locator('[role="tab"]');
    const n = await tabs.count();
    expect(n).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click();
      const shown = await page.evaluate(() => [...document.querySelectorAll('[role="tabpanel"]')].map((p) => (getComputedStyle(p).display !== "none" ? p.id : null)).filter(Boolean));
      const selected = await tabs.nth(i).getAttribute("aria-controls");
      expect(shown, `tab ${i + 1}`).toEqual([selected]);
    }
  });

  for (const [name, vp, mobile] of [["phone", { width: 390, height: 844 }, true], ["desktop", { width: 1280, height: 800 }, false]]) {
    test.describe(`lessons "Show all" button (${name})`, () => {
      test.use({ viewport: vp, hasTouch: mobile, isMobile: mobile });

      test("shown only when clipped on a phone, gone once opened or filtered", async ({ page, press }) => {
        await page.goto("/");
        const btn = page.locator("#moreLessons");
        expect(await displayed(btn), "initial").toBe(mobile); // the button only exists on phones (css/style.css .more-lessons)
        if (!mobile) return;
        const chips = page.locator("#themeChips .chip");
        await press(chips.nth(1));
        expect(await displayed(btn), "a theme filter hides it").toBe(false);
        await press(chips.nth(0)); // back to All, not opened yet
        expect(await displayed(btn), "All again, still clipped").toBe(true);
        await press(btn);
        expect(await displayed(btn), "after opening").toBe(false);
        await press(chips.nth(1));
        await press(chips.nth(0));
        expect(await displayed(btn), "stays gone once opened").toBe(false);
      });
    });
  }

  test("the live GitHub strip: shown when the API answers, hidden when it does not", async ({ page }) => {
    await page.route("https://api.github.com/**", (r) => r.fulfill({ contentType: "application/json", body: apis.repos }));
    await page.goto("/");
    await page.evaluate(() => document.querySelector("#projects").scrollIntoView());
    await expect.poll(() => displayed(page.locator("#ghActivity")), { timeout: 5000 }).toBe(true);
    await expect(page.locator("#ghList li")).toHaveCount(2);
  });

  test("the live GitHub strip stays hidden when the API is down", async ({ page }) => {
    await page.route("https://api.github.com/**", (r) => r.abort());
    await page.goto("/");
    await page.evaluate(() => document.querySelector("#projects").scrollIntoView());
    await page.waitForTimeout(800);
    expect(await displayed(page.locator("#ghActivity"))).toBe(false);
  });

  for (const n of [0, 1, 2]) {
    test(`guestbook sort chips with ${n} review(s): ${n < 2 ? "hidden" : "shown"}`, async ({ page }) => {
      await page.route("**/reviews.json", (r) => r.fulfill({ contentType: "application/json", body: reviews(n) }));
      await page.goto("/");
      await page.waitForLoadState("load");
      await expect.poll(() => page.locator("#rvList li").count()).toBe(Math.max(n, 1));
      expect(await displayed(page.locator(".rv-sort"))).toBe(n >= 2);
    });
  }

  test("visit counter card: shown with its number when the API answers, hidden when it fails", async ({ page, browser }) => {
    await page.route("https://abacus.jasoncameron.dev/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ value: 4242 }) }));
    await page.goto("/");
    await expect(page.locator("#visits")).toHaveText(/4,?242/);
    expect(await displayed(page.locator(".rv-stat").filter({ has: page.locator("#visits") }))).toBe(true);
    const ctx = await browser.newContext();
    const down = await ctx.newPage();
    await down.route("https://abacus.jasoncameron.dev/**", (r) => r.abort());
    await down.goto(page.url());
    await expect.poll(() => displayed(down.locator(".rv-stat").filter({ has: down.locator("#visits") }))).toBe(false);
    await ctx.close();
  });

  test("project filters: each shows exactly its cards, All shows 9, and print shows all 9 even with a filter on", async ({ page }) => {
    await page.goto("/");
    const chips = page.locator(".proj-head .chip");
    const n = await chips.count();
    expect(n).toBeGreaterThan(2);
    for (let i = 0; i < n; i++) {
      await chips.nth(i).click();
      const f = await chips.nth(i).getAttribute("data-filter");
      const { shown, expected } = await page.evaluate((f) => {
        const cards = [...document.querySelectorAll(".p-card")];
        return { shown: cards.filter((c) => getComputedStyle(c).display !== "none").length, expected: cards.filter((c) => f === "all" || c.dataset.cats.includes(f)).length };
      }, f);
      expect(shown, `filter ${f}`).toBe(expected);
      if (f === "all") expect(shown).toBe(9);
    }
    await chips.nth(1).click(); // a real filter on
    await page.emulateMedia({ media: "print" });
    const inPrint = await page.evaluate(() => [...document.querySelectorAll(".p-card")].filter((c) => getComputedStyle(c).display !== "none").length);
    expect(inPrint, "print must show every project").toBe(9);
  });

  test("the main page sections are all still displayed", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    for (const sel of [".topbar", "main", ".hero", "#evidence", "#projects", "#reviews", ".footer"]) {
      expect(await displayed(page.locator(sel).first()), sel).toBe(true);
    }
  });
});
