# Dependabot keeps Actions and dev tools current

- **Date:** 2026-11-24 (PR #9)
- **Status:** accepted

**Context.** Pinned versions go stale and miss security fixes.

**Decision.** Weekly pull requests for GitHub Actions (one each) and one grouped pull request for npm dev tools, with commit prefixes `ci` and `deps`.

**Consequences.** Updates arrive as reviewable pull requests that CI checks. Pull requests 10 to 14 (Actions bumps) were open and unmerged as of 2026-11-24.
