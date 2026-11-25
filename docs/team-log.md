# Team log

One entry per round. **Status is "assigned" until a commit, issue or run proves more.** Update it in the same pull request as the proof.

## Round 1: 2026-11-24, starting from `main` at `e322405`

Baseline: PR #9 merged (CI, pipeline, Download CV fix); issues #6, #7 and #8 closed; issue #15 and Dependabot pull requests 10 to 14 open; review findings in [known-issues.md](known-issues.md). The round paused on a usage limit and resumed on 2026-11-25.

**Nothing is merged.** Commit IDs were refreshed on 2026-11-25 when the commit author was set to the site owner; the code in each commit is unchanged. Release still needs the merges, a real-phone pass (#5), a GitHub Actions run, post-merge smoke checks (see [known-issues.md](known-issues.md)).

| Role | Assignment | Status |
|---|---|---|
| Orchestra | Coordinates the round, hands out work, checks results before anything is called done | active. Rehearsed all final branches merged together, with QA at `cc0b016`: no conflicts, 317 passed, 74 skipped, 0 failed; lint, HTML and asset checks clean; 50 backend tests |
| Designer | Motion specification, to live in `docs/design/` | specification now at `59f02fb` (branch `docs/design-motion`), which records the review of the first motion items and the changes requested. Items 4 to 6 of the spec are not built |
| Developer E: stamp | Stamp asset links with the commit ID (#15) | `00f1755` on `feat/stamp-commit-sha`: reviewed by Orchestra (49 passed, 15 skipped); **QA signed off with conditions** |
| Developer E: fixes | Fix the confirmed bugs | `d725eed` on `fix/review-findings` (includes `ee8de30` and `0f7fc3a`): scroll, guestbook message, GitHub card escaping, sort, B-01 and B-03. Reviewed by Orchestra (71 passed, 9 skipped). **QA merge sign-off granted** |
| Developer E: folders | B-05, B-06, B-08, B-09 | `e35715a` on `fix/folders` (with `4b2c501` and `b6eaff8`): reviewed by Orchestra (107 passed, 45 skipped). **QA merge sign-off granted** |
| Developer E: motion | Motion items 1 to 3 from the design spec | `f5f6568` on `feat/motion-p1` (items as `5905f0b`, `755fcd7`, `7b4d986`, plus `9a86b60` and the Designer's changes): reviewed by Orchestra (171 passed, 45 skipped). **QA merge sign-off granted for items 1 to 3; items 4 to 6 are not built.** Performance was measured by QA: 4x CPU slowdown, 430px wide, headless Chrome, 96.1 to 99.5 percent of frames within 20 ms, no extra long tasks over the baseline. That is not a real phone |
| QA | Cross-device testing, records in `docs/qa/` | `test/cross-device`, final at `d978786`. Signed off the stamp (with conditions), `d725eed`, `e35715a` and `f5f6568` for merge, and the backend at code level only |
| Backend | Local AWS backend, documented in `backend/README.md` | `feat/aws-backend` at `bd2d442`: reviewed by Orchestra, lint clean, 50 offline tests. The backend tests are set up to run in CI, but **GitHub Actions has not run them**. **QA code-level sign-off only; must merge after the fixes.** Never validated or deployed on AWS |
| Documentation | Project records: stale changelog corrected, this `docs/` folder written | local branch `docs/project-records`; no pull request |

## Test runs on 2026-11-25, all branches merged together locally

| Where | Result |
|---|---|
| Chrome, phone and desktop sizes, full suite | 381 passed, 78 skipped, 0 failed; 50 backend tests passed |
| WebKit (Safari's engine), desktop and iPhone size, site tests | 8 failures on the first run. One was B-13 (fixed). The rest were test-environment or platform differences: Safari does not focus a button on a click, this WebKit build has no mail app, and one did not repeat |
| Android 17 emulator, Chrome 145, touch input | Menu, folders, skills, filters, photos, theme, mood, heartbeat, form, swipe and landscape passed; no sideways scroll; GSAP and Lenis loaded |
| Firefox | Not run: the test build would not start on that PC |

## Merge order

Agreed order, nothing merges until the site owner approves each step:

0. privacy (`fix/hide-student-number`)
1. stamp (`feat/stamp-commit-sha`)
2. fixes (`fix/review-findings`), then `fix/critic-badge` and `fix/safari-page-jump`
3. folders (`fix/folders`)
4. motion (`feat/motion-p1`)
5. backend (`feat/aws-backend`)
6. docs and design (`docs/project-records`, `docs/design-motion`)
7. QA tests last (`test/cross-device`)

Anything that touches `docs/` or `backend/` goes only after the fixes, because the fixes add the `_config.yml` exclusions that keep those folders out of the published site (B-10, B-12). The `?v=` wording in CONTRIBUTING and the PR template is true only after the stamp is merged.

On 2026-11-25 the site owner approved pushing, issues and draft pull requests. Merging and deploying still need their approval each time.
