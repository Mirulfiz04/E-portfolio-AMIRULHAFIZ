import test from "node:test";
import assert from "node:assert/strict";
import { makeHit, makeGet } from "../src/visits.mjs";
import { memStore, env, ORIGIN } from "./helpers.mjs";

const ev = (origin) => ({ headers: origin ? { origin } : {} });

test("hit counts up, get returns the total without counting", async () => {
  const db = memStore();
  const hit = makeHit({ store: async () => db, env });
  const get = makeGet({ store: async () => db });
  assert.deepEqual(JSON.parse((await hit(ev(ORIGIN))).body), { visits: 1 });
  assert.deepEqual(JSON.parse((await hit(ev(ORIGIN))).body), { visits: 2 });
  assert.deepEqual(JSON.parse((await get(ev())).body), { visits: 2 });
  assert.deepEqual(JSON.parse((await get(ev())).body), { visits: 2 });
});

test("hit from another origin is refused and not counted", async () => {
  const db = memStore();
  const hit = makeHit({ store: async () => db, env });
  assert.equal((await hit(ev("https://evil.example"))).statusCode, 403);
  assert.equal(await db.getVisits(), 0);
});

test("a database failure gives a generic 500", async () => {
  const db = memStore();
  db.incrementVisits = async () => { throw new Error("secret detail"); };
  const res = await makeHit({ store: async () => db, env })(ev(ORIGIN));
  assert.equal(res.statusCode, 500);
  assert.doesNotMatch(res.body, /secret/);
});
