# Team log

One entry per round. **Status is "assigned" until a commit, issue or run proves more.** Update it in the same pull request as the proof.

## Round 1: 2026-11-24, starting from `main` at `e322405`

Baseline: PR #9 merged (CI, pipeline, Download CV fix); issues #6, #7 and #8 closed; issue #15 and Dependabot pull requests 10 to 14 open; review findings in [known-issues.md](known-issues.md).

| Role | Assignment | Status |
|---|---|---|
| Orchestra | Coordinates the round, hands out work, checks results before anything is called done | active |
| Designer | Motion specification, to live in `docs/design/` | assigned |
| Developer E | Stamp asset links with the commit ID (#15) and fix the confirmed bugs in [known-issues.md](known-issues.md) | assigned |
| QA | Cross-device testing, records in `docs/qa/` | assigned |
| Backend | Local AWS backend, documented in `backend/README.md` | assigned |
| Documentation | Project records: stale changelog corrected, this `docs/` folder written | committed locally on branch `docs/project-records`; not pushed, no pull request |

Held until Developer E's commit exists: the CONTRIBUTING and pull request template wording about no longer bumping `?v=` by hand.

Not approved yet: pushing, opening pull requests and commenting on issues.
