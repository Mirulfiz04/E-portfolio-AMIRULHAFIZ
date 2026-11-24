# Team log

One entry per round. **Status is "assigned" until a commit, issue or run proves more.** Update it in the same pull request as the proof.

## Round 1: 2026-11-24, starting from `main` at `e322405`

Baseline: PR #9 merged (CI, pipeline, Download CV fix); issues #6, #7 and #8 closed; issue #15 and Dependabot pull requests 10 to 14 open; review findings in [known-issues.md](known-issues.md).

| Role | Assignment | Status |
|---|---|---|
| Orchestra | Coordinates the round, hands out work, checks results before anything is called done | active |
| Designer | Motion specification, to live in `docs/design/` | specification committed locally (`587ed19`, branch `docs/design-motion`); a proposal only, not built, not reviewed, not merged |
| Developer E | Stamp asset links with the commit ID (#15), and fix the confirmed bugs | Two local commits, not pushed, not merged, **no QA sign-off**: `31ae02c` (branch `feat/stamp-commit-sha`, the stamp) and `f29ddc8` (branch `fix/review-findings`, fixes for the blocked-GSAP wheel scroll, the guestbook success message and GitHub card escaping). Reviewed by Orchestra, tests rerun by Orchestra: 49 passed and 15 skipped, then 53 passed and 7 skipped. **The guestbook sort bug is not in `f29ddc8`** |
| QA | Cross-device testing, records in `docs/qa/` | assigned |
| Backend | Local AWS backend, documented in `backend/README.md` | Two local commits, not pushed, not merged: `7520667` and `784c751` (branch `feat/aws-backend`). 43 offline tests rerun by Orchestra. **Never validated or deployed on AWS** |
| Documentation | Project records: stale changelog corrected, this `docs/` folder written | committed locally on branch `docs/project-records`; not pushed, no pull request |

Written, but only true once `31ae02c` is merged: the CONTRIBUTING and pull request template wording about no longer bumping `?v=` by hand. Those docs must merge with or after it.

Not approved yet: pushing, opening pull requests and commenting on issues.
