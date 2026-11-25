// Stamps the ?v= cache-buster on the CSS/JS links of index.html with the short commit ID (#15).
//
//   node scripts/stamp-version.mjs <folder> [commit sha]     (the sha defaults to $GITHUB_SHA)
//
// The Build site job runs it on its temporary checkout before Jekyll, so css/style.css?v=6 becomes
// css/style.css?v=e322405 in the published copy only. The repo files stay as they are, and
// scripts/verify-live.mjs then requires that exact stamp on the live home page.
// It exits with an error if it stamps nothing, so a pipeline can never pretend it proved a commit.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = /\?v=[^"'\s&#<>]+/g;

export function shortSha(sha) {
  if (!/^[0-9a-f]{7,64}$/i.test(sha || "")) throw new Error(`"${sha}" is not a commit ID (expected at least 7 hex characters)`);
  return sha.slice(0, 7).toLowerCase();
}

export const stampHtml = (html, sha) => html.replace(VERSION, `?v=${shortSha(sha)}`);

function main() {
  const [folder, sha = process.env.GITHUB_SHA] = process.argv.slice(2);
  if (!folder) throw new Error("Usage: node scripts/stamp-version.mjs <folder> [commit sha]");
  const file = join(resolve(folder), "index.html");
  const html = readFileSync(file, "utf8");
  const count = html.match(VERSION)?.length ?? 0;
  if (count === 0) throw new Error(`${file} has no ?v= links to stamp`);
  writeFileSync(file, stampHtml(html, sha));
  console.log(`stamp-version: ${count} ?v= link(s) in ${file} now end with ?v=${shortSha(sha)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`stamp-version: ${error.message}`);
    process.exit(1);
  }
}
