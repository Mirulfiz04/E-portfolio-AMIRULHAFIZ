# Browser tests block third-party CDNs

- **Date:** 2026-11-24 (PR #9)
- **Status:** accepted

**Context.** Tests that depend on Google Fonts or the motion CDNs could fail for reasons unrelated to the change.

**Decision.** Playwright blocks them so the 'works without the CDN' path is what gets tested.

**Consequences.** Tests are repeatable. Motion itself is not covered by tests, and only Chromium is tested (both are open gaps in [known-issues.md](../known-issues.md)).
