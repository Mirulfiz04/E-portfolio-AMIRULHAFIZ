// Fails if the site references a local file that does not exist.
// Looks at: HTML attributes (src, href, poster, srcset), CSS url(...), and asset-looking
// strings inside the JS (photo lists, PDF links, fetch("...")).
// No dependencies: runs with plain Node.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// On GitHub Pages the site is served from /<repo-name>/, so 404.html links look like "/E-portfolio-AMIRULHAFIZ/#projects".
// That prefix is the repo root on disk.
const PAGES_BASE = "/E-portfolio-AMIRULHAFIZ/";
const SKIP_DIRS = new Set(["node_modules", ".git", ".github", "playwright-report", "test-results"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const isExternal = (u) => /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u); // http:, mailto:, data:, //cdn, #anchor
const clean = (u) => decodeURI(u.split("#")[0].split("?")[0]);

const files = walk(root);
const missing = [];
let checked = 0;

function check(ref, fromFile, baseDir) {
  const raw = ref.trim();
  if (!raw || isExternal(raw) || raw.includes("${")) return; // skip external links and dynamic template strings
  const target = clean(raw);
  if (!target) return;
  checked++;
  const fromRoot = target === PAGES_BASE.slice(0, -1) ? "/" : target.startsWith(PAGES_BASE) ? "/" + target.slice(PAGES_BASE.length) : target;
  const abs = fromRoot.startsWith("/") ? join(root, fromRoot) : resolve(baseDir, fromRoot);
  if (!existsSync(abs)) missing.push(`${relative(root, fromFile)}: "${raw}" -> ${relative(root, abs)} not found`);
}

for (const file of files) {
  const ext = extname(file);
  if (![".html", ".css", ".js"].includes(ext)) continue;
  if (relative(root, file).startsWith("tests") || relative(root, file).startsWith("scripts")) continue;
  const src = readFileSync(file, "utf8");
  const baseDir = dirname(file);

  if (ext === ".html") {
    for (const m of src.matchAll(/\b(?:src|href|poster)\s*=\s*"([^"]*)"/g)) check(m[1], file, baseDir);
    for (const m of src.matchAll(/\bsrcset\s*=\s*"([^"]*)"/g)) for (const part of m[1].split(",")) check(part.trim().split(/\s+/)[0], file, baseDir);
  } else if (ext === ".css") {
    for (const m of src.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) check(m[2], file, baseDir);
  } else {
    // JS is always loaded from the page, so its paths are relative to the site root
    for (const m of src.matchAll(/["'`](assets\/[^"'`]+?\.(?:jpe?g|png|webp|gif|svg|ico|pdf|json|txt))["'`]/gi)) check(m[1], file, root);
    for (const m of src.matchAll(/fetch\(\s*["']([^"']+)["']/g)) check(m[1], file, root);
  }
}

if (missing.length) {
  console.error(`\n${missing.length} broken local reference(s):\n`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}
console.log(`check-assets: ${checked} local references checked, none missing.`);
