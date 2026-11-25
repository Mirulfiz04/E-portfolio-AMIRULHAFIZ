# Amirul Hafiz — Portfolio

[![CI/CD](https://github.com/Mirulfiz04/E-portfolio-AMIRULHAFIZ/actions/workflows/jekyll-gh-pages.yml/badge.svg)](https://github.com/Mirulfiz04/E-portfolio-AMIRULHAFIZ/actions/workflows/jekyll-gh-pages.yml)

Single-page portfolio in **plain HTML, CSS and JavaScript**. No build step and no frameworks. Optional motion comes from GSAP + ScrollTrigger and Lenis (CDN, pinned with integrity hashes) in `js/motion.js`; if they fail to load or the visitor prefers reduced motion, the site works without them.

**Live:** https://mirulfiz04.github.io/E-portfolio-AMIRULHAFIZ

## Features

- Interactive hero: a "neural network" that reacts to the cursor, a typewriter line, a simulated MEDS widget, and a "Hi" that cycles through English, Malay, Japanese and Mandarin.
- MEDS case study with tabs: architecture explorer, an animated CI/CD pipeline, security, ML, and what I learned.
- Filterable projects with detail dialogs and a "What I learned" list for each.
- Live "From GitHub" strip of recently pushed repos (public API, cached per session).
- Polaroid photo strip with a lightbox.
- **Download CV**: the print stylesheet turns the page into a clean résumé ("Save as PDF").
- Guestbook with star ratings you approve before they show, a visit counter, and a 4-question quiz.
- Command palette (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>), terminal mode (<kbd>`</kbd>), 14 achievement badges, proof folders, a drag-around photo desk, 3D-tilt project cards, and a Konami-code easter egg.
- Light/dark theme, reduced-motion support, keyboard accessible, mobile menu.
- SEO: Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, and a custom `404.html`.

## Files

```
index.html        the page
css/style.css     all styles (colour tokens at the top; print = CV at the bottom)
js/script.js      all behaviour; project data is the `projects` array near the top,
                  photos are the `moments` array
assets/           portrait, project covers, gallery photos, reports
about.html …      old pages, now redirects to the matching section
docs/             architecture, decisions, known issues, team log (start at docs/README.md)
tests/            browser tests (Playwright, phone + desktop)
scripts/          static test server and the missing-file checker
.github/          CI workflow, deploy workflow, issue forms, PR template, Dependabot
```

## Editing content

- **Projects:** edit the `projects` array in `js/script.js` (title, blurb, points, learned, tags, links).
- **Photos:** add a file to `assets/gallery/` and an entry to the `moments` array.
- **Experience, skills, education:** edit `index.html` directly.

## Guestbook (reviews you approve)

Visitors send a star rating and comment from the **Guestbook** section. Nothing they send appears on the site until you add it yourself, so a toxic comment never goes public.

1. Create a free form at [formspree.io](https://formspree.io), then paste its ID (the part after `/f/`) into `FORMSPREE_ID` in `js/script.js`. Until you do, the form opens an email draft to you instead.
2. Reviews arrive in your inbox. To publish one, add it to `reviews.json`:

   ```json
   [
     { "name": "Jane Tan", "role": "Recruiter at Example", "rating": 5, "comment": "Clear, well-built portfolio.", "date": "2026-11-24" }
   ]
   ```
3. Commit and push. The average rating, review count and sorting update by themselves.

The visit counter uses the free [Abacus](https://jasoncameron.dev/abacus/) API and counts one visit per browser session. If that service is down, the counter hides.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Quality checks and workflow

The site has no build step, but every change is still checked before it ships: ESLint, HTML validation, a missing-file check and real-browser tests at phone and desktop size run in GitHub Actions on every pull request. Run the same checks locally with `npm ci && npm run check`.

Work is tracked as GitHub issues and moves through issue → branch → pull request → CI → merge → deploy. The full process, including the one-time repository settings, is in [CONTRIBUTING.md](CONTRIBUTING.md), and [CHANGELOG.md](CHANGELOG.md) is the dated timeline of everything that has changed.

## Documentation

Start at [docs/README.md](docs/README.md): how the pieces fit ([architecture](docs/architecture.md)), why choices were made ([decisions](docs/decisions/)), what is still broken ([known issues](docs/known-issues.md)) and who is doing what ([team log](docs/team-log.md)).

## Deploy

Merging into `main` starts the CI/CD pipeline in `.github/workflows/jekyll-gh-pages.yml`:

```
CI (lint, HTML, assets, browser tests)  →  build  →  deploy to GitHub Pages  →  verify the live site
```

Each stage waits for the one before it, so a change that fails CI is never deployed, and a final check confirms the live site is serving that exact commit. Pull requests run the CI stage only (`.github/workflows/ci.yml`).
