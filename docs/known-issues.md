# Known issues and gaps

From the review of `main` at `e322405` on 2026-11-24. Nothing here is fixed unless a commit or closed issue says so; check the changelog first.

Review result: lint, HTML validation and the asset check were clean; browser tests gave 40 passed and 6 skipped with a local Chrome; the live-site check passed.

## Confirmed bugs

| What | Detail | Tracked |
|---|---|---|
| Wheel scroll dead | If GSAP is blocked but Lenis loads, mouse-wheel scrolling stops working | assigned, no issue yet |
| Guestbook claims success | With `FORMSPREE_ID` empty, only an email draft opens, but the page says the review was sent | assigned, no issue yet |
| Guestbook sort hides every project | The sort buttons (**Newest**, **Highest rated**) are always visible. Pressing one takes the visible projects from 9 to 0. Cause: the project filter handler (`js/script.js:434`) is bound to every `.filters .chip`, including the sort chips, which have no `data-filter`; and `display:flex` at `css/style.css:204` overrides `hidden`. Reproduced by Orchestra in Chrome on `e322405` with 0, 1 and 2 reviews. Affects visitors today | assigned to Developer E, not fixed, no issue yet |

## Suspected, found by reading the code and not run

| What | Detail | Tracked |
|---|---|---|
| GitHub card fields not escaped | Fields from the GitHub API are put into the page without escaping; not reproduced | none |

## Gaps

| What | Detail | Tracked |
|---|---|---|
| Live check cannot prove the exact commit | It compares hand-bumped `?v=` numbers; PR #9 changed `js/script.js` without bumping `?v=6` | issue #15 |
| Motion is untested | Tests block the CDNs, so GSAP/Lenis behaviour is never run | none |
| Only Chromium is tested | No Firefox, WebKit or real-device runs in CI | #5 covers a real phone only |
| Unused files | `assets/avatar.png`, `avatar-alt.png`, `avatar2-alt.png` and `assets/logos/github.png` are not referenced by the site | none |
| Open dependency updates | Dependabot pull requests 10 to 14 (Actions bumps) are unmerged | the pull requests |
| Checkout fails on some Windows clones | The long file name `assets/reports/FarmIntel-Fruit & Vegetable Disease Detector Group 28.pdf` exceeds the path limit, so clone or checkout can fail. Workaround: `git config core.longpaths true`, or shorten the name | none |
| Branch protection | Requiring **CI passed** is a manual GitHub setting; whether it is on is not recorded | CONTRIBUTING.md |
