import test from "node:test";
import assert from "node:assert/strict";
import { validateReview } from "../src/validate.mjs";
import { GOOD } from "./helpers.mjs";

const bad = (patch) => validateReview({ ...GOOD, ...patch });

test("accepts a good review and keeps only whitelisted fields", () => {
  const r = validateReview({ ...GOOD, admin: true, status: "approved", id: "x" });
  assert.deepEqual(r, { ok: true, value: { rating: 5, name: "Aina", role: "Recruiter", comment: "Clear, tidy projects." } });
});

test("rating: whole number 1-5, digit strings from a form are fine", () => {
  assert.equal(bad({ rating: "4" }).value.rating, 4);
  for (const rating of [0, 6, 4.5, "6", "abc", null, undefined, [], NaN]) assert.equal(bad({ rating }).ok, false, String(rating));
});

test("name: 1-40 characters, trimmed", () => {
  assert.equal(bad({ name: "a".repeat(40) }).ok, true);
  assert.equal(bad({ name: "a".repeat(41) }).ok, false);
  assert.equal(bad({ name: "   " }).ok, false);
  assert.equal(bad({ name: "  Aina  " }).value.name, "Aina");
});

test("comment: 5-500 characters, emoji count as one", () => {
  assert.equal(bad({ comment: "1234" }).ok, false);
  assert.equal(bad({ comment: "12345" }).ok, true);
  assert.equal(bad({ comment: "a".repeat(500) }).ok, true);
  assert.equal(bad({ comment: "a".repeat(501) }).ok, false);
  assert.equal(bad({ comment: "😀".repeat(500) }).ok, true);
});

test("role is optional, but limited to 60 characters", () => {
  assert.equal("role" in validateReview({ rating: 5, name: "A", comment: "hello there" }).value, false);
  assert.equal("role" in bad({ role: "  " }).value, false);
  assert.equal(bad({ role: "r".repeat(61) }).ok, false);
});

test("wrong types and control characters are rejected", () => {
  assert.equal(bad({ name: 5 }).ok, false);
  assert.equal(bad({ comment: { a: 1 } }).ok, false);
  assert.equal(bad({ name: "A\nB" }).ok, false); // single-line field
  assert.equal(bad({ name: "A\u0000B" }).ok, false);
  assert.equal(bad({ comment: "line one\nline two" }).ok, true); // comment may have newlines
  assert.equal(bad({ comment: "bell\u0007 char" }).ok, false);
});

test("error output names the fields without echoing the input", () => {
  const r = bad({ name: "", rating: 9 });
  assert.deepEqual(Object.keys(r.errors).sort(), ["name", "rating"]);
});
