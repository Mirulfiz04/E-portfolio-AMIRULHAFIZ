# Architecture

State as of `main` at `e322405` (24 Nov 2026).

## The site

A single page of plain HTML, CSS and JavaScript. There is no framework and no build step; GitHub Pages runs Jekyll only to publish the files.

| Part | Where | Notes |
|---|---|---|
| Page | `index.html` | All sections. `about.html`, `academic.html`, `qualities.html`, `works.html`, `contact.html` are old pages that redirect to a section. `404.html` is the custom not-found page |
| Styles | `css/style.css` | Colour tokens at the top, the print stylesheet (the CV) at the bottom |
| Behaviour | `js/script.js` | Project data (`projects`), photos (`moments`), terminal, command palette, guestbook, badges |
| Motion | `js/motion.js` | Optional GSAP, ScrollTrigger and Lenis effects. The site must work when they do not load or the visitor prefers reduced motion |
| Content data | `reviews.json` | Guestbook reviews the owner has approved by hand |
| Assets | `assets/` | Covers, gallery photos, logos, skill icons (credits in `assets/skills/CREDITS.txt`), report PDFs |
| Search files | `robots.txt`, `sitemap.xml` | |

CSS and JS links carry a hand-bumped `?v=N` (for example `js/script.js?v=6`). Issue #15 is about replacing that with the commit ID.

## The pipeline

```
pull request  ->  CI (ci.yml)
push to main  ->  CI  ->  Build site  ->  Deploy to GitHub Pages  ->  Verify the live site
                  (jekyll-gh-pages.yml, named "CI/CD")
```

- `ci.yml` has three jobs: *Lint, HTML and assets*, *Browser tests (phone and desktop)*, and *CI passed* (the single check to require in branch protection). It runs on pull requests, by hand, and when called by the pipeline. It has no `push` trigger so it does not run twice per merge.
- `jekyll-gh-pages.yml` calls CI, then builds with Jekyll, then deploys, then runs `scripts/verify-live.mjs`. Deploy runs only from `main`. Only one deployment runs at a time and in-progress deployments are never cancelled.
- `_config.yml` keeps tooling (`scripts`, `tests`, `package.json`, `CONTRIBUTING.md` and similar) out of the published site; the verify step checks they are not public.
- Dependabot (`.github/dependabot.yml`) opens weekly pull requests for Actions versions and a grouped one for npm dev tools.
- Tests: Playwright on Chromium at phone and desktop size, with the third-party CDNs blocked (see the decision record). The local server is `scripts/serve.mjs`; `scripts/check-assets.mjs` finds missing files.

## Outside services

| Service | Used for | If it is down or not set |
|---|---|---|
| GitHub Pages | Hosting | Site unavailable; roll back by reverting the merge |
| Google Fonts | Fonts | Falls back to system fonts |
| cdnjs (GSAP 3.12.5, ScrollTrigger) and jsDelivr (Lenis 1.1.13) | Motion, pinned with integrity hashes | Site works without motion |
| GitHub public API | "From GitHub" strip of recent repositories | The strip is empty or hidden; cached per session |
| Abacus counter API | Visit counter | The counter hides |
| Formspree | Guestbook submissions | `FORMSPREE_ID` in `js/script.js` is empty, so submissions open an email draft instead (see [known-issues.md](known-issues.md)) |
| YouTube | Links to demo videos and talks | Links only; nothing is embedded at load |

## Planned, not in the repository yet

A local AWS backend (documented by its owner in `backend/README.md`) and a motion specification (`docs/design/`). Neither exists on `main` at `e322405`; this page will describe them when they land.
