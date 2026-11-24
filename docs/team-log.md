# Team log

One entry per round. **Status is "assigned" until a commit, issue or run proves more.** Update it in the same pull request as the proof.

## Round 1: 2026-11-24, starting from `main` at `e322405`

Baseline: PR #9 merged (CI, pipeline, Download CV fix); issues #6, #7 and #8 closed; issue #15 and Dependabot pull requests 10 to 14 open; review findings in [known-issues.md](known-issues.md). The round paused on a usage limit and resumed on 2026-11-25.

Everything below is local: **nothing is pushed or merged**, and no branch has a full QA sign-off yet.

| Role | Assignment | Status |
|---|---|---|
| Orchestra | Coordinates the round, hands out work, checks results before anything is called done | active |
| Designer | Motion specification, to live in `docs/design/` | specification committed locally (`587ed19`, branch `docs/design-motion`); a proposal only |
| Developer E: stamp | Stamp asset links with the commit ID (#15) | `31ae02c` on `feat/stamp-commit-sha`: reviewed by Orchestra (49 passed, 15 skipped); **QA signed off with conditions** |
| Developer E: fixes | Fix the confirmed bugs | `b4873c0` on `fix/review-findings` (includes `f29ddc8` and `a35a24e`): scroll, guestbook message, GitHub card escaping, sort, B-01 and B-03. Reviewed by Orchestra, 71 passed and 9 skipped. **QA pending** |
| Developer E: folders | B-05, B-06, B-08, B-09 | commits `bb08f34`, `00a569d`, `38bbecb` on `fix/folders`; not yet reviewed or QA'd |
| Developer E: motion | Motion items from the design spec | item 1 `f025831`, item 2 `4a4fcfe`, item 3 `1438e0b` on `feat/motion-p1`. Reviewed by Orchestra (115 passed, 9 skipped); **changes requested; performance not measured** |
| QA | Cross-device testing, records in `docs/qa/` | `test/cross-device`, now at `2bf8458`, **not yet reviewed by Orchestra**. The earlier `bd73f3b` had two changes requested (real-CDN tests off by default, merge order). Signed off the stamp with conditions; no other branch |
| Backend | Local AWS backend, documented in `backend/README.md` | `feat/aws-backend` at `f1b4103`: reviewed by Orchestra, backend tests now run in CI, lint clean. **QA pending. Never validated or deployed on AWS** |
| Documentation | Project records: stale changelog corrected, this `docs/` folder written | local branch `docs/project-records`; no pull request |

## Merge order

Agreed order, nothing merges until the site owner approves each step:

1. stamp (`feat/stamp-commit-sha`)
2. fixes (`fix/review-findings`)
3. folders (`fix/folders`)
4. motion (`feat/motion-p1`)
5. then the QA, docs, design and backend branches

Anything that touches `docs/` or `backend/` goes only after the fixes, because the fixes add the `_config.yml` exclusions that keep those folders out of the published site (B-10). The `?v=` wording in CONTRIBUTING and the PR template is true only after the stamp is merged.

Not approved yet: pushing, opening pull requests and commenting on issues.
