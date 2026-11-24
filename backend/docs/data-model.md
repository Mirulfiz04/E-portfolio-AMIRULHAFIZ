# Data model and access patterns

One DynamoDB table (`PAY_PER_REQUEST`). Partition key `id` (string).

## Items

| Item | Key | Attributes | Notes |
|---|---|---|---|
| Review | `id` = random uuid | `status` (`pending` or `approved`), `createdAt` (ISO 8601 UTC), `rating` (1-5), `name`, `role` (optional), `comment`, `expiresAt` (epoch seconds, **pending only**), `approvedAt` (set on approval) | Rejected reviews are deleted, so there is no `rejected` status. |
| Counter | `id` = `COUNTER#visits` | `visits` (number) | Created by the first `ADD`. Has no `status`, so it is not in the index. |

Global secondary index **`ReviewsByStatus`**: partition key `status`, sort key `createdAt`. Projects `name`, `role`, `rating`, `comment` (the table key `id` is always included). Because only reviews have `status`, the index is sparse.

TTL attribute: `expiresAt`. Approving a review removes it, so approved reviews never expire.

## Access patterns

| # | Operation | How | Function | Permission |
|---|---|---|---|---|
| A1 | Store a new review | `PutItem`, condition `attribute_not_exists(id)` | CreateReview | `PutItem` on table |
| A2 | Count pending reviews (cap) | `Query` index, `status = pending`, `Select COUNT`, `Limit = MaxPending` | CreateReview | `Query` on index |
| A3 | List approved, newest first | `Query` index, `status = approved`, `ScanIndexForward = false`, `Limit = 100` | ListReviews | `Query` on index |
| A4 | List pending for the owner | same query with `status = pending` | Moderate | `Query` on index |
| A5 | Approve | `UpdateItem` `SET status, approvedAt REMOVE expiresAt`, condition `status = pending` | Moderate | `UpdateItem` on table |
| A6 | Reject / delete | `DeleteItem`, condition `status = pending` (reject) or `attribute_exists(id)` (delete) | Moderate | `DeleteItem` on table |
| A7 | Count a visit | `UpdateItem` `ADD visits 1` on the counter key | HitVisit | `UpdateItem`, `LeadingKeys = COUNTER#visits` |
| A8 | Read the count | `GetItem` on the counter key | GetVisit | `GetItem`, `LeadingKeys = COUNTER#visits` |

Limits worth knowing: the pending list for the owner is capped at 100 per call. The 200-pending cap and the 100-review public list are deliberate; a bigger guestbook would need pagination (not built).
