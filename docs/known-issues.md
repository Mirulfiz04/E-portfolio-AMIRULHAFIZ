# Known issues and gaps

From the review of `main` at `e322405` on 2026-11-24. Nothing here is fixed unless a commit or closed issue says so; check the changelog first. A bug stays listed as open until its fix is **merged**, even when a fixing commit exists on a branch.

Review result: lint, HTML validation and the asset check were clean; browser tests gave 40 passed and 6 skipped with a local Chrome; the live-site check passed.

## Before release

QA has signed off the fixes, folders and motion branches for merge. Release still needs the merges, a real-phone pass (#5), a GitHub Actions run, post-merge smoke checks and the site owner's choice on B-11.

## Confirmed bugs

Bug numbers (B-01 and so on) follow QA's plan on branch `test/cross-device`.

| What | Detail | Tracked |
|---|---|---|
| B-01 Menu too tall on a phone in landscape | The mobile menu is taller than the screen and cannot be scrolled, so the lower links are unreachable. Found by QA and confirmed by Orchestra | fix in `b4873c0` (`fix/review-findings`), reviewed by Orchestra (71 passed, 9 skipped), QA signed off, not merged, so still open |
| B-02 Wheel scroll dead | If GSAP is blocked but Lenis loads, mouse-wheel scrolling stops working | fix in `b4873c0` (`fix/review-findings`), reviewed by Orchestra (71 passed, 9 skipped), QA signed off, not merged, so still open |
| B-03 Relative canonical links on redirect pages | Five old redirect pages (`about.html`, `academic.html`, `qualities.html`, `works.html`, `contact.html`) use relative canonical links. Found by QA only | fix in `b4873c0` (`fix/review-findings`), reviewed by Orchestra (71 passed, 9 skipped), QA signed off, not merged, so still open |
| B-04 Guestbook claims success | With `FORMSPREE_ID` empty, only an email draft opens, but the page says the review was sent | fix in `b4873c0` (`fix/review-findings`), reviewed by Orchestra (71 passed, 9 skipped), QA signed off, not merged, so still open |
| B-05 Folder files open under the wrong folder on a phone | At 320 to 760px, tapping folder 1 or 2 shows its files below the whole row, not under the tapped folder (`index.html:193`, `css/style.css:573`). User-reported; reproduced by Orchestra on `b4873c0` | fix `bb08f34` on `fix/folders`, reviewed by Orchestra (107 passed, 45 skipped), QA signed off, not merged, so still open |
| B-06 Folder does not close | Tapping an open folder again sets `aria-expanded` to false but its files stay visible, because `display:grid` overrides `hidden`. User-reported; reproduced by Orchestra on `b4873c0` | fix `00a569d` on `fix/folders`, reviewed by Orchestra (107 passed, 45 skipped), QA signed off, not merged, so still open |
| B-07 Guestbook sort hides every project | The sort buttons (**Newest**, **Highest rated**) are always visible. Pressing one takes the visible projects from 9 to 0. Cause: the project filter handler (`js/script.js:434`) is bound to every `.filters .chip`, including the sort chips, which have no `data-filter`; and `display:flex` at `css/style.css:204` overrides `hidden`. Reproduced by Orchestra in Chrome on `e322405` with 0, 1 and 2 reviews. Affects visitors today | fix `a35a24e`, included in `b4873c0` (`fix/review-findings`), reviewed by Orchestra (71 passed, 9 skipped), QA signed off, not merged, so still open |
| B-08 Hidden elements still shown | The visit counter card (`.rv-stat`) keeps showing after `hidden` is set, the same cause as B-06. Reproduced by Orchestra | fix `00a569d` on `fix/folders`, reviewed by Orchestra (107 passed, 45 skipped), QA signed off, not merged, so still open |
| B-09 Folder icon pokes above its panel | At 390px the icon box starts about 5px above the front panel (cosmetic). Found by QA only | fix `38bbecb` on `fix/folders`, reviewed by Orchestra (107 passed, 45 skipped), QA signed off, not merged, so still open |
| B-10 `docs/` would be published | `_config.yml` does not exclude `docs`, so internal notes would be served once merged. Found by QA | covered by the `_config.yml` exclude in `b4873c0`, QA signed off; open until that is merged |
| B-11 Critic badge cannot be earned (minor) | After the B-04 fix, the Critic badge cannot be earned unless a form service (Formspree) is set up | the site owner chooses: unlock the badge when the email draft opens, or leave it locked until a form service is set up; not decided, not fixed |
| B-12 `backend/` would be published | If the backend branch merged without `b4873c0`, `backend/` would be served, because only `b4873c0` adds the `_config.yml` exclusion | covered by the merge order (fixes first); open until `b4873c0` is merged |

## Suspected, found by reading the code and not run

| What | Detail | Tracked |
|---|---|---|
| GitHub card fields not escaped | Fields from the GitHub API are put into the page without escaping; not reproduced | fix in `b4873c0` (escapes `html_url` and `language`), reviewed by Orchestra (71 passed, 9 skipped), QA signed off, not merged, so still open |

## Gaps

| What | Detail | Tracked |
|---|---|---|
| Live check cannot prove the exact commit | It compares hand-bumped `?v=` numbers; PR #9 changed `js/script.js` without bumping `?v=6` | issue #15; fix in `31ae02c` (`feat/stamp-commit-sha`), reviewed by Orchestra, QA signed off with conditions, not merged, so still open |
| Motion is untested on `main` | Tests block the CDNs, so GSAP/Lenis behaviour is never run there. The motion branch has more tests (171 passed, 45 skipped in Orchestra's review) but is not merged | `feat/motion-p1` |
| Motion performance only measured on a laptop browser | QA measured the motion branch with a 4x CPU slowdown at 430px in headless Chrome: 96.1 to 99.5 percent of frames within 20 ms and no extra long tasks over the baseline. That is not a real phone | `feat/motion-p1`; real-phone pass is #5 |
| Backend tests have not run in GitHub Actions | They are set up to run in CI (`f1b4103`) and pass offline, but Actions has not run them | `feat/aws-backend` |
| Minor QA observations | O-3 to O-6 (small motion and sizing notes) are recorded by QA in `docs/qa`, not copied here | `docs/qa` |
| Only Chromium is tested | No Firefox, WebKit or real-device runs in CI | #5 covers a real phone only |
| Unused files | `assets/avatar.png`, `avatar-alt.png`, `avatar2-alt.png` and `assets/logos/github.png` are not referenced by the site | none |
| Open dependency updates | Dependabot pull requests 10 to 14 (Actions bumps) are unmerged | the pull requests |
| Checkout fails on some Windows clones | The long file name `assets/reports/FarmIntel-Fruit & Vegetable Disease Detector Group 28.pdf` exceeds the path limit, so clone or checkout can fail. Workaround: `git config core.longpaths true`, or shorten the name | none |
| Branch protection | Requiring **CI passed** is a manual GitHub setting; whether it is on is not recorded | CONTRIBUTING.md |

## Backend limits

Kept by the backend's owner in `backend/README.md` under "Known limits", not copied here. That file is on branch `feat/aws-backend`, not on `main`, and the backend has never been validated or deployed on AWS. QA signed off the backend at code level only. The limits reported earlier were: 200 pending reviews block new ones, the visit count can be inflated, and the site form (form data) does not match the backend (JSON).
