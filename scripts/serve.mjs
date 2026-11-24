// Tiny static file server used by the browser tests (and handy for `node scripts/serve.mjs`).
// No dependencies. Serves the repo root on http://127.0.0.1:4173 and never serves anything outside it.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { excludedPaths } from "./site-config.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);
// Not part of the published site: whatever _config.yml excludes, plus dotfiles (Jekyll skips those too).
const HIDDEN = new Set(excludedPaths(root));

const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml"
};

async function notFound(res) {
  const body = await readFile(join(root, "404.html")).catch(() => Buffer.from("Not found"));
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(body);
}

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = normalize(join(root, urlPath));
    const rel = file.slice(root.length + 1);
    if (file !== root && !file.startsWith(root + sep)) return void res.writeHead(403).end("Forbidden");
    const first = rel.split(sep)[0];
    if (HIDDEN.has(first) || first.startsWith(".")) return void (await notFound(res));
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    await notFound(res);
  }
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
