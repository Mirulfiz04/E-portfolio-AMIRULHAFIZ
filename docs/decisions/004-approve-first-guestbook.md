# Guestbook reviews appear only after the owner approves them

- **Date:** 2026-11-23 (guestbook, `3a741ec`)
- **Status:** accepted

**Context.** A public guestbook on a static site invites spam or abusive comments, and there is no server.

**Decision.** Visitors send a review by form (Formspree) or email draft; the owner copies approved ones into `reviews.json` and commits.

**Consequences.** Nothing toxic can go public, and no database is needed. Publishing is manual. While `FORMSPREE_ID` is empty only an email draft opens, which the page currently reports as success (confirmed bug, see [known-issues.md](../known-issues.md)).
