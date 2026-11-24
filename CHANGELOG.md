# Changelog and timeline

Everything that has changed on this site, newest first, with the issue or pull request that explains it.
Times are **Malaysia time (UTC+8)**. Since 24 Nov 2026 every change has an issue (the first three, #2 to #4, were written up right after they were merged); earlier work is recorded by commit only.

**Keeping it current:** add one line under **Unreleased** in every pull request (the PR template reminds you). When the pull request is merged, move the line under that day's heading.

## Unreleased

Pull request [#9](../../pull/9)

- **Fixed:** the **Download CV** buttons never opened the print dialog, because the terminal's `print()` helper overwrote `window.print` ([#7](../../issues/7))
- **Added:** CI on every pull request and push to `main`: ESLint, HTML validation, a missing-file check and browser tests at phone and desktop size ([#6](../../issues/6))
- **Added:** a CI/CD pipeline: pushing to `main` now runs CI, then build, then deploy, then verifies the live site. A failing check stops the deploy, and nothing deploys from any other branch ([#8](../../issues/8))
- **Added:** `scripts/verify-live.mjs`, the post-deploy check that proves the live site is this commit and that developer files are not public ([#8](../../issues/8))
- **Added:** issue forms, a pull request template, Dependabot, `CODEOWNERS` and `CONTRIBUTING.md` describing the whole workflow ([#6](../../issues/6))
- **Added:** this changelog and timeline
- **Changed:** buttons and inputs now have explicit types so `index.html` is valid HTML

## 24 Nov 2026: fixes, logos, a playful skills section and a proper workflow

| Time | What happened | Where |
|---|---|---|
| 20:33 | Proof folders: photos no longer spill out of the cards on phones, and the tilt no longer sticks after a tap | [#2](../../issues/2), `253d8a7` |
| 20:35 | Technology logo on every skill pill, self-hosted with credits | [#3](../../issues/3), `3d61aee` |
| 20:41 | Skills section made playful: colour groups, springy pills, sparkles, **Surprise me**, **Toolbox tourist** badge (now 14 badges) | [#4](../../issues/4), `6b15580` |
| 20:48 | Pull request opened as a draft | [PR #1](../../pull/1) |
| 20:50 | Pull request merged; GitHub Pages deploy succeeded about 40 seconds later | [PR #1](../../pull/1) |
| 20:50 | Issues opened to record the work: #2 (bug), #3 and #4 (enhancements), #5 (check on a real phone) | [#2](../../issues/2) [#3](../../issues/3) [#4](../../issues/4) [#5](../../issues/5) |
| 20:51 | #2, #3 and #4 closed as completed | |
| 20:53 | Issue opened for CI, tests and the contribution workflow | [#6](../../issues/6) |
| 20:53 | Bug found by the new linter and recorded: Download CV did nothing | [#7](../../issues/7) |
| 20:58 | Download CV fixed, HTML made valid, lint, asset check and browser tests added | [#7](../../issues/7), `91da484` `4222cb4` `4d88bcd` |
| 21:01 | Follow-up recorded: gate the deploy on CI | [#8](../../issues/8) |
| 21:02 | CI workflow, templates, Dependabot and docs added; pull request opened as a draft; first CI run started | [PR #9](../../pull/9), `794551e` |
| 21:03 | First CI run on GitHub passed: lint, HTML and assets, browser tests, and the **CI passed** summary | [PR #9](../../pull/9) |
| 21:08 | CI/CD pipeline added: deploy now waits for CI, deploys only from `main`, then verifies the live site | [#8](../../issues/8), [PR #9](../../pull/9) |

## 23 Nov 2026: guestbook, photos as proof, and motion

- 17:05 Motion layer: Lenis smooth scroll and GSAP scroll effects (`55dde1c`)
- 16:57 Proof folders, a drag-around photo desk and passport-stamp badges (`0bbacb3`)
- 16:52 Photo evidence attached to experience; skills and education made interactive (`326259e`)
- 16:47 Photo from the Dean's Award day (`0b826e0`)
- 13:53 Four photos from the CIP 2026 and Arduino school programmes (`c393cc7`)
- 11:51 Mobile layout fixes: shorter lessons list, wrapping tabs, uncropped covers (`99c4e43`)
- 11:34 Approve-first guestbook, visit counter, quiz and card tilt (`3a741ec`)
- 09:20 Navigation folded into the menu below 1080px (`463d190`)

## 22 Nov 2026: the portfolio is rebuilt as an interactive single page

- 23:00 "What I learned" shown for every project (`93ef484`)
- 22:50 Real photos, studio portrait, YouTube talks and two more projects (`234c7e3`)
- 22:42 MEDS case study, command palette, achievements and two more projects (`90a5f71`)
- 22:24 CV export, live GitHub activity, photos, mobile menu and SEO (`fcfe36c`)
- 21:06 Portfolio rebuilt as an interactive single page (`068796e`)

## Earlier in 2026: the first version

- 23 Jul: `index.html` and README updated (`3befe9f`, `f5bda1c`)
- 21 Apr: CGPA updated and small fixes (`f553a6e`, `5f72758`)
- 9 Jan: small fix (`9c4e147`)
- 4 Jan: first commit, GitHub Pages deploy workflow added, and the first round of JavaScript fixes (`89cd7a3` to `5c43493`). The repository was then called `E-portfolio-assignment-HCI`.

## Issue and pull request ledger

| # | Type | Title | Opened | Closed or merged |
|---|---|---|---|---|
| [PR #1](../../pull/1) | Pull request | Fix Proof folders on phones, add skill logos, make Skills playful | 24 Nov 20:48 | merged 24 Nov 20:50 |
| [#2](../../issues/2) | Bug | Proof folders: photos spill out of the cards and the tilt sticks after a tap on phones | 24 Nov 20:50 | closed 24 Nov 20:51 |
| [#3](../../issues/3) | Enhancement | Skills: show a logo on every skill pill | 24 Nov 20:50 | closed 24 Nov 20:51 |
| [#4](../../issues/4) | Enhancement | Skills: make the section playful | 24 Nov 20:50 | closed 24 Nov 20:51 |
| [#5](../../issues/5) | To do | Check Proof folders and Skills on a real phone after deploy | 24 Nov 20:50 | open |
| [#6](../../issues/6) | Enhancement | Add CI, automated tests and a proper contribution workflow | 24 Nov 20:53 | open, closes with PR #9 |
| [#7](../../issues/7) | Bug | Download CV button does nothing: `print()` overwrites `window.print` | 24 Nov 20:53 | open, closes with PR #9 |
| [#8](../../issues/8) | Enhancement | Gate the GitHub Pages deploy on CI | 24 Nov 21:01 | open, closes with PR #9 |
| [PR #9](../../pull/9) | Pull request | Add CI, automated tests and a contribution workflow; fix broken Download CV | 24 Nov 21:02 | draft |
