import { defineConfig } from "@playwright/test";

// Browser tests run against the site exactly as GitHub Pages would serve it (see scripts/serve.mjs).
// Two projects: a phone (touch, 430px wide) and a desktop (1280px wide), both in Chromium.
// PW_PORT lets parallel clones run side by side; reuseExistingServer would otherwise silently test another clone.
const port = Number(process.env.PW_PORT || 4173);

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    // lets a machine with its own Chromium run the suite; CI installs Playwright's browser instead
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
  },
  projects: [
    { name: "phone", testIgnore: /qa-/, use: { viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: "desktop", testIgnore: /qa-/, use: { viewport: { width: 1280, height: 800 } } },
    // cross-device QA specs set their own viewport/touch per test, so they run once, not once per project above
    { name: "qa", testMatch: /qa-.*\.spec\.js/, use: { viewport: { width: 1280, height: 800 } } }
  ],
  webServer: {
    command: "node scripts/serve.mjs",
    env: { PORT: String(port) },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI
  }
});
