import { spawnSync } from "node:child_process";
import { test, expect } from "@playwright/test";

// Tests for the post-deploy check (scripts/verify-live.mjs) that the CI/CD pipeline runs against the live site (#8).
// Here it runs against the local test server instead, which publishes exactly what _config.yml allows.
const verify = (url, env = {}) =>
  spawnSync(process.execPath, ["scripts/verify-live.mjs", url], {
    encoding: "utf8",
    env: { ...process.env, VERIFY_ATTEMPTS: "1", VERIFY_DELAY_MS: "0", ...env }
  });

test.describe("Post-deploy check", () => {
  test.skip(({ isMobile }) => isMobile, "does not need a browser, so one project is enough");

  test("passes against a healthy copy of the site", async ({ baseURL }) => {
    const result = verify(`${baseURL}/`);
    expect(result.stdout + result.stderr).toContain("is serving this commit");
    expect(result.status).toBe(0);
  });

  test("fails when the site is not where it should be", async ({ baseURL }) => {
    const result = verify(`${baseURL}/assets/`);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/home page returned 404/);
  });

  test("fails when a developer file would be published", async ({ baseURL }) => {
    // the same site, but pretend package.json is public by asking the checker to expect it hidden at a path that exists
    const result = verify(`${baseURL}/`, { VERIFY_EXTRA_HIDDEN: "index.html" });
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/index\.html returned 200 but must not be published/);
  });

  test("the test server hides developer files, like Jekyll does", async ({ request }) => {
    for (const path of ["package.json", "tests/site.spec.js", "scripts/serve.mjs", "eslint.config.js", ".gitignore", "node_modules/.package-lock.json"]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });
});
