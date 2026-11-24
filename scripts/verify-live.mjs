// Post-deploy check: is the live site really serving THIS commit, and is it healthy?
//
//   node scripts/verify-live.mjs https://mirulfiz04.github.io/E-portfolio-AMIRULHAFIZ/
//
// It keeps retrying for a couple of minutes because GitHub Pages can take a moment to switch over.
// Checks, in order:
//   1. the home page loads, has the right <title>, and links the same versioned files (css/style.css?v=N ...)
//      as the index.html in this checkout, which proves it is this commit and not an older copy
//   2. every local file the home page links to (CSS, JS, images, ...) loads
//   3. robots.txt and sitemap.xml load, and unknown URLs get the custom 404 page
//   4. developer files (package.json, tests, scripts ...) are NOT published
// No dependencies: runs with plain Node 20+.
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { excludedPaths } from "./site-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2] || process.env.SITE_URL;
if (!arg) {
  console.error("Usage: node scripts/verify-live.mjs <site url>   (or set SITE_URL)");
  process.exit(2);
}
const base = new URL(arg.endsWith("/") ? arg : `${arg}/`);
const attempts = Number(process.env.VERIFY_ATTEMPTS || 12);
const delayMs = Number(process.env.VERIFY_DELAY_MS || 10000);
const bust = process.env.GITHUB_RUN_ID || String(Date.now()); // cache-buster so a stale CDN copy is never what we check

const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const titleOf = (html) => html.match(/<title>([^<]*)<\/title>/i)?.[1];
const homeTitle = titleOf(indexHtml);
const notFoundTitle = titleOf(readFileSync(join(root, "404.html"), "utf8"));

const isLocal = (u) => u && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u); // not http:, mailto:, data:, //cdn or #anchor
const refs = new Set();
for (const m of indexHtml.matchAll(/\b(?:src|href)\s*=\s*"([^"]*)"/g)) if (isLocal(m[1])) refs.add(m[1].split("#")[0]);
refs.delete("");
const versioned = [...refs].filter((r) => /\?v=/.test(r));
// paths that must not be public: everything _config.yml excludes, plus any extras (comma separated) from VERIFY_EXTRA_HIDDEN
const hidden = [...excludedPaths(root), ...(process.env.VERIFY_EXTRA_HIDDEN || "").split(",").map((s) => s.trim()).filter(Boolean)];

function urlFor(path) {
  const url = new URL(path, base);
  url.searchParams.set("cb", bust);
  return url;
}

async function status(path, method = "HEAD") {
  let res = await fetch(urlFor(path), { method });
  if (method === "HEAD" && (res.status === 405 || res.status === 501)) res = await fetch(urlFor(path));
  return res;
}

async function runChecks() {
  const problems = [];

  const home = await fetch(urlFor(""));
  if (home.status !== 200) problems.push(`home page returned ${home.status}, expected 200`);
  else {
    const html = await home.text();
    if (homeTitle && titleOf(html) !== homeTitle) problems.push(`home page title is "${titleOf(html)}", expected "${homeTitle}"`);
    for (const v of versioned) if (!html.includes(v)) problems.push(`home page does not link ${v}, so the live site is not this commit yet`);
  }

  for (const ref of refs) {
    const res = await status(ref);
    if (res.status !== 200) problems.push(`${ref} returned ${res.status}, expected 200`);
  }

  for (const file of ["robots.txt", "sitemap.xml"]) {
    const res = await status(file);
    if (res.status !== 200) problems.push(`${file} returned ${res.status}, expected 200`);
  }

  const missing = await fetch(urlFor("this-page-does-not-exist"));
  if (missing.status !== 404) problems.push(`an unknown URL returned ${missing.status}, expected 404`);
  else if (notFoundTitle && titleOf(await missing.text()) !== notFoundTitle) problems.push("an unknown URL did not get the custom 404 page");

  for (const path of hidden) {
    const res = await status(path);
    if (res.status !== 404) problems.push(`${path} returned ${res.status} but must not be published (see exclude in _config.yml)`);
  }

  return problems;
}

for (let attempt = 1; attempt <= attempts; attempt++) {
  let problems;
  try {
    problems = await runChecks();
  } catch (error) {
    problems = [`request failed: ${error.message}`];
  }
  if (problems.length === 0) {
    console.log(`verify-live: ${base.href} is serving this commit (${refs.size} linked files, ${hidden.length} developer paths hidden). Attempt ${attempt}/${attempts}.`);
    process.exit(0);
  }
  console.log(`verify-live: attempt ${attempt}/${attempts}, ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 10)) console.log(`  - ${p}`);
  if (attempt < attempts) await new Promise((r) => setTimeout(r, delayMs));
}
console.error("verify-live: FAILED. The live site is not healthy or not on this commit.");
process.exit(1);
