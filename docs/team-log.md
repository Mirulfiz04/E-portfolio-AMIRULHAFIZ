| Backend | Local AWS backend, documented in `backend/README.md` | Local, not pushed, not merged, branch `feat/aws-backend`: `7520667`, `784c751`, `f0cc3d9` (contract, threat model, environments) and `f76529e` (lint fix). Lint clean; 50 offline tests rerun by Orchestra. **Never validated or deployed on AWS** |
| QA | Cross-device testing, records in `docs/qa/` | `bd73f3b` on `test/cross-device` (QA plan and Playwright coverage), local and not merged. Reviewed by Orchestra with two changes requested: real-CDN tests must be off by default, and the merge order must be fixed. Rerun: 141 passed, 9 skipped, and 10 of the passes are expected failures. **No sign-off on any branch yet** |
| Developer E | Stamp asset links with the commit ID (#15), fix the confirmed bugs, then motion items from the design spec | All local, not pushed, not merged, **no QA sign-off**. `31ae02c` (`feat/stamp-commit-sha`, the stamp) and `f29ddc8` (`fix/review-findings`: wheel scroll, guestbook success message, GitHub card escaping) were reviewed by Orchestra with tests rerun (49 passed/15 skipped; 53 passed/7 skipped). `a35a24e` on `fix/review-findings` is the sort fix, **not reviewed yet**. B-01 and B-03 are pending. Motion item 1 is `376962c` on `feat/motion-p1`, **not reviewed**; items 2 and 3 are in progress |
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

The round paused on a usage limit and resumed on 2026-11-25.

Not approved yet: pushing, opening pull requests and commenting on issues.
