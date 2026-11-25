# How changes are made here

Every change, from a typo to a new section, follows the same path:

```
issue  →  branch  →  commits  →  pull request  →  CI checks  →  review  →  merge  →  auto-deploy  →  check the live site
```

## The full process: gates and who owns them

The path above is the day-to-day loop. Larger work (anything with new behaviour, a design or a backend) passes these gates in order. A gate is closed only when its evidence exists, and the work does not move on without it. Details for each step live in the numbered sections below.

| # | Gate | Evidence that it is closed | Owner |
|---|---|---|---|
| 1 | Requirement and acceptance criteria | Written in the issue as a checklist a stranger could test | Orchestra drafts, site owner confirms |
| 2 | Issue | Opened from a template, labelled (section 1) | Orchestra |
| 3 | Design / API contract | A short spec or contract is committed (for example `docs/design/`, `backend/README.md`) and linked from the issue; skip only for small fixes, and say so in the issue | Designer for look and motion, Backend for APIs |
| 4 | Branch | Named for the change, from `main` (section 2) | Developer |
| 5 | Code and tests | Commits on the branch; bug fixes include a test that fails without the fix; `npm run check` passes (section 3) | Developer |
| 6 | Independent review | A review by someone who did not write the change, with findings fixed or answered | Reviewer (never the author) |
| 7 | QA sign-off on an exact SHA | A record in `docs/qa/` naming the commit, the devices and browsers used and the result. A new commit invalidates the sign-off | QA |
| 8 | Draft pull request and CI | Template filled, `Closes #N`, changelog line, **CI passed** (sections 5 and 6) | Developer |
| 9 | Owner approval and merge | The site owner approves and merges | **Site owner only** |
| 10 | Deploy | The pipeline deploys from `main` after CI (section 7) | Automatic; the owner approves anything that costs money or changes hosting |
| 11 | Live smoke check | The **Verify the live site** stage is green and the "after merge" items in the pull request are ticked on the live site | QA and Developer, reported to the owner |
| 12 | Changelog and docs | The changelog line moves under the day's heading; `docs/` pages, the team log and known issues are updated | Documentation |

**Rollback** is a revert of the merge, which the pipeline then checks and redeploys (see "Rolling back" below). Decide to roll back on the first red Verify stage rather than after investigating.

**Only the site owner approves** merges, deploys and anything that spends money (paid services, domains, cloud resources, paid GitHub plans). Other roles may prepare and propose; they do not push to `main`, merge, or commit the owner to a cost. Automated sessions work on branches and local commits until the owner says to push.

### Definition of done

A change is done only when all of these are true:

- [ ] The acceptance criteria in the issue are met, each one checked against the running site
- [ ] Tests cover the behaviour, and `npm run check` and CI are green
- [ ] Someone other than the author reviewed it
- [ ] QA signed off on the exact commit that was merged
- [ ] It is merged, deployed, and the live check passed
- [ ] The changelog line, the docs and the team log match what really happened
- [ ] Open follow-ups are issues, not memory

"Works on my machine", an unmerged branch or a passing build alone are not done.

---

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
`.github/workflows/ci.yml` runs on every pull request, and runs again as the first stage of the pipeline below once the change reaches `main`:

1. **Lint, HTML and assets**: the first three commands in the table above.
2. **Browser tests (phone and desktop)**: Chromium, same tests as `npm test`.
3. **CI passed**: one summary check, the one to require in branch protection.

If a run fails, open the run, read the failing step, fix it on the same branch and push. The Playwright report is attached to failed runs.

## 7. Merge: the CI/CD pipeline puts it live
Merging into `main` starts the pipeline in `.github/workflows/jekyll-gh-pages.yml`. Each stage waits for the one before it:

```
CI  →  Build site  →  Deploy to GitHub Pages  →  Verify the live site
```

| Stage | What it does |
|---|---|
| **CI** | Runs the same checks as the pull request (lint, HTML, assets, browser tests). If anything fails, nothing is built or deployed and the site keeps serving the last good version. |
| **Build site** | Jekyll builds the site. Tests and tooling are left out (`_config.yml`). |
| **Deploy to GitHub Pages** | Publishes the build. It only ever deploys from `main`: running the pipeline by hand on another branch runs CI and build but never deploys. |
| **Verify the live site** | `scripts/verify-live.mjs` fetches the live site and fails if it is not serving this commit (same versioned CSS and JS), if any linked file is missing, if the 404 page is wrong, or if a developer file such as `package.json` is public. It retries for about two minutes while GitHub Pages switches over. |

### Cache-busting links (`?v=`): depends on branch `feat/stamp-commit-sha`

**This section is only true once commit `00f1755` (branch `feat/stamp-commit-sha`, issue #15) is merged to `main`. These docs must merge with or after it. Until then, keep bumping `?v=` by hand when you change CSS or JS.**

After it lands, nobody bumps `?v=N` by hand. The **Build site** job runs `scripts/stamp-version.mjs` on its temporary checkout before Jekyll, which rewrites every `?v=N` on the CSS and JS links of `index.html` to `?v=<short commit ID>` in the published copy only; the files in the repository keep their old numbers. It fails the build if it stamps nothing. The **Verify** stage then runs with `VERIFY_COMMIT` set to the deployed commit and requires the live links to end with that exact ID. A run without `VERIFY_COMMIT` (for example `npm run verify:live` on your machine) compares the links as they are in your checkout. Do not set `GITHUB_SHA` for this: CI sets it too and it would break the local pipeline tests.

Watch it in the **Actions** tab, then reload the live site (close and reopen the tab on a phone) and tick off any "after merge" checks in the pull request. Every deployment is also listed under **Deployments** on the repository page.

If the pipeline is red, read the failing stage. A red **Verify** stage means the deploy happened but the live site is not what was expected: treat it as an incident and roll back.

### Rolling back
Open the merged pull request and press **Revert**. GitHub opens a new pull request that undoes it; merge that and the pipeline checks and redeploys the previous state. The same pipeline protects the rollback.

---

## One-time repository settings (owner only)

These are settings in GitHub, not code, so they cannot be committed:

1. **Require CI before merging.** Settings → Rules → Rulesets → New branch ruleset → target `main` → enable *Require a pull request before merging* and *Require status checks to pass*, then add **CI passed**. Without this, a red pull request can still be merged.
2. **Project board.** Repository → Projects → New project → Board layout → add the open issues. Move cards Backlog → In progress → Done as the pull request moves. For a visual timeline, add a second view with the **Roadmap** layout and set Start and Target date fields on the cards.
3. **Dependabot.** `.github/dependabot.yml` is already configured; make sure *Dependabot alerts* and *security updates* are on under Settings → Code security.

## Why the checks block third-party CDNs
The site loads GSAP, Lenis and Google Fonts from CDNs but is built to work without them. Blocking them in tests means a CDN outage can never make CI flaky, and the "works without the CDN" path stays tested.
