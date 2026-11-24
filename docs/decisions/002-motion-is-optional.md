# Motion libraries are optional and pinned

- **Date:** 2026-11-23 (motion layer, `55dde1c`)
- **Status:** accepted

**Context.** GSAP, ScrollTrigger and Lenis come from CDNs and make the page livelier but must not be required.

**Decision.** Load them with pinned versions and integrity hashes in `js/motion.js`; the page must work if they fail or the visitor prefers reduced motion.

**Consequences.** A CDN outage or blocker never breaks the site. The cost is two code paths to keep working; see [known-issues.md](../known-issues.md) for a bug in the blocked-GSAP path.
