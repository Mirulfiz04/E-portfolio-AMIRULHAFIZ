import { spawn, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test, expect } from "@playwright/test";

// Tests for the commit stamp (#15): scripts/stamp-version.mjs rewrites ?v= in index.html,
// and scripts/verify-live.mjs then requires that stamp on the live home page when VERIFY_COMMIT is set.
const SHA = "abc1234def5678abc1234def5678abc1234def56";
const SHORT = "abc1234";
const HTML = '<link href="css/style.css?v=6"><script src="js/script.js?v=6"></script><script src="js/motion.js?v=5"></script><a href="about.html">x</a>';

const run = (script, args, env = {}) =>
  spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env: { ...process.env, GITHUB_SHA: "", VERIFY_ATTEMPTS: "1", VERIFY_DELAY_MS: "0", ...env } });
const stamp = (dir, args = [], env = {}) => run("scripts/stamp-version.mjs", [dir, ...args], env);
const verify = (url, env = {}) => run("scripts/verify-live.mjs", [url], env);

const freePort = () =>
  new Promise((resolve) => {
    const s = createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

test.describe("Commit stamp", () => {
  test.skip(({ isMobile }) => isMobile, "does not need a browser, so one project is enough");
  let dir;
  test.beforeEach(() => void (dir = mkdtempSync(join(tmpdir(), "stamp-"))));
  test.afterEach(() => dir && rmSync(dir, { recursive: true, force: true })); // dir is unset in the skipped phone project
  const page = () => readFileSync(join(dir, "index.html"), "utf8");

  test("stamps every ?v= link with the short commit ID and touches nothing else", () => {
    writeFileSync(join(dir, "index.html"), HTML);
    const result = stamp(dir, [SHA]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("3 ?v= link(s)");
    expect(page()).toBe(HTML.replace(/\?v=\d+/g, `?v=${SHORT}`));
  });

  test("takes the commit from GITHUB_SHA when none is given", () => {
    writeFileSync(join(dir, "index.html"), HTML);
    expect(stamp(dir, [], { GITHUB_SHA: SHA }).status).toBe(0);
    expect(page()).toContain(`css/style.css?v=${SHORT}`);
  });

  test("fails loudly when there is nothing to stamp, without changing the file", () => {
    writeFileSync(join(dir, "index.html"), '<link href="css/style.css">');
    const result = stamp(dir, [SHA]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/no \?v= links to stamp/);
    expect(page()).toBe('<link href="css/style.css">');
  });

  test("fails when the commit ID is missing or not a commit ID", () => {
    writeFileSync(join(dir, "index.html"), HTML);
    for (const args of [[], ["not-a-sha"], ["abc12"]]) {
      const result = stamp(dir, args);
      expect(result.status, args.join()).toBe(1);
      expect(result.stderr).toMatch(/not a commit ID/);
    }
    expect(page()).toBe(HTML);
  });

  test("fails when the folder has no index.html", () => {
    expect(stamp(dir, [SHA]).status).toBe(1);
  });

  test("verify-live refuses a site that is not stamped with this commit", async ({ baseURL }) => {
    const result = verify(`${baseURL}/`, { VERIFY_COMMIT: SHA });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(`does not link css/style.css?v=${SHORT}`);
  });

  test("verify-live passes on a copy stamped with this commit, and fails on another commit", async () => {
    const copy = join(dir, "site");
    const skip = /^(node_modules|\.git|test-results|playwright-report)([\\/]|$)/;
    cpSync(process.cwd(), copy, { recursive: true, filter: (src) => !skip.test(relative(process.cwd(), src)) });
    expect(stamp(copy, [SHA]).status).toBe(0);

    const port = await freePort();
    const server = spawn(process.execPath, [join(copy, "scripts/serve.mjs")], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
    try {
      const url = `http://127.0.0.1:${port}/`;
      for (let i = 0; i < 50 && !(await fetch(url).then((r) => r.ok, () => false)); i++) await new Promise((r) => setTimeout(r, 100));
      const ok = verify(url, { VERIFY_COMMIT: SHA });
      expect(ok.stdout + ok.stderr).toContain("is serving this commit");
      expect(ok.status).toBe(0);
      const other = verify(url, { VERIFY_COMMIT: "fedcba9876543210" });
      expect(other.status).toBe(1);
      expect(other.stdout).toContain("does not link css/style.css?v=fedcba9");
    } finally {
      server.kill();
    }
  });

  test("verify-live stops when asked to expect something that is not a commit ID", async ({ baseURL }) => {
    const result = verify(`${baseURL}/`, { VERIFY_COMMIT: "latest" });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/cannot expect commit/);
  });

  test("GITHUB_SHA alone does not change verify-live (CI sets it for the local tests too)", async ({ baseURL }) => {
    const result = verify(`${baseURL}/`, { GITHUB_SHA: SHA });
    expect(result.status, result.stdout).toBe(0);
  });
});
