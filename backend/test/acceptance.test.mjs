import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { makeCreate, makeList } from "../src/reviews.mjs";
import { makeModerate } from "../src/moderate.mjs";
import { memStore, env, post, GOOD } from "./helpers.mjs";

// End-to-end checks of the requirements in docs/requirements.md, using the in-memory store.
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const uuid = (() => { let n = 0; return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`; })();
const system = () => {
  const db = memStore();
  const store = async () => db;
  return { db, create: makeCreate({ store, env, uuid }), list: makeList({ store }), moderate: makeModerate({ store }) };
};
const names = async (list) => JSON.parse((await list()).body).map((r) => r.name);

test("R1+R3 success flow: submit, stays hidden, owner approves, becomes public", async () => {
  const { create, list, moderate } = system();
  const res = await create(post(GOOD));
  assert.equal(res.statusCode, 202);
  assert.deepEqual(await names(list), []); // approve-first
  const { pending } = await moderate({ action: "list" });
  assert.equal(pending.length, 1);
  assert.deepEqual(await moderate({ action: "approve", id: pending[0].id }), { ok: true });
  assert.deepEqual(await names(list), ["Aina"]);
});

test("R2 validation failure: refused, nothing stored, nothing public", async () => {
  const { db, create, list } = system();
  const res = await create(post({ rating: 7, name: "", comment: "no" }));
  assert.equal(res.statusCode, 400);
  assert.equal(db.items.size, 0);
  assert.deepEqual(await names(list), []);
});

test("R3 a client cannot choose its own status, id or expiry", async () => {
  const { db, create, list } = system();
  const res = await create(post({ ...GOOD, status: "approved", id: "attacker-id", expiresAt: 9999999999, approvedAt: "2020-01-01" }));
  assert.equal(res.statusCode, 202);
  const [item] = [...db.items.values()];
  assert.equal(item.status, "pending");
  assert.match(item.id, /^00000000-0000-4000-8000-/);
  assert.notEqual(item.expiresAt, 9999999999);
  assert.equal("approvedAt" in item, false);
  assert.deepEqual(await names(list), []);
});

test("R4 unauthorised moderation: an HTTP request cannot approve or delete anything", async () => {
  const { db, create, list, moderate } = system();
  await create(post(GOOD));
  const id = [...db.items.keys()][0];
  // What API Gateway would send if someone POSTed to a /moderate route: the body is a string, not the event itself.
  const httpEvent = { version: "2.0", routeKey: "POST /moderate", rawPath: "/moderate", headers: { origin: "https://evil.example" }, body: JSON.stringify({ action: "approve", id }), isBase64Encoded: false };
  assert.equal((await moderate(httpEvent)).ok, false);
  // The public create route treats "action" as an unknown field and never moderates.
  assert.equal((await create(post({ ...GOOD, action: "approve", id }))).statusCode, 202);
  assert.equal(db.items.get(id).status, "pending");
  assert.deepEqual(await names(list), []);
});

test("R4 the deployed API exposes only /reviews and /visits (no moderation route)", () => {
  const routes = [...read("template.yaml").matchAll(/Path: (\S+)\n\s+Method: (\w+)/g)].map((m) => `${m[2]} ${m[1]}`).sort();
  assert.deepEqual(routes, ["GET /reviews", "GET /visits", "POST /reviews", "POST /visits"]);
});

test("R9 openapi.yaml documents every route and the error codes of POST /reviews", () => {
  const api = read("openapi.yaml");
  for (const [, path, method] of read("template.yaml").matchAll(/Path: (\S+)\n\s+Method: (\w+)/g)) {
    const start = api.indexOf(`\n  ${path}:\n`);
    assert.notEqual(start, -1, `${path} missing from openapi.yaml`);
    const rest = api.slice(start + 1);
    const end = rest.slice(1).search(/\n(  \/\S+:|components:)\n/);
    const block = end === -1 ? rest : rest.slice(0, end + 1);
    assert.match(block, new RegExp(`\\n    ${method.toLowerCase()}:\\n`), `${method} ${path} missing`);
  }
  const post = api.slice(api.indexOf("    post:\n      operationId: createReview"), api.indexOf("  /visits:"));
  for (const code of ["202", "400", "403", "413", "415", "429", "503", "500"]) assert.match(post, new RegExp(`"${code}":`), code);
});

test("docs only point at test files that exist", () => {
  const files = new Set([...read("docs/requirements.md").matchAll(/`([a-z]+\.test\.mjs)`/g), ...read("docs/threat-model.md").matchAll(/`([a-z]+\.test\.mjs)`/g)].map((m) => m[1]));
  assert.ok(files.size >= 6);
  for (const f of files) assert.ok(existsSync(new URL(`./${f}`, import.meta.url)), `${f} does not exist`);
});
