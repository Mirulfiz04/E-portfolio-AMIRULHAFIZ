import { test as base, expect } from "@playwright/test";

// Shared setup for every test:
//  - third-party requests (CDN scripts, Google Fonts, the GitHub API) are blocked so runs are fast, offline and deterministic.
//    The site is built to work without them, so these tests cover that path.
//  - uncaught script errors are collected so a test can assert there were none.
//  - `press` taps on touch devices and clicks elsewhere.
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL).origin;
    await page.route((url) => url.origin !== origin, (route) => route.abort());
    await use(page);
  },
  pageErrors: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await use(errors);
  },
  press: async ({ hasTouch }, use) => {
    await use((locator) => (hasTouch ? locator.tap() : locator.click()));
  }
});

export { expect };
