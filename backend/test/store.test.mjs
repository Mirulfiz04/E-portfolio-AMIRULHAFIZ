import test from "node:test";
import assert from "node:assert/strict";
import { createDynamoStore } from "../src/store.mjs";

// Fake SDK: command classes just remember their input, the client records what it was sent.
const cmd = Object.fromEntries(["PutCommand", "QueryCommand", "GetCommand", "UpdateCommand", "DeleteCommand"].map((kind) => [kind, class { constructor(input) { this.kind = kind; this.input = input; } }]));
const make = (respond = () => ({})) => {
  const sent = [];
  const client = { send: async (c) => { sent.push(c); return respond(c); } };
  return { sent, store: createDynamoStore({ client, cmd, table: "T" }) };
};
const failed = () => Object.assign(new Error("x"), { name: "ConditionalCheckFailedException" });

test("putReview refuses to overwrite an existing id", async () => {
  const { sent, store } = make();
  await store.putReview({ id: "1" });
  assert.equal(sent[0].kind, "PutCommand");
  assert.equal(sent[0].input.ConditionExpression, "attribute_not_exists(id)");
});

test("list and count query the status index; list is newest first and bounded", async () => {
  const { sent, store } = make((c) => (c.input.Select === "COUNT" ? { Count: 7 } : { Items: [{ id: "1" }] }));
  assert.equal(await store.countByStatus("pending", 200), 7);
  assert.deepEqual(await store.listByStatus("approved", 100), [{ id: "1" }]);
  const [count, list] = sent.map((c) => c.input);
  assert.equal(count.IndexName, "ReviewsByStatus");
  assert.deepEqual([count.Select, count.Limit], ["COUNT", 200]);
  assert.equal(list.ScanIndexForward, false);
  assert.equal(list.Limit, 100);
  assert.deepEqual(list.ExpressionAttributeValues, { ":s": "approved" });
});

test("approve sets status, removes the TTL attribute and only applies to pending reviews", async () => {
  const { sent, store } = make();
  assert.equal(await store.approve("1", "2026-11-24T00:00:00Z"), true);
  assert.match(sent[0].input.UpdateExpression, /REMOVE expiresAt/);
  assert.match(sent[0].input.ConditionExpression, /#s = :pending/);
});

test("conditional failures return false; other errors still throw", async () => {
  const cond = make(() => { throw failed(); }).store;
  assert.equal(await cond.approve("1", "t"), false);
  assert.equal(await cond.reject("1"), false);
  assert.equal(await cond.remove("1"), false);
  const other = make(() => { throw Object.assign(new Error("x"), { name: "AccessDeniedException" }); }).store;
  await assert.rejects(other.approve("1", "t"), { name: "AccessDeniedException" });
});

test("reject only deletes pending reviews", async () => {
  const { sent, store } = make();
  await store.reject("1");
  assert.equal(sent[0].kind, "DeleteCommand");
  assert.match(sent[0].input.ConditionExpression, /#s = :pending/);
});

test("the visit counter is one atomic ADD on a fixed key", async () => {
  const { sent, store } = make(() => ({ Attributes: { visits: 42 } }));
  assert.equal(await store.incrementVisits(), 42);
  assert.deepEqual(sent[0].input.Key, { id: "COUNTER#visits" });
  assert.equal(sent[0].input.UpdateExpression, "ADD #v :one");
});

test("getVisits is 0 before the first visit", async () => {
  assert.equal(await make(() => ({})).store.getVisits(), 0);
  assert.equal(await make(() => ({ Item: { visits: 5 } })).store.getVisits(), 5);
});
