# Plain HTML, CSS and JavaScript, no framework or build step

- **Date:** 2026-11-22 (site rebuilt as a single page, `068796e`; first version 2026-01-04)
- **Status:** accepted

**Context.** The portfolio is one page that the owner edits by hand, hosted free on GitHub Pages.

**Decision.** Keep it as plain files. GitHub Pages runs Jekyll only to publish them (`_config.yml` keeps tooling out).

**Consequences.** Anyone can open the files and see what runs. There is no bundler to break, but also no minification, no module system and one large `js/script.js`. Tooling in `package.json` is for checks only.
