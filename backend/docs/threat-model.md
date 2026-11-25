# Threat model (brief)

Assets: the owner's AWS bill, the integrity of what the public sees, reviewers' names and comments.
Attackers: anonymous internet users, bots, a curious or malicious reviewer.
"Deploy only" means no offline test can prove it.

| # | Threat | Control | Test |
|---|---|---|---|
| T1 | Spam or flood of reviews | Honeypot, 4 KB cap, throttling, cap of 200 pending (`503`) | `reviews.test.mjs` (honeypot, cap, size). Throttle: **deploy only** |
| T2 | Unmoderated content shown publicly | Stored `pending`; public read queries `approved` only | `reviews.test.mjs`, `acceptance.test.mjs` |
| T3 | Client sets its own status or id (mass assignment) | Validation keeps a whitelist of fields; status, id and expiry are set by the server | `acceptance.test.mjs` |
| T4 | Someone approves or deletes reviews without being the owner | No HTTP route or function URL for moderation; invoke needs IAM; handler ignores HTTP events; ids must be uuids | `acceptance.test.mjs`, `template.test.mjs`. The IAM check itself: **deploy only** |
| T5 | Script or HTML in a review (XSS) | Control characters rejected; text stored as typed; **the site must escape on output** (it does today via `esc()`). Database expressions are fixed strings with placeholders, so there is no injection path | `validate.test.mjs`. Site escaping: Developer E's tests |
| T6 | Oversized or malformed requests | Content-type and JSON checks, 4 KB cap (base64 safe) | `reviews.test.mjs` |
| T7 | Requests from another website | CORS for one origin; wrong `Origin` gets `403` | `reviews.test.mjs`, `visits.test.mjs`. Browser behaviour: **deploy only** |
| T8 | Personal data leaks through logs or errors | Handlers log an event name and error class only; generic `500` bodies; no access logs | `reviews.test.mjs`, `visits.test.mjs` |
| T9 | A bug or compromise in one function reaches more data | One role per function, resource-level permissions, `LeadingKeys` on the counter | `template.test.mjs`. Real denial: **deploy only** (try `aws iam simulate-principal-policy`) |
| T10 | Cost abuse ("denial of wallet") | Throttling, budget alert at 50% and 100%, stack teardown | Resources: `template.test.mjs`. Worst case about $11-12/month and alert delay: **deploy only** |
| T11 | Reviewer data kept too long | 30-day TTL on pending, immediate delete on reject, owner `delete` on request, 14-day logs | `store.test.mjs`, `moderate.test.mjs`. TTL deletion: **deploy only** |
| T12 | Secrets or account ids committed | Nothing to hold; `samconfig.toml` and payload files git-ignored | `template.test.mjs` (scan) |
| T13 | Visit counter inflated | **Accepted risk**: the count is public and not important; one hit per session is a site convention, not enforced | n/a |

Not covered: DDoS beyond what API Gateway absorbs (no WAF, to avoid its cost), a compromised owner IAM user (use MFA), a malicious approved review (the owner reads each one before approving).
