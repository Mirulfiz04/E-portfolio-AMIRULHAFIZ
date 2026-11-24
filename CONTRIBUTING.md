# How changes are made here

Every change, from a typo to a new section, follows the same path:

```
issue  →  branch  →  commits  →  pull request  →  CI checks  →  review  →  merge  →  auto-deploy  →  check the live site
```

## 1. Start with an issue
Open an issue from the templates (bug report or feature/improvement) so there is a record of *why*. Use the labels `bug`, `enhancement` or `documentation`. Larger work gets a checklist in the issue.

## 2. Branch from `main`
Name it after the kind of change: `fix/proof-folders`, `feat/skill-logos`, `docs/readme`, `chore/deps`.

## 3. Make the change and run the checks

You need Node 20 or newer. First time only:

```bash
npm ci
npx playwright install chromium
```

Then, before every push:

```bash
npm run check      # everything below, in order
```

| Command | What it catches |
|---|---|
| `npm run lint` | JavaScript mistakes: undefined variables, shadowing browser built-ins (this once broke **Download CV**, see #7) |
| `npm run validate:html` | invalid or sloppy HTML: missing button types, broken attributes |
| `npm run check:assets` | any image, script, stylesheet, PDF or JSON file the site points to that does not exist |
| `npm test` | real-browser tests at phone and desktop size: folders, skills, dialogs, terminal, no script errors, no sideways scrolling |

`npm test` starts a small local server by itself (`scripts/serve.mjs`) and blocks third-party CDNs so runs are repeatable. To look at the site yourself: `node scripts/serve.mjs`, then open http://127.0.0.1:4173.

**Fixed a bug? Add a test that fails without the fix.** Put it in `tests/site.spec.js` and mention the issue number in its group name.

## 4. Commit
- Short imperative summary (about 70 characters): `Fix Download CV: stop the terminal helper overwriting window.print`
- A body that explains *why*, not only what.
- Reference the issue: `Closes #7` (in the commit or the pull request).

## 5. Open a pull request
Fill in the template and add one line under **Unreleased** in [`CHANGELOG.md`](CHANGELOG.md), which is the project's timeline. Keep it a **draft** until CI is green. The pull request must say `Closes #N` **when it is created or edited before merging**: GitHub only reads closing keywords at the moment of merge.

## 6. CI must pass
`.github/workflows/ci.yml` runs on every pull request and on every push to `main`:

1. **Lint, HTML and assets**: the first three commands in the table above.
2. **Browser tests (phone and desktop)**: Chromium, same tests as `npm test`.
3. **CI passed**: one summary check, the one to require in branch protection.

If a run fails, open the run, read the failing step, fix it on the same branch and push. The Playwright report is attached to failed runs.

## 7. Merge and deploy
Merging into `main` triggers `.github/workflows/jekyll-gh-pages.yml`, which publishes to GitHub Pages. Reload the live site (close and reopen the tab on a phone) and tick off any "after merge" checks in the pull request.

---

## One-time repository settings (owner only)

These are settings in GitHub, not code, so they cannot be committed:

1. **Require CI before merging.** Settings → Rules → Rulesets → New branch ruleset → target `main` → enable *Require a pull request before merging* and *Require status checks to pass*, then add **CI passed**. Without this, a red pull request can still be merged.
2. **Project board.** Repository → Projects → New project → Board layout → add the open issues. Move cards Backlog → In progress → Done as the pull request moves. For a visual timeline, add a second view with the **Roadmap** layout and set Start and Target date fields on the cards.
3. **Dependabot.** `.github/dependabot.yml` is already configured; make sure *Dependabot alerts* and *security updates* are on under Settings → Code security.

## Why the checks block third-party CDNs
The site loads GSAP, Lenis and Google Fonts from CDNs but is built to work without them. Blocking them in tests means a CDN outage can never make CI flaky, and the "works without the CDN" path stays tested.
