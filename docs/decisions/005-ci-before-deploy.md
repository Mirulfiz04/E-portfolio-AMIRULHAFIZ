# Nothing is deployed unless CI passes, and the live site is verified

- **Date:** 2026-11-24 (#6, #8, PR #9)
- **Status:** accepted

**Context.** Before this, every push to `main` was published whether or not anything had checked it.

**Decision.** Pull requests run CI. Merging to `main` runs CI, then build, then deploy (only from `main`), then `scripts/verify-live.mjs`. `ci.yml` is reused by the pipeline and has no push trigger, so it does not run twice.

**Consequences.** A red change cannot ship, and a bad deploy is noticed. Branch protection that requires **CI passed** is a GitHub setting the owner must turn on; it is not in the code. Verify can only match hand-bumped `?v=` numbers today (#15).
