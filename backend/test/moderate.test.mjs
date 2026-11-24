import test from "node:test";
import assert from "node:assert/strict";
import { makeModerate } from "../src/moderate.mjs";
import { makeList } from "../src/reviews.mjs";
import { memStore } from "./helpers.mjs";

const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";
const seed = async (db) => {
  await db.putReview({ id: ID1, status: "pending", createdAt: "2026-11-20T00:00:00.000Z", expiresAt: 1, rating: 5, name: "A", comment: "hello there" });
  await db.putReview({ id: ID2, status: "pending", createdAt: "2026-11-21T00:00:00.000Z", expiresAt: 1, rating: 2, name: "B", comment: "second one" });
};
const setup = async () => { const db = memStore(); await seed(db); return { db, mod: makeModerate({ store: async () => db, now: () => new Date("2026-11-24T00:00:00Z") }) }; };

test("list shows pending reviews with their ids", async () => {
  const { mod } = await setup();
  const out = await mod({ action: "list" });
  assert.equal(out.ok, true);
  assert.deepEqual(out.pending.map((p) => p.id), [ID2, ID1]);
});

test("approve makes the review public and drops its expiry", async () => {
  const { db, mod } = await setup();
  assert.deepEqual(await mod({ action: "approve", id: ID1 }), { ok: true });
  assert.equal("expiresAt" in db.items.get(ID1), false);
  const shown = JSON.parse((await makeList({ store: async () => db })()).body);
  assert.deepEqual(shown.map((r) => r.name), ["A"]);
});

test("approving twice, or an unknown id, returns ok:false", async () => {
  const { mod } = await setup();
  await mod({ action: "approve", id: ID1 });
  assert.deepEqual(await mod({ action: "approve", id: ID1 }), { ok: false });
  assert.deepEqual(await mod({ action: "approve", id: "33333333-3333-4333-8333-333333333333" }), { ok: false });
});

test("reject deletes a pending review but never an approved one", async () => {
  const { db, mod } = await setup();
  assert.deepEqual(await mod({ action: "reject", id: ID2 }), { ok: true });
  assert.equal(db.items.has(ID2), false);
  await mod({ action: "approve", id: ID1 });
  assert.deepEqual(await mod({ action: "reject", id: ID1 }), { ok: false });
  assert.equal(db.items.has(ID1), true);
});

test("delete removes an approved review (a reviewer asked to be removed)", async () => {
  const { db, mod } = await setup();
  await mod({ action: "approve", id: ID1 });
  assert.deepEqual(await mod({ action: "delete", id: ID1 }), { ok: true });
  assert.equal(db.items.has(ID1), false);
});

test("bad input is refused: unknown action, missing or malformed id (including the counter item)", async () => {
  const { mod } = await setup();
  assert.equal((await mod({ action: "drop-table" })).ok, false);
  assert.equal((await mod(undefined)).ok, false);
  for (const id of [undefined, "", "COUNTER#visits", "not-a-uuid", 5]) assert.equal((await mod({ action: "delete", id })).ok, false, String(id));
});
