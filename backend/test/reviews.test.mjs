import test from "node:test";
import assert from "node:assert/strict";
import { makeCreate, makeList, PENDING_TTL_DAYS } from "../src/reviews.mjs";
import { memStore, env, post, captureLogs, GOOD, ORIGIN } from "./helpers.mjs";

const setup = () => {
  const db = memStore();
  const t = Date.UTC(2026, 10, 24, 12, 0, 0);
  let n = 0;
  const create = makeCreate({ store: async () => db, env, now: () => t, uuid: () => `id-${++n}` });
  const list = makeList({ store: async () => db });
  return { db, create, list, t };
};

test("a valid review is stored as pending with a 30-day expiry, and answers 202", async () => {
  const { db, create, t } = setup();
  const res = await create(post(GOOD));
  assert.equal(res.statusCode, 202);
  assert.deepEqual(JSON.parse(res.body), { status: "pending" });
  const item = db.items.get("id-1");
  assert.equal(item.status, "pending");
  assert.equal(item.expiresAt, Math.floor(t / 1000) + PENDING_TTL_DAYS * 86400);
  assert.equal(item.createdAt, "2026-11-24T12:00:00.000Z");
});

test("approve-first: a pending review is never returned by the public list", async () => {
  const { create, list } = setup();
  await create(post(GOOD));
  assert.deepEqual(JSON.parse((await list()).body), []);
});

test("the public list shows approved reviews only, newest first, with no internal fields", async () => {
  const { db, list } = setup();
  await db.putReview({ id: "a", status: "approved", createdAt: "2026-11-01T00:00:00.000Z", rating: 4, name: "Old", comment: "older one" });
  await db.putReview({ id: "b", status: "approved", createdAt: "2026-11-20T09:00:00.000Z", rating: 5, name: "New", role: "Dev", comment: "newer one" });
  await db.putReview({ id: "c", status: "pending", createdAt: "2026-11-21T00:00:00.000Z", rating: 1, name: "Hidden", comment: "not approved" });
  const res = await list();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), [
    { name: "New", role: "Dev", rating: 5, comment: "newer one", date: "2026-11-20" },
    { name: "Old", rating: 4, comment: "older one", date: "2026-11-01" },
  ]);
});

test("invalid input gets 400 and stores nothing", async () => {
  const { db, create } = setup();
  const res = await create(post({ ...GOOD, rating: 9, comment: "x" }));
  assert.equal(res.statusCode, 400);
  assert.deepEqual(Object.keys(JSON.parse(res.body).fields).sort(), ["comment", "rating"]);
  assert.equal(db.items.size, 0);
});

test("honeypot: a filled hidden field looks like success but stores nothing", async () => {
  const { db, create } = setup();
  const res = await create(post({ ...GOOD, _gotcha: "http://spam" }));
  assert.equal(res.statusCode, 202);
  assert.equal(db.items.size, 0);
});

test("wrong Origin gets 403; a missing Origin (not a browser) is judged by the other limits", async () => {
  const { db, create } = setup();
  assert.equal((await create(post(GOOD, { origin: "https://evil.example" }))).statusCode, 403);
  assert.equal(db.items.size, 0);
  assert.equal((await create(post(GOOD, { origin: null }))).statusCode, 202);
});

test("wrong content type 415, bad JSON 400, non-object 400", async () => {
  const { create } = setup();
  assert.equal((await create(post(GOOD, { type: "text/plain" }))).statusCode, 415);
  assert.equal((await create(post(null, { raw: "{not json" }))).statusCode, 400);
  assert.equal((await create(post(null, { raw: "[1,2]" }))).statusCode, 400);
  assert.equal((await create(post(null, { raw: "null" }))).statusCode, 400);
});

test("oversized bodies get 413, including base64 ones", async () => {
  const { db, create } = setup();
  assert.equal((await create(post({ ...GOOD, comment: "a".repeat(5000) }))).statusCode, 413);
  const big = Buffer.from(JSON.stringify({ ...GOOD, comment: "a".repeat(4500) })).toString("base64");
  const res = await create({ headers: { "content-type": "application/json", origin: ORIGIN }, body: big, isBase64Encoded: true });
  assert.equal(res.statusCode, 413);
  assert.equal(db.items.size, 0);
});

test("base64 bodies within the limit work", async () => {
  const { db, create } = setup();
  const body = Buffer.from(JSON.stringify(GOOD)).toString("base64");
  const res = await create({ headers: { "content-type": "application/json", origin: ORIGIN }, body, isBase64Encoded: true });
  assert.equal(res.statusCode, 202);
  assert.equal(db.items.size, 1);
});

test("too many pending reviews: 503 with retry-after, nothing stored", async () => {
  const { db, create } = setup();
  for (let i = 0; i < 3; i++) assert.equal((await create(post(GOOD))).statusCode, 202); // MAX_PENDING is 3 in tests
  const res = await create(post(GOOD));
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers["retry-after"], "3600");
  assert.equal(db.items.size, 3);
});

test("a database failure gives a generic 500 and logs no reviewer data", async () => {
  const db = memStore();
  db.putReview = async () => { throw Object.assign(new Error("boom: Aina Clear, tidy projects."), { name: "ProvisionedThroughputExceededException" }); };
  const create = makeCreate({ store: async () => db, env });
  const { result, logs } = await captureLogs(() => create(post(GOOD)));
  assert.equal(result.statusCode, 500);
  assert.deepEqual(JSON.parse(result.body), { error: "server_error" });
  assert.match(logs, /ProvisionedThroughputExceededException/);
  assert.doesNotMatch(logs, /Aina|tidy|boom/);
});

test("success logs contain no reviewer data", async () => {
  const { create } = setup();
  const { logs } = await captureLogs(() => create(post(GOOD)));
  assert.doesNotMatch(logs, /Aina|Recruiter|tidy|id-1/);
});
