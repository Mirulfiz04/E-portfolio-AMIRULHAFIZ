# Team log

One entry per round. **Status is "assigned" until a commit, issue or run proves more.** Update it in the same pull request as the proof.

## Round 1: 2026-11-24, starting from `main` at `e322405`

Baseline: PR #9 merged (CI, pipeline, Download CV fix); issues #6, #7 and #8 closed; issue #15 and Dependabot pull requests 10 to 14 open; review findings in [known-issues.md](known-issues.md). The round paused on a usage limit and resumed on 2026-11-25.

Everything below is local: **nothing is pushed or merged.** The site is **not release-ready** while B-05 and B-06 (the proof folders on a phone) are open.

| Role | Assignment | Status |
|---|---|---|
| Orchestra | Coordinates the round, hands out work, checks results before anything is called done | active |
| Designer | Motion specification, to live in `docs/design/` | specification now at `fad4d98` (branch `docs/design-motion`), which records the review of the first motion items and the changes requested. A design document, not built by itself |
| Developer E: stamp | Stamp asset links with the commit ID (#15) | `31ae02c` on `feat/stamp-commit-sha`: reviewed by Orchestra (49 passed, 15 skipped); **QA signed off with conditions** |
| Developer E: fixes | Fix the confirmed bugs | `b4873c0` on `fix/review-findings` (includes `f29ddc8` and `a35a24e`): scroll, guestbook message, GitHub card escaping, sort, B-01 and B-03. Reviewed by Orchestra (71 passed, 9 skipped). **QA merge sign-off granted** |
| Developer E: folders | B-05, B-06, B-08, B-09 | `bb08f34` on `fix/folders` (with `00a569d` and `38bbecb`): reviewed by Orchestra (107 passed, 45 skipped). **QA pending** |
| Developer E: motion | Motion items from the design spec | `31602a9` on `feat/motion-p1` (items 1 to 3 as `6832694`, `aeabee2`, `bffcd72`, plus `c015c30`): the Designer's changes are applied. Reviewed by Orchestra (171 passed, 45 skipped). **QA pending. Performance not measured** |
| QA | Cross-device testing, records in `docs/qa/` | `test/cross-device`, now at `2831411` (QA results for `b4873c0` and `f1b4103`). **Its commits after `bd73f3b` have not been reviewed by Orchestra.** Signed off the stamp with conditions and `b4873c0` for merge; other branches pending |
| Backend | Local AWS backend, documented in `backend/README.md` | `feat/aws-backend` at `f1b4103`: reviewed by Orchestra, backend tests run in CI, lint clean. **QA code-level sign-off only; must merge after the fixes.** Never validated or deployed on AWS |
| Documentation | Project records: stale changelog corrected, this `docs/` folder written | local branch `docs/project-records`; no pull request |

## Merge order

Agreed order, nothing merges until the site owner approves each step:

1. stamp (`feat/stamp-commit-sha`)
2. fixes (`fix/review-findings`)
3. folders (`fix/folders`)
4. motion (`feat/motion-p1`)
5. then the QA, docs, design and backend branches

Anything that touches `docs/` or `backend/` goes only after the fixes, because the fixes add the `_config.yml` exclusions that keep those folders out of the published site (B-10, B-12). The `?v=` wording in CONTRIBUTING and the PR template is true only after the stamp is merged.

Not approved yet: pushing, opening pull requests and commenting on issues.
