# Environment plan: local, then dev, then prod

| | Local | Dev | Prod |
|---|---|---|---|
| Where | your PC | AWS, stack `portfolio-backend-dev` | AWS, stack `portfolio-backend` |
| Purpose | unit tests, fast feedback | prove the template and the contract on real AWS with throwaway data | the real site |
| `AllowedOrigin` | n/a | `http://localhost:<port>` (for the later site branch) or the real origin | `https://mirulfiz04.github.io` (must be https) |
| `LogRetentionDays` | n/a | 3 | 14 |
| `AlertEmail` | n/a | empty (the budget is account-wide, one is enough) | your email |
| Data | in memory | disposable, deleted after each test round | real reviews |

Use separate AWS accounts for dev and prod if you ever work with a team. For this learning project one account with two stacks is fine. The same `template.yaml` builds both; only parameters differ.

## Promotion path
1. **Local**: `node --test` all green. `sam validate --lint`.
2. **Dev**: `sam build`, then `sam deploy --stack-name portfolio-backend-dev --guided`. Run the smoke test below. Fix anything, redeploy.
3. **Prod**: same commit, `sam deploy --stack-name portfolio-backend --guided` with the prod parameters and `AlertEmail`. Run the smoke test. Then (later branch) point the site at the prod `ApiUrl`.
4. Delete the dev stack when you are not using it (`sam delete --stack-name portfolio-backend-dev`).

## Smoke test (after every deploy; all of this is **deploy only**)
Set `$api` to the `ApiUrl` output. Put `{"rating":5,"name":"Smoke","comment":"smoke test review"}` in `review.local.json`.
```powershell
curl.exe -s -w "`n%{http_code}`n" -X POST "$api/visits" -H "Origin: https://mirulfiz04.github.io"            # 200 {"visits":n}
curl.exe -s -w "`n%{http_code}`n" "$api/visits"                                                              # 200, same n
curl.exe -s -w "`n%{http_code}`n" -X POST "$api/reviews" -H "content-type: application/json" -H "Origin: https://mirulfiz04.github.io" --data "@review.local.json"   # 202 pending
curl.exe -s -w "`n%{http_code}`n" "$api/reviews"                                                             # 200, does NOT contain "Smoke"
curl.exe -s -w "`n%{http_code}`n" -X POST "$api/reviews" -H "content-type: application/json" -H "Origin: https://evil.example" --data "@review.local.json"          # 403
curl.exe -s -w "`n%{http_code}`n" -X POST "$api/reviews" -H "content-type: application/json" --data "{}"      # 400 with field names
curl.exe -s -w "`n%{http_code}`n" -X POST "$api/moderate"                                                    # 404: moderation is not on the API
```
Then moderate (see README): `list` shows the Smoke review, `approve` it, `GET /reviews` now shows it, `delete` it (cleanup). Finally check the response headers of a browser-style preflight: `curl.exe -i -X OPTIONS "$api/reviews" -H "Origin: https://mirulfiz04.github.io" -H "Access-Control-Request-Method: POST"` returns `access-control-allow-origin` for that origin only.

## Monitoring and alarms
Implemented: the cost budget (50% and 100%), 14-day log groups. **Not implemented yet** (proposed, needs your decision because alarms add resources): CloudWatch alarms on Lambda `Errors` greater than 0, API `5xx` greater than 0, and `Throttles`, each notifying an SNS email topic. Until then, look at the Lambda and API Gateway metrics in the console after each deploy and once a week. Log queries use the error class name, for example `fields @message | filter evt = "review_error"`.

## Rollback
- **Failed update**: CloudFormation rolls back by itself. Check the stack events, fix, redeploy.
- **Bad release that deployed**: `git checkout <last good commit>`, `sam build`, `sam deploy`. Stateless code rolls back in minutes.
- **Data**: there is no point-in-time recovery (it costs extra). Teardown and replacement deletes reviews, so export approved reviews first if they matter (`aws dynamodb scan`, or `list` and keep a copy). To protect prod data from an accidental stack delete, consider `DeletionPolicy: Retain` on the table (not set, your decision).
- **Emergency stop** (cost or abuse): `sam delete --stack-name <stack>`. The site falls back to `reviews.json` and hides the counter.

Everything in the rollback section is **deploy only** and unrehearsed.
