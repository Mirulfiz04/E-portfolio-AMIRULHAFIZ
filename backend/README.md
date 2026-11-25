# Portfolio backend (AWS, learning project)

A small serverless backend for the portfolio's guestbook and visit counter, built with AWS SAM.
It replaces two things on the site today: the guestbook's `mailto:` fallback and the third-party
visit counter (abacus). **Status: written and unit-tested locally. Not deployed, never run against
AWS** (see [What is unproven](#what-is-unproven-until-you-deploy)).

Nothing here touches the site, `package.json`, the workflows or `_config.yml`. The folder is
self-contained, and the site's publishing job should exclude `backend/`.

## Architecture

```
 Browser (https://mirulfiz04.github.io)
        │  HTTPS, JSON
        ▼
 API Gateway HTTP API ── CORS: that origin only ── throttling per route
   │  POST /reviews ─► CreateReviewFunction ─┐
   │  GET  /reviews ─► ListReviewsFunction  ─┤
   │  POST /visits  ─► HitVisitFunction     ─┼─► DynamoDB table  (reviews + counter item)
   │  GET  /visits  ─► GetVisitFunction     ─┘        ▲  index ReviewsByStatus (status, createdAt)
                                                       │
 You (IAM user, AWS CLI) ─ lambda:Invoke ─► ModerateFunction   (no URL, no API route)
 CloudWatch Logs: one log group per function, 14-day retention
```

| Piece | Choice | Why |
|---|---|---|
| API | API Gateway **HTTP API** | Cheaper and simpler than REST API; built-in CORS and throttling are enough here. |
| Compute | Lambda, Node 22, **arm64**, 128 MB, 5 s timeout | Small, short work. arm64 is the cheaper architecture, and nothing here needs x86. |
| Database | **One DynamoDB table**, on-demand billing | No capacity to manage and no idle cost. One table means one thing to learn and tear down; the counter is just another item (`id = COUNTER#visits`). |
| Public read | Index `ReviewsByStatus` (status + createdAt) | A query for `status = approved` returns only approved reviews, newest first. The counter has no `status`, so it never appears in the index (a *sparse index*). |
| Moderation | `ModerateFunction`, **invoked with the AWS CLI, not over HTTP** | The brief said it must not be a public unauthenticated endpoint. A function with no trigger can only run through the Lambda Invoke API, which AWS checks against *your* IAM permissions. That is real authentication with no extra service, no password, no token to leak. An HTTP route with an IAM authorizer would also work, but then you need to sign requests by hand. |
| Packaging | No npm dependencies | The Node Lambda runtime already includes AWS SDK v3. Tests use fakes, so `npm install` is never needed. |

Changes from the suggested design, with reasons: moderation via direct invoke instead of an API
route (above); a cap on pending reviews and a honeypot field (spam control without storing IP
addresses); arm64 and one table (cost and simplicity).

## API contract (what the site calls)

Base URL: the `ApiUrl` stack output, for example `https://abc123.execute-api.ap-southeast-1.amazonaws.com`.
All bodies are JSON. Browsers must send `content-type: application/json`, which also triggers a CORS preflight.

### `GET /reviews`
Approved reviews only, newest first, at most 100. The shape is the same as the site's `reviews.json`,
so `renderReviews` needs no change.
```json
[{ "name": "Aina", "role": "Recruiter", "rating": 5, "comment": "Clear, tidy projects.", "date": "2026-11-20" }]
```
`role` is left out when empty. Cached for 60 s (`cache-control: public, max-age=60`).

### `POST /reviews`
```json
{ "rating": 5, "name": "Aina", "role": "Recruiter", "comment": "Clear, tidy projects.", "_gotcha": "" }
```
| Field | Rule |
|---|---|
| `rating` | whole number 1 to 5 (`"4"` from a form is accepted) |
| `name` | 1 to 40 characters, single line |
| `role` | optional, up to 60 characters, single line |
| `comment` | 5 to 500 characters, newlines allowed |
| `_gotcha` | the hidden honeypot field. If non-empty the API answers `202` and stores nothing. |

Control characters are rejected. Fields not listed are ignored. The body must be at most 4 KB.

Success: `202 {"status":"pending"}`. The review is **not public** until you approve it.

| Status | Body | Meaning |
|---|---|---|
| 400 | `{"error":"invalid","fields":{"name":"is required"}}` | validation failed (field names only, input is never echoed) |
| 400 | `{"error":"invalid_json"}` | not a JSON object |
| 403 | `{"error":"forbidden_origin"}` | `Origin` header is not the allowed origin |
| 413 | `{"error":"too_large"}` | body over 4 KB |
| 415 | `{"error":"unsupported_media_type"}` | not `application/json` |
| 429 | (from API Gateway) | throttled |
| 503 | `{"error":"busy"}` + `retry-after` | too many unapproved reviews waiting; ask the visitor to try later |
| 500 | `{"error":"server_error"}` | unexpected failure, nothing leaked |

### `POST /visits`
Counts one visit and returns the total: `200 {"visits":1234}`. The site should call it **once per
browser session** and `GET` the rest of the time, exactly like the current counter does with
`sessionStorage`. The server cannot enforce "one per session" itself, because it deliberately does not
store IP addresses or cookies.

### `GET /visits`
`200 {"visits":1234}` without counting. Cached for 30 s.

### Sketch of the site change (not applied, the site is out of scope)
```js
const API = "https://<ApiUrl output>";
fetch(`${API}/reviews`).then((r) => r.json());                       // replaces fetch("reviews.json")
fetch(`${API}/reviews`, { method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ rating: Number(f.get("rating")), name: f.get("name"), role: f.get("role"),
                         comment: f.get("comment"), _gotcha: f.get("_gotcha") }) });
fetch(`${API}/visits`, { method: seen ? "GET" : "POST" }).then((r) => r.json()); // -> { visits }
```
Keep `reviews.json` as the fallback when the API is down. The site has no Content-Security-Policy today,
so no header change is needed. Because names are now stored on a server, add a one-line privacy note
to the review form (what is stored, that it is deleted after 30 days if not approved).

## Security and privacy design

- **Validation and size limits**: `src/validate.mjs` (field rules), `src/http.mjs` (4 KB body cap, content type, JSON object check). Output is HTML-escaped by the site; the API stores what was typed.
- **Throttling**: API-wide 2 requests/s (burst 5), and `POST /reviews` 1/s (burst 3). These are totals for the whole API, not per visitor, so a determined attacker can use up the quota and block real visitors. That is the trade-off of not tracking IPs.
- **Pending cap**: at most `MaxPending` (default 200) unapproved reviews at once, so spam cannot grow the table.
- **CORS**: only `https://mirulfiz04.github.io`. CORS protects browsers; `curl` ignores it. The handler also rejects a wrong `Origin` on POST routes, and throttling plus the cap cover non-browser abuse.
- **Approve-first**: new reviews are stored `pending`. The public read is a query for `approved` only, and it returns a fixed list of fields (never `id` or `status`).
- **Least-privilege IAM, one role per function** (see `template.yaml`):

  | Function | DynamoDB permissions |
  |---|---|
  | CreateReview | `PutItem` on the table, `Query` on the status index |
  | ListReviews | `Query` on the status index |
  | HitVisit | `UpdateItem`, only for the key `COUNTER#visits` (`dynamodb:LeadingKeys`) |
  | GetVisit | `GetItem`, only for the key `COUNTER#visits` |
  | Moderate | `Query` on the index, `UpdateItem`, `DeleteItem` (invokable only by you) |

  SAM also attaches the standard Lambda logging policy to every function; that is a known small
  exception (it lets a function create its own log group).
- **Logs**: each function has its own log group with 14-day retention. Handlers log only an event name and an error *class name*. They never log request bodies, names, comments, IP addresses or error messages (which can echo data). A test checks this. API Gateway access logging is **not** enabled, so no IP addresses are written by this stack.
- **No secrets in the repo**: nothing to hold. There are no API keys, passwords or account IDs in any file (a test scans the template). Your email for cost alerts is passed at deploy time and is not stored in the repo. `samconfig.toml` is git-ignored.

### What reviewer data is held, and for how long

| Data | Where | Retention |
|---|---|---|
| Name, optional role, rating, comment, timestamp | DynamoDB | **Pending: auto-deleted after 30 days** (DynamoDB TTL on `expiresAt`; deletion can lag by up to about 48 hours). **Rejected: deleted at once.** **Approved: kept until you delete it** (and publicly visible by design). |
| Visit count | DynamoDB | One number, no personal data. |
| IP address, cookies, email, user agent | not stored | n/a |
| Lambda logs | CloudWatch | 14 days, no personal data in them. |

A reviewer who asks to be removed: run the `delete` moderation action for their review id (found
with `list`, or from the public page if approved). Removing everything: [Teardown](#teardown).

### Known limits

- **The pending cap can be used against you.** With 200 unapproved reviews waiting, new reviews get `503`. A spammer who fills the cap blocks real reviewers until you reject the spam (`reject` frees a slot at once) or the 30-day expiry removes it. Without tracking IPs there is no way to tell spam from real visitors at the API. Check the pending list now and then; raise `MaxPending` only if you accept more stored spam.
- **The site must change before it can use this API.** Today the form sends `FormData` (or a `mailto:` link); this API accepts only `application/json`. That conversion belongs to the later site branch.
- **The visit counter starts at 0.** The abacus total is not carried over. If you want to keep the current number, set it once after deploy with a one-off `aws dynamodb update-item` on the item `COUNTER#visits` (put the key and values in a JSON file to avoid PowerShell quoting problems). Until the site is switched, the two counters are independent.

## What each AWS service teaches

| Service | What you learn building this |
|---|---|
| **API Gateway (HTTP API)** | routes, integrations, CORS and preflight, throttling, stages, why the API URL is public |
| **Lambda** | handler contract, cold starts, memory/timeout sizing, environment variables, invoking without HTTP |
| **DynamoDB** | partition keys, on-demand billing, a global secondary index, sparse indexes, atomic counters (`ADD`), conditional writes, TTL, `LeadingKeys` IAM conditions |
| **IAM** | one role per function, resource-level permissions, conditions, who may invoke what |
| **CloudWatch Logs** | log groups, retention, why logging bodies is a privacy bug |
| **CloudFormation / SAM** | infrastructure as code, parameters, outputs, stack create/delete, drift-free teardown |
| **AWS Budgets** | cost alerts, and why alerts are not a spending limit |

## Cost estimate

**Date: 2026-11-24.** Prices were read from AWS's public pricing pages that day. Some figures came from
the pages' worked examples rather than the price tables, **the pages did not show Singapore
(`ap-southeast-1`) prices**, and the arm64 Lambda rate was not stated directly. So the numbers below
use **US East (N. Virginia) rates and are indicative only**. Singapore is usually somewhat higher. Check
the [AWS Pricing Calculator](https://calculator.aws/) for your region before relying on any figure.

Rates used: API Gateway HTTP API $1.00 per million requests; Lambda $0.20 per million requests plus
about $0.0000133 per GB-second (arm64, unconfirmed); DynamoDB on-demand $0.625 per million writes and
$0.125 per million reads; CloudWatch Logs $0.50 per GB ingested; DynamoDB storage and the counter are
negligible at this size.

Assumptions: each visit makes about 2 API calls (one `/visits` call, one `GET /reviews`); each call runs
about 50 ms at 128 MB; each invocation writes about 0.6 KB of logs; 30 review submissions a month.

| Scenario | API calls/month | Estimated cost, before any free tier |
|---|---|---|
| Light: 3,000 visits/month | about 6,000 | **about $0.01 to $0.02** |
| Busier: 100,000 visits/month | about 200,000 | **about $0.40** |
| Worst case: someone saturates the 2 requests/s throttle all month | about 5.2 million | **roughly $11 to $12** (API Gateway about $5, DynamoDB writes about $3, logs about $1.5, Lambda about $1.5) |

**This is not promised to be free.** About free tiers: AWS's pages say new accounts get credits (up to
$200 over 6 months) on a Free plan that closes after 6 months or when credits run out, limited to select
services, and that an upgrade to the paid plan is needed to keep running. The pages I read did not confirm
whether API Gateway, Lambda and DynamoDB are all included in the Free plan, or how long each allowance
lasts. Check **Billing > Free Tier** in your account. The throttle caps the worst case but is **not a
hard spending limit**; to lower the ceiling, lower `ThrottlingRateLimit` in `template.yaml`.

### Budget alarm (do this before anything else)

Budgets are account-wide and **alert only** (they are typically a day or so late and never stop
anything). Choose one:

- **Through the stack**: pass `AlertEmail=you@example.com` (and optionally `MonthlyBudgetUsd`, default 5) at deploy. It creates a budget that emails you at 50% and 100% of the limit. AWS says the first two action-enabled budgets are free, and plain budget notifications are free.
- **By hand**: console > Billing > Budgets > Create budget > "Cost budget" > monthly, $5, email alerts at 50% and 100%.

Then confirm the subscription email AWS sends. If an alert arrives that you did not expect, run the
[Teardown](#teardown) first and investigate after.

## Prerequisites (for you to do; I did not install or create anything)

1. An AWS account (new accounts: set MFA on the root user, create an everyday IAM user, and never use root for deploys).
2. Install the [AWS CLI v2](https://docs.aws.amazon.com/cli/) and the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html). Node 22 (or newer) is needed for the tests only.
3. `aws configure` (or `aws login`) with your IAM user. Keep credentials out of this repo.
4. Pick a **region**. Singapore (`ap-southeast-1`) is closest to Malaysia, which helps latency; `us-east-1` has the most reference material. Prices differ, so check the calculator.
5. Decide the **alert email** for the budget.

## Run the tests (no AWS needed)

```powershell
cd backend
node --test
```
Currently 50 tests: validation rules, handler behaviour with an in-memory store, end-to-end acceptance checks (approve-first, unauthorised moderation, no client-chosen status), contract drift between `template.yaml` and `openapi.yaml`, the exact DynamoDB
requests (with a fake client), moderation, the approve-first rule, no personal data in logs, and
guardrails on `template.yaml` (CORS origin, no wildcard IAM, no HTTP route for moderation, log retention).

## Deploy (you run these)

```powershell
cd backend
sam validate --lint
sam build
sam deploy --guided --parameter-overrides AlertEmail=you@example.com
```
`--guided` asks for the stack name (for example `portfolio-backend`), region, and whether to save
`samconfig.toml` (git-ignored). Allow the IAM roles it creates. When it finishes, note the outputs
`ApiUrl` and `ModerateFunctionName`.

Smoke test (replace the URL):
```powershell
$api = "https://<id>.execute-api.<region>.amazonaws.com"
Invoke-RestMethod "$api/visits" -Method Post -ContentType "application/json" -Headers @{ Origin = "https://mirulfiz04.github.io" }
Invoke-RestMethod "$api/reviews"
```

### Moderate (owner only)

Create `list.local.json` containing `{"action":"list"}`, then:
```powershell
aws lambda invoke --function-name <ModerateFunctionName> --payload fileb://list.local.json out.json
Get-Content out.json
```
Put `{"action":"approve","id":"<uuid from the list>"}` in `approve.local.json` and invoke the same way.
Actions: `list` (pending reviews), `approve`, `reject` (pending only, deletes), `delete` (any review).
`*.local.json` and `out.json` are git-ignored because they may hold reviewer data.

## Teardown

```powershell
sam delete --stack-name portfolio-backend --region <region>
```
This removes the API, functions, table (**and every review in it**), log groups and the budget the stack
created. Afterwards, check in the console that the CloudFormation stack is gone, DynamoDB has no table
left, and Billing shows no new charges. A budget you created by hand is separate, delete it yourself.

## How to describe this honestly on the portfolio

Say what is true:
- "Serverless guestbook and visit counter on AWS (API Gateway, Lambda, DynamoDB), defined with SAM." Add "deployed" and the date **only after you actually deploy it**. Until then: "designed and unit-tested locally, not deployed".
- Mention the real design decisions: approve-first moderation, owner-only moderation by IAM-authenticated invoke, least-privilege role per function, throttling, 30-day retention, cost alarm.
- Say what it is: a small learning project with a handful of visitors, not a production system. Do not claim scale, uptime or load testing, and do not call it "secure" without qualifiers (say what you did).
- Link the `backend/` folder and this README.

## What is unproven until you deploy

- `template.yaml` has **never been validated by `sam validate`/CloudFormation or deployed**. The tests only read it as text. There may be a syntax or property error (the `RouteSettings` key format and the `LoggingConfig` property are the first places I would look).
- Nothing has run against real DynamoDB: the index, TTL, conditional writes, `LeadingKeys` conditions and IAM permissions are checked only through fakes.
- The Node 22 runtime, and the AWS SDK being available at the paths imported in `src/store.mjs`, are assumptions about the Lambda runtime.
- CORS, throttling and the 4 KB cap at the API Gateway level have not been exercised.
- Prices, free-tier terms and worst-case figures are estimates (see the cost section).
- `openapi.yaml` and `template.yaml` were never parsed by a YAML or OpenAPI validator (none was available); the tests read them as text. Run `sam validate --lint` and an OpenAPI linter before relying on them.
- The site was not changed, so the end-to-end flow (form to API to moderation to public list) is untested.

## Decisions for you

1. **Region**: Singapore (closer) or us-east-1 (cheapest and most documented).
2. **Alert email** for the budget, and the monthly limit (default $5).
3. **Deploy or not**, and when. Everything above is local only.
4. Whether to **change the site** to call this API (needs a separate change outside `backend/`, plus the privacy note).

## Project documents

| File | What it covers |
|---|---|
| [docs/requirements.md](docs/requirements.md) | requirements R1-R9, acceptance criteria, the test (or "deploy only") that proves each |
| [openapi.yaml](openapi.yaml) | the API contract with request, response and error examples (the table above is the short form) |
| [docs/data-model.md](docs/data-model.md) | table items, the status index, and every access pattern with its IAM permission |
| [docs/threat-model.md](docs/threat-model.md) | threats, the control for each, and the test for each |
| [docs/environments.md](docs/environments.md) | local, dev, prod; promotion path; smoke test; monitoring; rollback |

Frontend integration is a separate, later branch, after this contract is agreed.
