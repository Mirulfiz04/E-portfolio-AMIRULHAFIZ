# Amirul Hafiz — Portfolio

Single-page portfolio in **plain HTML, CSS and JavaScript**. No build step, no frameworks, no dependencies.

**Live:** https://mirulfiz04.github.io/E-portfolio-AMIRULHAFIZ

## Features

- Interactive hero: a "neural network" that reacts to the cursor, a typewriter line, a simulated MEDS widget, and a "Hi" that cycles through English, Malay, Japanese and Mandarin.
- MEDS case study with tabs: architecture explorer, an animated CI/CD pipeline, security, ML, and what I learned.
- Filterable projects with detail dialogs and a "What I learned" list for each.
- Live "From GitHub" strip of recently pushed repos (public API, cached per session).
- Polaroid photo strip with a lightbox.
- **Download CV**: the print stylesheet turns the page into a clean résumé ("Save as PDF").
- Command palette (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>), terminal mode (<kbd>`</kbd>), 9 achievement badges, and a Konami-code easter egg.
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
```

## Editing content

- **Projects:** edit the `projects` array in `js/script.js` (title, blurb, points, learned, tags, links).
- **Photos:** add a file to `assets/gallery/` and an entry to the `moments` array.
- **Experience, skills, education:** edit `index.html` directly.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

GitHub Pages deploys `main` through `.github/workflows/jekyll-gh-pages.yml`.
