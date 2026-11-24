# Requirements and acceptance criteria

Roles: **Visitor** (anyone on the portfolio site), **Owner** (the portfolio's author, holds the AWS account).

"Proven by" names the test file that checks it offline. **Deploy only** means a real deployment is needed to prove it.

| ID | Requirement | Acceptance criteria | Proven by |
|---|---|---|---|
| R1 | A visitor can leave a review. | A valid `POST /reviews` returns `202 {"status":"pending"}`. The review is stored as `pending` with a 30-day expiry. | `reviews.test.mjs` (stored as pending), `acceptance.test.mjs` (full flow) |
| R2 | Bad input is refused with a useful, safe message. | Out-of-range rating, empty or over-long name/comment, wrong types and control characters give `400` listing field names only. Nothing is stored. Wrong content type gives `415`, bad JSON `400`, body over 4 KB `413`. | `validate.test.mjs`, `reviews.test.mjs` |
| R3 | **Approve-first**: nothing is public until the owner approves it. | `GET /reviews` never returns a pending review. It returns only approved reviews, newest first, with the fields `name`, `role`, `rating`, `comment`, `date`. A client cannot choose its own status or id. | `reviews.test.mjs`, `acceptance.test.mjs` |
| R4 | Only the owner can moderate. | Moderation has no HTTP route and no function URL. The handler ignores HTTP-shaped requests. Actions: `list`, `approve`, `reject` (pending only), `delete`. Ids must be review uuids, never the counter item. | `moderate.test.mjs`, `acceptance.test.mjs`, `template.test.mjs`. IAM enforcement: **deploy only** |
| R5 | The site can show a visit count. | `POST /visits` adds one and returns the total. `GET /visits` returns the total without adding. The increment is one atomic DynamoDB `ADD`. | `visits.test.mjs`, `store.test.mjs`. Concurrency: **deploy only** |
| R6 | The API resists abuse. | Wrong `Origin` gives `403`. A filled honeypot stores nothing. At most 200 pending reviews (`503` beyond). Throttled at 2 requests/s API-wide and 1/s for `POST /reviews`. | `reviews.test.mjs`. Throttling and CORS in a browser: **deploy only** |
| R7 | Reviewer data is kept minimal and deleted on a schedule. | No IP, cookie or email is stored. Logs hold no names, comments or error messages. Pending reviews expire after 30 days, rejected are deleted at once, logs after 14 days. | `reviews.test.mjs` (logs), `store.test.mjs` (TTL attribute), `template.test.mjs`. Actual TTL deletion and log expiry: **deploy only** |
| R8 | Cost is visible and the stack can be removed. | A monthly budget with email alerts at 50% and 100%. `sam delete` removes everything. | `template.test.mjs` (resources exist). Alerts arriving and teardown: **deploy only** |
| R9 | The contract stays in sync with the implementation. | Every route in `template.yaml` appears in `openapi.yaml`. | `acceptance.test.mjs` |

Out of scope: user accounts, editing a review after sending it, email notifications to the owner, per-visitor rate limits, the site change (a later branch by Developer E, after the contract is agreed).
