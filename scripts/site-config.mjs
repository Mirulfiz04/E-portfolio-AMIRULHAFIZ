// Reads the `exclude:` list from _config.yml (the files Jekyll leaves out of the published site).
// Shared by the local test server and the post-deploy check so all three agree on what must NOT be public.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function excludedPaths(root) {
  const lines = readFileSync(join(root, "_config.yml"), "utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => /^exclude:\s*$/.test(line));
  if (start === -1) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\s*-\s+(\S+)\s*$/);
    if (item) out.push(item[1]);
    else if (line.trim() && !line.trim().startsWith("#")) break; // next top-level key
  }
  return out;
}
