import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Guardrails on template.yaml. Plain text checks, since parsing YAML would need a dependency.
const t = readFileSync(new URL("../template.yaml", import.meta.url), "utf8");
const count = (re) => (t.match(re) ?? []).length;
// A resource block runs from "  Name:" to the next line indented by exactly two spaces. Empty means a typo, so fail loudly.
const block = (name) => {
  const lines = t.split("\n");
  const from = lines.indexOf(`  ${name}:`);
  assert.notEqual(from, -1, `resource ${name} not found`);
  let to = from + 1;
  while (to < lines.length && !/^ {0,2}\S/.test(lines[to])) to++;
  return lines.slice(from, to).join("\n");
};

test("CORS allows only the portfolio origin", () => {
  assert.match(t, /AllowOrigins:\n\s+- !Ref AllowedOrigin/);
  assert.match(t, /AllowedOrigin:\n[\s\S]*?Default: https:\/\/mirulfiz04\.github\.io\n/);
  assert.doesNotMatch(t, /AllowOrigins:[^\n]*\*/);
});

test("moderation has no HTTP route and no function URL", () => {
  assert.doesNotMatch(block("ModerateFunction"), /Events:/);
  assert.doesNotMatch(t, /FunctionUrlConfig|moderate["' ]*\n\s+Method/i);
  assert.equal(count(/Type: HttpApi/g), 4); // POST/GET /reviews, POST/GET /visits
});

test("every function has its own log group with retention", () => {
  const fns = count(/Type: AWS::Serverless::Function/g);
  assert.equal(fns, 5);
  assert.equal(count(/Type: AWS::Logs::LogGroup/g), fns);
  assert.equal(count(/RetentionInDays: !Ref LogRetentionDays/g), fns);
});

test("IAM is least-privilege: no wildcard actions or resources", () => {
  assert.doesNotMatch(t, /Action:\s*\[?\s*["']?(\*|dynamodb:\*)/);
  assert.doesNotMatch(t, /Resource:\s*["']?\*/);
  assert.equal(count(/Policies:/g), 5);
});

test("the counter functions are limited to the counter item", () => {
  for (const name of ["HitVisitFunction", "GetVisitFunction"]) assert.match(block(name), /dynamodb:LeadingKeys: \["COUNTER#visits"\]/);
});

test("throttling is configured and unapproved reviews expire by TTL", () => {
  assert.match(t, /DefaultRouteSettings:\n\s+ThrottlingBurstLimit/);
  assert.match(t, /"POST \/reviews":/);
  assert.match(t, /TimeToLiveSpecification:\n\s+AttributeName: expiresAt\n\s+Enabled: true/);
});

test("no secrets or account details are baked into the template", () => {
  assert.doesNotMatch(t, /AKIA[0-9A-Z]{16}|\b\d{12}\b|@[a-z0-9-]+\.(com|my|net)/i);
});
