# QA test plan: cross-device, mobile web and animation

Baseline taken on `main` at `e322405`, branch `test/cross-device`. Browser: Google Chrome 157 (the machine's own, via `PW_CHROMIUM_PATH`).

## What QA can and cannot do

| QA can | QA cannot |
|---|---|
| Run the site at phone, tablet, laptop and desktop sizes, portrait and landscape, and catch layout breaks, sideways scroll, unreachable controls and script errors. | Judge whether it *looks nice*. Every device test attaches a full-page screenshot; a human still has to look at them. |
| Run the animated path (real GSAP + Lenis) and the "CDN down" paths and assert the page still scrolls and content ends up visible. | Feel animation smoothness (jank, 60fps) on a real phone's GPU. |
| Check the search-on-mobile basics in the files: viewport, title, description, canonical, robots, sitemap, links, images. | Rank in Google or pass Google's live Mobile-Friendly / Core Web Vitals checks (needs the live URL and the user's Search Console). |
| After each developer change: re-run, and add a test for the new feature. | Test on a real iPhone/Android, Safari or Firefox without more setup (see "Needs the user"). |

Emulation is **not** a real iPhone or Android: it sets viewport, touch and user agent, but not Safari's rendering engine, the iOS address bar resizing the viewport, notches, or real touch scrolling.

## How to run

```powershell
npm ci
$env:PW_CHROMIUM_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"   # or let CI install Playwright's browser
$env:PW_PORT = "4183"        # own port, so reuseExistingServer cannot silently test another clone on 4173
npx playwright test                       # everything
npx playwright test --project=qa          # only the cross-device QA specs
```

Projects: `phone` (430px touch) and `desktop` (1280px) run the original specs; `qa` runs `tests/qa-*.spec.js`, which set their own size per test. The `qa-motion` specs load the real GSAP/Lenis from the CDN, so they are **opt-in**: off by default, so CI never depends on a CDN (decision 006). Run them with `$env:PW_REAL_CDN = "1"; npx playwright test --project=qa tests/qa-motion.spec.js` (needs internet; they also skip if the CDN is unreachable). Nothing here opens the live site, so the public visit counter is not incremented.

**"Expected failure" tests** (`test.fail`) document a known bug. They pass while the bug exists and turn red the day it is fixed, which is the cue to delete the `test.fail` line.

## Device and browser matrix

| Group | Sizes | Touch | Automated | Notes |
|---|---|---|---|---|
| Laptop | 1366x768, 1440x900 | no | yes | most common laptop screens |
| Desktop | 1280x800 (original), 1920x1080 | no | yes | |
| Tablet | 768x1024 portrait, 1024x768 landscape | yes | yes | menu button still shown (breakpoint is 1080px) |
| Phone portrait | 320x640, 360x740, 390x844, 430x932 | yes | yes | 320 is the smallest supported width |
| Phone landscape | 844x390, 740x360 | yes | yes | finds B-01 |
| Themes | light and dark, system and toggle | | yes | contrast >= 4.5:1 on body, lead and muted text |
| Reduced motion | `prefers-reduced-motion: reduce` | | yes | no endless animations; motion.js stays out |
| CDN | all blocked / each library blocked / all loaded | | yes | all-blocked is the original suite |
| Keyboard only | skip link, Tab order, focus ring, dialog open/Escape/focus return | | yes | |
| Print CV | print media | | yes | chrome hidden, CV header shown (manual PDF check still advised) |
| Browser engines | Chromium | | yes | Firefox and WebKit: see below |

## Test cases

"M" = manual / needs the user.

### Layout and responsiveness (`qa-matrix.spec.js`, once per device)
- **L1** loads, no script errors; **L2** no horizontal scroll at top and bottom of page; **L3** full-page screenshot attached for review.
- **L4** wide screens show nav links, no menu button; narrow screens (<= 1080px) show the menu button, it opens, Escape closes it, a link scrolls to its section.
- **L5** menu fits on screen or scrolls, so every link is reachable (**fails on short landscape phones: B-01**).
- **L6** header controls are at least 24x24px (WCAG 2.2); **L7** body text is at least 15px.
- **L8** the five old pages (about/academic/contact/qualities/works.html) redirect to a real section of `index.html`, on phone and laptop.

### Themes, accessibility, print, reduced motion (`qa-matrix.spec.js`)
- **T1/T2** light and dark follow the system; text contrast >= 4.5:1; **T3** toggle changes colours and survives reload.
- **K1** skip link is first and works; **K2** 14 Tab presses never fall to `<body>` and each stop shows a focus ring; **K3** terminal opens by keyboard, Escape closes, focus returns.
- **P1** printed page hides the topbar and trophy, shows the CV header, no overflow. **M:** open the real print preview and check page breaks and that the PDF is one to two A4 pages.
- **R1** with reduced motion nothing animates forever.

### Animation (`qa-motion.spec.js`, real GSAP/ScrollTrigger/Lenis; opt-in with `PW_REAL_CDN=1`)
- **A1** libraries load (URLs and SRI hashes still valid) with no errors. **A2** mouse wheel scrolls. **A3** headings split into words and settle. **A4** folders pop in and end at opacity 1. **A5** hero drifts and comes back. **A6** menu link glides to its section. **A7** a dialog freezes page scroll and gives it back. **A8** no sideways scroll while animating. **A9** phone: touch scroll works, folders visible. **A10** reduced motion: no word-splitting, normal wheel scroll.
- **C1-C4** CDN partly down: all blocked (`qa-fallback.spec.js`, no network, runs in CI) / GSAP only blocked / ScrollTrigger only blocked / Lenis only blocked (`qa-motion.spec.js`, opt-in). Each must still scroll and show content (**C2 and C3 fail: B-02**).
- **M:** smoothness (no jank, no flicker when headings animate) on a real phone and an older laptop. Automation can only prove end states.

### Search on mobile (`qa-seo.spec.js`)
- **S1** `lang`, title (10-65 chars), description (50-170). **S2** viewport is `width=device-width` and zoom is not disabled. **S3** canonical is the absolute https URL and equals `og:url`. **S4** Open Graph title, description and absolute image. **S5** JSON-LD parses. **S6** no `noindex`. **S7** one visible h1, all images have alt. **S8** `robots.txt` allows crawling and names the sitemap; **S9** `sitemap.xml` lists the canonical page. **S10** all in-page links have a target, local links return < 400, `target=_blank` has `rel=noopener`; **S11** every image loads. **S12** redirect stubs have an absolute canonical (**fails: B-03**).
- **M:** after publishing, run Google's Mobile-Friendly / PageSpeed Insights on the live URL (needs the user; opening the live page also bumps the public visit counter).

### Guestbook (`qa-fallback.spec.js`)
- **G1** submit must not claim success when only a mail draft opened (**fails: B-04**).
- **G2** with no reviews the sort chips are hidden; **G3** pressing the sort chips never hides a project (`qa-folders.spec.js`; **both fail: B-07**).

### Proof folders and the `hidden` attribute (`qa-folders.spec.js`)
- **F1** at 320, 390, 430, 760, 761 and 1280px, for each folder: its files appear directly below it and above the next folder on one column, below the row on three columns (**fails for folders 1 and 2 at <= 760px: B-05**).
- **F2** exactly one folder is `aria-expanded`, and switching moves the mark; **F3** closing a folder hides its files (**fails: B-06**); **F4** the open folder looks open (photos lifted); **F5** icons sit inside the front panel (**fails: B-09**); **F6** after Enter on a folder the next Tab stop is one of its files (**fails: B-05**).
- **H1** every element with the `hidden` attribute is really hidden, phone and desktop (**fails: B-06/B-07/B-08**); **H2** `docs/` and developer files are not published (`qa-seo.spec.js`; docs **fails: B-10**).

## Needs the user (not done, not automatable here)
1. **Real devices (issue 5):** at least one real iPhone (Safari) and one Android (Chrome), portrait and landscape: scrolling feel, address-bar resize, notch/safe areas, tap targets, tap-to-open folders, the menu, the print/CV button, form keyboard, pinch-zoom.
2. **Firefox and WebKit (Safari engine):** `npx playwright install firefox webkit` downloads a few hundred MB of browsers. Not run; needs the user's OK. After that, add `firefox` and `webkit` projects (3 lines in `playwright.config.js`). WebKit is the closest automated stand-in for iPhone Safari.
3. Live-site checks (Search Console, PageSpeed) as above.

## Baseline (`main` e322405 plus this branch's tests, before any fixes)

*Snapshot taken before the fixes. Markers for the bugs fixed in `b4873c0` have since been removed, so on plain `main` those tests are now red by design (17 in the default run, 3 more with `PW_REAL_CDN=1`) until the fixes merge; see the sign-off table for the per-SHA results.*

| Suite | Result |
|---|---|
| Original specs, `phone` + `desktop` | 40 passed, 6 skipped (identical to the developer baseline) |
| `qa` project, default (no internet) | 116 passed, 19 skipped (16 real-CDN cases are opt-in, 3 are "menu fits" on wide screens which have no menu) |
| of the 116, expected failures (known bugs, reported by Playwright as passed) | 26: B-01 x2, B-03 x5, B-04 x1, B-05 x9, B-06 x1 + 2, B-07 x4, B-09 x1, B-10 x1 (the `hidden` audit counts under B-06/B-07/B-08) |
| `qa`, with `PW_REAL_CDN=1`, `qa-motion.spec.js` only | 16 passed, of which 2 expected failures (B-02 x2) |
| `eslint .` | clean |

## Bugs found on `main`

Severity: see "Severities" below. **Blocker or major = no sign-off.** "Status" is what QA has verified, not what a developer claims.

| ID | Sev | Where | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| **B-01** | major | `css/style.css` mobile `.nav` (<= 1080px) | Phone held sideways (844x390, 740x360); tap the menu button. | Every link reachable: menu fits or scrolls. | Menu is ~410px tall, runs to y=479 on a 390px screen, header is sticky and the menu has `overflow: visible`: Skills and Contact are off-screen and unreachable. Suggested: `max-height: calc(100dvh - 68px); overflow-y: auto` on `.nav.open`. | **fixed and verified on b4873c0** (menu scrolls, Contact reachable by touch swipe and by wheel with the real libraries) |
| **B-02** | major | `js/motion.js` | Block `gsap.min.js` (or only ScrollTrigger) but let Lenis load; scroll with the mouse wheel. | Page scrolls. | Page does not scroll: Lenis only ticks from `gsap.ticker`. | **fixed and verified on b4873c0** (real CDN, GSAP-only and ScrollTrigger-only blocked) |
| **B-03** | minor (search) | `about/academic/contact/qualities/works.html` | View source. | Absolute canonical without a fragment. | `<link rel="canonical" href="index.html#about">`: relative, with a fragment, so search engines ignore it. | **fixed and verified on b4873c0** (absolute canonical on all five stubs) |
| **B-04** | major | `js/script.js` guestbook (`FORMSPREE_ID` empty) | Fill the review form, press Send. | Honest message. | "Thank you! I'll read it..." plus badge and confetti although only a `mailto:` draft opened; with no mail app the review is silently lost. | **fixed and verified on b4873c0**; side effect B-11 |
| **B-05** | major | `index.html:193` `#foldBody` after `#folders`; `css/style.css:573` | Phone width (320-760px). Tap folder 1 or 2. | Its files appear directly under it, above the next folder. | One shared panel always follows the LAST folder. At 390px, folder 1 ends at y=4773 and its panel starts at y=5143, below folders 2 and 3 (370px gap). Folder 3 is fine. From 761px (three columns) the panel is correctly below the row. Tab order has the same flaw: Enter on folder 1, Tab goes to folder 2, not to its files. Reported by the user (via Designer). | **fixed and verified on bb08f34** (panel is right after the tapped folder on one column, in the DOM and on screen: 14px gap at 320-760px; three columns unchanged) |
| **B-06** | major | `js/script.js:719` + `.fold-body { display: grid }` | Open a folder, tap it again to close. | Files disappear. | `aria-expanded` goes false but the files stay on screen (`hidden` is overridden by `display: grid`). This is why the user's second screenshot shows the Awards folder looking closed (photos not lifted) with its files still showing. | **fixed and verified on bb08f34** (closing hides the files; global `[hidden]` rule) |
| **B-07** | major | `js/script.js:434` selector `$$(".filters .chip")` also matches the guestbook sort chips; `css/style.css:204` `.filters { display: flex }` overrides `[hidden]` on `.rv-sort` | Open the page with 0 reviews; the sort chips are visible. Press one. | Chips hidden with fewer than 2 reviews; sorting never touches the projects. | Chips visible with 0 reviews; pressing one hides all 9 projects (phone and desktop; also with 2 reviews). Found by Orchestra, reproduced by QA. | **fixed and verified on b4873c0** (sort chips hidden below 2 reviews, sorting never hides a project; phone and desktop) |
| **B-08** | minor | `js/script.js:1095` visits `.rv-stat` | Visit counter API unreachable. | Stat card removed. | `hidden` is set but the card is still displayed (QA's `[hidden]` audit; the visual effect was not inspected). Same root cause as B-06/B-07: no global `[hidden] { display: none }`. | **fixed and verified on bb08f34** (visits card hidden when its API fails) |
| **B-09** | minor (cosmetic) | `.f-ico` in `.f-front`, phone width | Look at the proof folders at 390px. | Icon sits inside the front panel. | Icon box starts 5px above the front panel's top edge; the emoji touches the edge (screenshot confirms). At 1280px it is 17px inside: fine. | **fixed and verified on bb08f34** (folder 168px tall; icon sits inside the front panel) |
| **B-10** | major | `_config.yml` `exclude:` | Publish the site with `docs/` in the repo. | Internal QA and design notes stay private. | `docs` is not excluded: `GET /docs/qa/test-plan.md` returns 200 on the local Pages-like server (`scripts/serve.mjs` mirrors Jekyll). Raised by the Designer for its own docs; applies to this file too. Fix: add `- docs` to `exclude:` in the same pull request. | **fixed and verified on b4873c0** (`docs` and `backend` in `exclude:`; with real files present they return 404) |
| **B-11** | minor | `js/script.js:1072` `done()` | With the B-04 fix in place and `FORMSPREE_ID` empty, try to earn the "Critic" badge. | Either reachable or consciously removed. | `unlock("review")` runs only inside `done()`, which now runs only after a Formspree success. With no Formspree ID the "Critic - Sent a review" badge (1 of 14) can never be earned, so the trophy cannot reach 14/14. A product decision: grant it when the draft opens, or drop it until Formspree/the AWS backend is live. Introduced by the B-04 fix (before it, the badge was granted for a message that was not true). | open; found on b4873c0 |
| **B-12** | major (when merged alone) | `_config.yml` `exclude:` at f1b4103 | Serve `f1b4103` with the Pages-like server: `GET /backend/template.yaml`, `/backend/docs/threat-model.md`, `/backend/README.md`, `/backend/openapi.yaml`. | 404: infrastructure and security notes stay private. | All four return 200, so merging the backend branch alone would publish its template, threat model and API contract. Same cause as B-10; `b4873c0` already adds `backend` and `docs` to `exclude:`. | open on f1b4103 alone; **resolved if b4873c0 merges first** (the two merge without conflicts) |

Observations (not logged as bugs):
- **O-1:** resizing 1280 -> 390 with a folder open: the tapped folder moves from y=325 (on screen) to y=2099 (off screen) because the page reflows taller and scroll stays put. Normal reflow, not folder-specific; it returns when resized back.
- **O-2:** the trophy button is `position: fixed` (81x40, bottom-left) and covers whatever scrolls under it; in the states measured it covered no folder-file text, and the footer reserves 80px for it. A caption under it in the user's screenshot is that button doing its job, unless a caption can never be scrolled clear.
- **O-3:** the Details dialog opens from the card with its transform origin about 3px off the card centre in x (the page scroll-lock removes the scrollbar as the dialog opens). At a 0.94 to 1 scale that is far under 1px of visible shift; not a bug.
- **O-4:** a filter pressed while the project cards are still doing the site's own 0.8 s reveal fade has no layout change to animate, so the cards just switch. Real visitors cannot hit this window; tests must wait for the reveal.
- **O-5:** after the Details dialog closes, its leftover transform-origin override is cleared by the dialog's `close` event a few milliseconds later. The dialog is already hidden by then and the next open resets it, so there is no visible effect.
- **O-6:** the heartbeat button (`.btn`) measures 43.997px high, 0.003px short of the spec's 44px minimum for controls; sub-pixel rounding, not a defect in practice.
- Not bugs: the second `h1` is the hidden print header; `img#lbImg` (lightbox) has no `src` until opened.

## Process

### Entry criteria: QA starts testing a build only when
1. The developer (via Orchestra) names an **exact commit SHA** and branch. No SHA, no test.
2. The branch is clean to build: `npm ci`, `npm run lint`, `npm run validate:html`, `npm run check:assets` pass.
3. The change says which issue or Designer acceptance criterion it covers and how to see it (so a case can be traced).
4. Anything the change cannot show locally (a GitHub Actions run, the live site) is named up front, so it can be recorded as "not tested".

### Exit criteria: QA signs off a SHA only when
1. **No blocker or major bug introduced by that SHA, and every blocker or major bug it claims to fix is verified fixed.** Two levels, kept apart on purpose:
   - **Merge sign-off** (this row of the table): the change does what it says, no regression, nothing new at blocker or major.
   - **Release readiness** (the site as a whole): *zero* open blocker or major bugs anywhere, including old ones the change does not touch. A fix branch does not become blocked by an older bug it never claimed to fix, but the site is not release-ready while that bug is open.
2. Every case in scope has a recorded result: **pass, fail, skipped (with the reason) or not tested**. "Not tested" is never "pass" and never hidden.
3. Every bug claimed fixed was **retested on that exact SHA** (its `test.fail` marker removed and the test green), and the **full regression** (original 40 + QA suite) ran on the same SHA.
4. Open minor bugs are listed in the sign-off and accepted by the owner.
5. No test was edited to make a failure go away.

### Severities
| Severity | Meaning | Examples | Sign-off |
|---|---|---|---|
| **Blocker** | Site unusable for everyone, data loss, security or privacy leak (secrets, personal data), or the pipeline breaks or publishes the wrong thing to production. | Home page does not load; secrets in the published site; deploy publishes a broken build. | never |
| **Major** | A feature is broken or content is unreachable for a normal group of visitors with no workaround, the site tells the visitor something false, a regression of a fixed issue, or internal files go public. | B-01 (landscape phones cannot reach Contact), B-04 (false "sent"), B-05, B-06, B-07, B-10. | not while open |
| **Minor** | Cosmetic, wording, or an edge case with an easy workaround. | B-03, B-08, B-09. | allowed if listed and accepted |

### Bug report format (one per bug; send to Orchestra, never as a GitHub issue until the user approves)
```
ID / title:        B-nn short sentence
Severity:          blocker | major | minor      Found on: branch @ exact SHA
Where:             file:line or page/section
Environment:       browser + version, viewport / device (emulated or real), theme, motion setting, CDN state
Steps:             1. ... 2. ... (start from a fresh load)
Expected:          what should happen (cite the issue or acceptance criterion)
Actual:            what happens, with measurements (px, counts) or a screenshot path
Evidence:          failing test name, or "test.fail marker in tests/..."
Workaround:        none | ...
Status:            open | fixed in <SHA> | retested <SHA>: pass/fail | closed
```

### Retest and regression procedure (per SHA)
1. `git fetch` the branch from the developer's clone (read only), check out the **exact SHA**, detached, in a separate worktree. Own port: `PW_PORT=<unused>`; never reuse another session's server.
2. Overlay this branch's `playwright.config.js` and `tests/qa-*.spec.js` (uncommitted), `npm ci`, run the static checks, then `npx playwright test` for each project.
3. For every bug the SHA claims to fix, delete its `test.fail` line and confirm green on that SHA. A red marker-less test is a failed fix.
4. Run the full regression; compare with the previous sign-off row. Any new failure is a regression and gets a bug report.
5. Fill a row of the sign-off table. Never sign a SHA that was not the one tested.

### Merge order
1. **Fixes first.** Each developer fix branch merges with its own tests as today.
2. **Then `test/cross-device`**, with the `test.fail` marker removed for **every bug that is fixed by then** (otherwise Playwright reports "expected to fail but passed" and CI goes red). Markers stay for bugs still open, so CI stays green and the bug stays visible.
3. Do not remove a marker until QA has tested the **final fix SHA**; markers are kept until then.
4. `docs` and `backend` must be in `exclude:` of `_config.yml` (B-10, B-12) before this branch or the backend branch merges. `b4873c0` does it, so merge **`fix/review-findings` first**, then **`fix/folders`** (stacked on it: `bb08f34` contains `b4873c0`), then **`feat/motion-p1`** (stacked on `bb08f34`), then `feat/aws-backend`, then this branch (the code branches merge without conflicts; checked with `git merge-tree` for `fix/review-findings` and the backend, and `feat/motion-p1` is a straight extension of `bb08f34`).
5. CI runs plain `npx playwright test`, which now includes the `qa` project (~1 min extra). Real-CDN cases are skipped there by design (`PW_REAL_CDN` unset), so CI never depends on a CDN (decision 006).

### Traceability: every case to its source
| Source | Cases | Result so far |
|---|---|---|
| Issue 2: proof folders (photos spill, tilt sticks) | `site.spec.js` (existing); `qa-folders.spec.js` F-pos (6 widths x 3 folders), F-state, F-key | existing pass; B-05, B-06, B-09 **fixed and verified on bb08f34** |
| Issue 3: logo on every skill; Issue 4: playful skills | `site.spec.js` (existing) | pass |
| Issue 5: check on a real phone (open) | manual M1-M3 below | **not tested** (needs the user) |
| Issue 6: CI, automated tests, contribution workflow | whole suite in CI; `ci.yml` | pass locally; Actions run not tested by QA |
| Issue 7: Download CV | `site.spec.js` (existing), P1 print | pass |
| Issue 8: gate the deploy on CI | `pipeline.spec.js` (existing); live smoke checks | local pass; deploy path not tested |
| Issue 15: stamp commit ID | see sign-off row 1 | signed off with conditions |
| User request: "ok on pc and laptop and work on mobile" | L1-L8, T1-T3, K1-K3, P1, R1, S1-S12 (`qa-matrix`, `qa-seo`) | pass except B-01, B-03 |
| User request: "no bug on UI or animation" | A1-A10, C1-C4 (`qa-motion`, opt-in), `qa-fallback` | pass except B-02; smoothness manual |
| User report via Designer: files open under the wrong folder on mobile | `qa-folders.spec.js` | B-05, B-06 confirmed |
| Orchestra report: sort chips hide all projects | `qa-folders.spec.js` sort + `[hidden]` audit | B-07, B-08 confirmed |
| Designer `docs/design/motion-spec.md` @ fad4d98, item 1 Set the mood | D1: card and all ancestors at opacity 1 while the mood buttons are on screen (320/430/760/1280, real GSAP); same card height for all five moods (320/430/760/1280); Excited shows Excited, one `aria-pressed`, still Excited 4 s later; pressing again clears it and cycling resumes within 4 s; reduced motion: Calm shows "Calm" and 66 bpm and two canvas captures 500 ms apart are identical; five buttons on one row at 320px | **pass on 31602a9** (`qa-motion-p1.spec.js`, `qa-motion.spec.js` real-CDN) |
| item 2 Send a heartbeat | D2: a run visits the seven stops in order and leaves no dot; hover or focus mid-run stops it and the text stays 3 s; tab switch mid-run and back leaves no dot and an enabled button; two fast presses never run two dots; button never overlaps `#trophy` at 320/430/760; reduced motion: one stop per press; `#archInfo` is `aria-live="polite"` after any end or stop | **pass on 31602a9** (tab switch simulated, see below) |
| item 3 Cards that travel | D3: each filter shows exactly the cards whose `data-cats` contain it, All shows 9; four chips within 500 ms end on the last, nothing running or left over 1 s later; two reviews and both sort chips leave all 9 projects; focus returns to the same Details button after Escape; print shows all projects with a filter on | **pass on 31602a9** |
| item 4 Skill wires | D4: text still matches `Flutter shows up in \d+ projects?` and chip count equals it; lines = chips on desktop; three skills in 500 ms leave only the last; at 320px nothing leaves the card and resize keeps lines attached; chips open by click and Enter | **not tested** (not built) |
| item 5 Desk with weight | D5: a flick moves a photo on after release and ends inside; reduced motion 0 px after release; a drag > 5 px does not open the lightbox, next tap does; ArrowRight moves 24 px and page does not scroll; phone: swipe up in the side strip scrolls the page; Tidy up then leaving desk mode leaves no inline position | **not tested** (not built) |
| item 6 Badge flight | D6: first proof-folder open makes one flyer gone within 1.5 s, repeat makes none; unlock inside a dialog makes none and shows the toast; accessible name matches `#trophyCount`; "Try next" on exactly one badge and on none at 14/14 | **not tested** (not built) |
| Designer rules for all six | no new dependency and identical with CDNs blocked (`qa-fallback`); no sideways scroll at 320/390/430/761/1024/1280; controls >= 44px; contrast >= 4.5:1; print hides new controls; perf: 4x CPU, 430px, 10 s, no long task > 50 ms, >= 90% frames within 20 ms | partly covered (width, print); contrast, 44px and perf **not tested** on the new features |

### Sign-off table
Fill one row per tested SHA. The environment is always: Windows 11, Google Chrome 157 (emulation, not a real device), Node 24, own port, QA overlay from `test/cross-device`.

| Branch | Exact SHA | Pass | Fail | Skipped | Not tested | Open bugs on this SHA | Verdict |
|---|---|---|---|---|---|---|---|
| `feat/stamp-commit-sha` | `31ae02cfd27a61a1e8c55f1bcaeef7b86ee8379d` | phone 18, desktop 31 (incl. 9 stamp cases), qa 115 | 0 real failures. One QA marker reported failed: `docs/ is not published` "expected to fail but passed", because this tree has no `docs/` (B-10 only exists on branches that add `docs/`); not a defect of this SHA | phone 14 + desktop 1 (stamp/pipeline cases that run once, plus 5 desktop-only), qa 19 (16 opt-in real-CDN, 3 menu on wide screens) | see "Issue 15 checklist" | B-01..B-10 all **pre-existing**, none introduced; this SHA changes no site file. New: 1 minor (docs, below) | **SIGN OFF WITH CONDITIONS** (below) |
| `fix/review-findings` | `b4873c04d89576d6fdbd783f93cec24a76791189` | phone 32, desktop 39 (= 71, matches Orchestra), qa 118, real-CDN `qa-motion` 17 | 0 | phone 8 + desktop 1 (stubs and pipeline cases that run once), qa 20 (17 opt-in real-CDN, 3 menu-fit on wide screens) | live site, real devices, Actions run (see below) | Fixed and verified: B-01, B-02, B-03, B-04, B-07, B-10. **Still open (pre-existing, not claimed fixed): B-05 major, B-06 major, B-08, B-09.** New: B-11 minor | **MERGE SIGN-OFF GRANTED. NOT release-ready** while B-05 and B-06 (the proof folders, reported by the user) are open. Orchestra decides whether that gap is acceptable; QA does not call the site release-ready. |
| `fix/folders` | `bb08f3443fa4a9b4068c8bce17264cdf0c5c5bd1` (on top of b4873c0) | phone 32, desktop 75 (= 107, matches Orchestra), qa 137, real-CDN `qa-motion` 17 | 0 | phone 44 + desktop 1 (cases that run once), qa 20 (17 opt-in real-CDN, 3 menu-fit on wide screens) | live site, real devices, Actions run | Fixed and verified: B-05, B-06, B-08, B-09. Open: **B-11 (minor, product decision)**. No new bug. | **MERGE SIGN-OFF GRANTED.** No known open blocker or major bug on `main` + `b4873c0` + `bb08f34`. Release readiness still needs the real-device pass (issue 5), the merge-day smoke checks, and a decision on B-11. |
| `feat/aws-backend` | `f1b41033e473457b082f8c617c071a135615efa0` | backend `node --test` 50/50; site specs unchanged: phone 18 + desktop 22 = 40 passed, 6 skipped; root lint clean | 0 | 0 | **all AWS behaviour** | B-12 (major if merged alone) | **CODE-LEVEL SIGN-OFF ONLY, and only together with the `_config.yml` exclude from b4873c0 (merge that first).** AWS behaviour: **not tested**. |
| `feat/motion-p1` (items 1-3 of spec `fad4d98`) | `31602a93bfd021b9e88f7832a4fcbf823e5cfb22` (on top of bb08f34) | phone 64, desktop 107 (= 171, matches Orchestra), qa 199, real-CDN `qa-motion` 21; D1-D3 spec 62 cases, repeated 5x in parallel (310/310) and the timing-sensitive subset 8x on one worker (224/224) | 0 | phone 44 + desktop 1, qa 24 (21 opt-in real-CDN, 3 menu-fit on wide screens) | items 4-6 of the spec (not built); a real phone; the live site; D2/D3 with the real GSAP/Lenis (Orchestra ran the heartbeat at 430px with them; QA ran only D1 opacity with them) | No new bug. Open: B-11 (minor). Observations O-3 to O-6. | **MERGE SIGN-OFF GRANTED for items 1-3.** Performance (4x CPU, 430px) measured under 4-14% background load: pass. Items 4-6 are **not built, not tested**. |

#### Issue 15 checklist (sign-off of `31ae02c`)
| Plan item in issue 15 | Result | Evidence |
|---|---|---|
| Small tested script that rewrites `?v=` (`scripts/stamp-version.mjs`) with unit tests | **pass** | 9 stamp cases green. QA stamped a copy: exactly 3 links changed (`css/style.css`, `js/script.js`, `js/motion.js` now `?v=31ae02c`), nothing else; the repo's own `index.html` stayed unchanged; stamping an empty folder or a non-commit ID fails loudly. |
| Called from Build site before Jekyll, using the commit ID | **pass by review, not tested in Actions** | Step order and `$GITHUB_SHA` read from the diff. The YAML was not parsed by any tool here, and no real run happened: **not tested**. |
| `verify-live.mjs` expects the stamp when the commit is given, and keeps its local behaviour | **pass** | Local end-to-end with `VERIFY_COMMIT` (a dedicated variable, not `GITHUB_SHA`, because CI sets that for the local tests; reasoned and tested): stamped site + right commit passes; stamped site + wrong commit fails; **unstamped site + right commit fails**; unstamped site without the variable passes (old behaviour); stamped site without the variable fails. The 13 pipeline and stamp cases also pass with `GITHUB_SHA` set like CI does. |
| Dry run on a branch with the manual Run workflow button | **not tested** | needs a real GitHub Actions run |
| After merging, watch the first run on `main`; Verify passes with the stamped value | **not tested** | post-merge; see live smoke checks |
| Update `CONTRIBUTING.md` and the PR template so nobody bumps `?v=` by hand | **not done** (minor) | not in the commit. `CONTRIBUTING.md:70` still describes the old check ("same versioned CSS and JS"). The Designer's spec still says "bump the `?v=`". |
| Risk: build-step change; keep to one commit so it can be reverted | pass | one commit, 4 files |

**Conditions for the merge:** (1) update the two docs (minor) or the owner accepts it; (2) run the manual dry run and **watch the first run on `main`**; if Verify fails there, revert the merge as `CONTRIBUTING.md` describes; (3) the "docs is not excluded" bug (B-10) is fixed before any branch with `docs/` merges. None of the conditions is a blocker or major bug on this SHA.

#### Verification of `b4873c0`
| Claimed fix | How QA verified it (exact SHA, own port 4187, Chrome 157 emulation) | Result |
|---|---|---|
| B-01 menu on a landscape phone | 844x390 and 740x360: menu capped to the screen and scrollable (93px of travel); a **raw touch swipe** scrolls the menu to its end, the page behind stays at 0, Contact is on screen and a tap on it navigates; with the **real GSAP/Lenis**, the wheel over the open menu scrolls the menu and not the page (`data-lenis-prevent`) | pass |
| B-02 wheel scroll without GSAP | real CDN: GSAP blocked, ScrollTrigger blocked, Lenis blocked, all blocked: the wheel scrolls, no errors | pass |
| B-03 stub canonicals | all five stubs now point at the absolute site URL, no fragment | pass |
| B-04 honest guestbook message | no "Thank you", says nothing has been sent and the draft should have opened, the visitor's text is kept | pass; side effect **B-11** |
| B-07 sort chips | hidden with 0 reviews; with 2 stubbed reviews both sort chips pressed leave all 9 projects; phone and desktop | pass |
| B-10 / part of B-12 `_config.yml` | with `docs/` and `backend/` files present the server returns 404 for them | pass |
| Hardening in `js/script.js` (GitHub list escaping, cache shape check) | read only; no behavioural test added | reviewed, not tested |
| Regression | original suite 71 passed, 9 skipped (= Orchestra's); all QA matrix sizes (portrait phones 320-430, tablets, laptops, desktop), themes, keyboard, print, reduced motion, folder tests: unchanged; lint, HTML validation and asset check clean | pass |

Plain `main` with the same tests: 17 red in the default run and 3 more with real CDN, as planned (they go green once the fixes merge). Not touched by this branch and therefore still failing as expected: B-05 (9 cases), B-06 (3), B-08, B-09.

#### Verification of `bb08f34` (`fix/folders`: B-05, B-06, B-08, B-09)
Exact SHA, own port 4187, Chrome 157 emulation, QA overlay. The 8 position cases, close, icon, keyboard and the `[hidden]` audit all reported "expected to fail but passed", so their markers were removed.

| Area | What was checked | Result |
|---|---|---|
| Touch | tap each folder at 320, 390, 430, 760 (one column) and 761, 1280 (three columns): files directly under the tapped folder, above the next one; 14px gap on one column (folder ends y=754, panel starts 768, next folder 1415 at 390px), 22px under the row on three columns; screenshot checked | pass |
| Switching | folders 1,3,2,1,2 in turn: one `aria-expanded`, the right number of files, panel is the next sibling of the tapped folder in the DOM | pass |
| Keyboard | Enter opens and keeps focus on the folder; Tab reaches the first file; Shift+Tab returns; one Tab per file, then the next folder; Enter on the next folder switches; closing leaves nothing hidden in the Tab order | pass |
| Resize and rotation with a folder open | 1280 -> 390 -> 844x390 -> 390 -> 760 -> 761 -> 1280: stays open with its files, panel moves between "after the folder" (<= 760px) and "after the row", no sideways scroll; **focus inside the panel survives the panel moving**; a closed folder stays closed across resizes | pass |
| Themes | light and dark, reports folder open: folder name, file count, PDF title and subtitle, photo caption all >= 4.5:1; the "open" outline >= 3:1 against the page | pass |
| Print | with a folder open the proof section is dropped, no overflow; with a project filter on, print still shows all 9 projects (the print override still beats the new rule) | pass |
| Global `[hidden] { display: none !important }` | every use of `hidden` in HTML and JS was exercised in each state: tab panels (exactly the selected one shown, 4 tabs), lessons "Show all" button (phone: shown, hidden by a theme filter, back on All, gone once opened and stays gone; desktop: not shown), GitHub strip (shown with 2 stubbed repos, hidden when the API is down), guestbook sort chips (0, 1, 2 reviews), visit-counter card (shown with its number, hidden when the API fails), project filters (each filter shows exactly its cards, All shows 9), main sections still displayed | pass, **no regression**; the same tests pass on `b4873c0` except where a bug was fixed (visit card) |
| Regression | original suite 107 passed, 45 skipped (= Orchestra's); QA 137 passed, 0 failed; real CDN 17 passed; lint, HTML validation, asset check clean | pass |
| Do the new tests detect the old behaviour? | the same new specs on `b4873c0`: 18 red (the 13 old markers plus switching, keyboard, resize, closed-stays-closed and the visit-counter card) | yes |

Observation O-1 still stands: resizing with a folder open reflows the page and the tapped folder can end up off screen; normal reflow, not folder-specific. Not tested: a real phone, the live site.

#### Verification of `31602a9` (`feat/motion-p1`: motion spec `fad4d98`, items 1-3)
Exact SHA, own port 4187, Chrome 157 emulation, QA overlay. Written from the spec's acceptance criteria, not from the developer's tests (`tests/motion-p1.spec.js`, which is part of the original suite and passes). With every CDN blocked unless stated, which the spec says must behave identically.

| Criterion | What QA did | Result |
|---|---|---|
| **D1** card opaque with GSAP | real GSAP/Lenis/ScrollTrigger: card and every ancestor at opacity 1 while the mood buttons are on screen, at 320/430/760/1280 and scroll 0/60/120/200; the hero text still fades. (My own old hero test read the outer grid, which this change correctly stopped fading; updated.) | pass |
| **D1** layout | five real buttons in a group named "Set the demo mood", each 44x44 or more, on one row, inside the card, at 320/360/390/430/760/1280; the card's layout height is identical for all five moods at 320/430/760/1280 | pass |
| **D1** behaviour | Excited: label, one `aria-pressed`, still Excited after 4.2 s; another mood moves the mark; pressing again clears it and cycling resumes in under 4 s; six rapid presses end on the last mood; the hidden face click is gone; keyboard Enter and Space, focus stays, focus ring visible; touch tap on 390px; the hero canvas paints differently for Calm and Excited | pass |
| **D1** reduced motion | Calm shows "Calm" and exactly 66 bpm at once; two canvas captures 500 ms apart identical; every mood sets label, heart rate and pressed state at once; the canvas redraws whenever link distance or tint changes (Neutral and Happy share both, so they paint alike by design) | pass |
| **D1** themes, print | light and dark: idle outline >= 3:1 against the card, pressed fill differs, label >= 4.5:1; print hides the mood buttons, heartbeat button and its status | pass |
| **D2** run | natural run (about 12 s) visits sensor, app, ml, app, supa, edge, claude in order (recorded from the DOM), ends on Claude API, no dot left, `#archInfo` live region "off" during and "polite" after, status says "Reading reached: Claude API", button enabled; pressing Next part on each arrival completes at 320, 430 and 760px by touch with no sideways scroll; the dot rests 12px wide on the top-centre edge of the stop, inside `#arch`, `pointer-events: none`, `aria-hidden` | pass |
| **D2** stopping | hover and keyboard focus and touch tap on a stop stop the run and that stop's text stays 3 s; Escape stops and focus stays on the button; scrolling the explorer off screen stops it; **tab switch is simulated** (headless Chromium keeps every tab visible): hidden then visible leaves no dot, an enabled button, and nothing restarts after 1.8 s; three synchronous presses never produce more than one dot | pass (tab switch: simulated) |
| **D2** layout, themes, reduced motion | the button never overlaps the fixed trophy at any scroll position at 320, 430, 760, 761 and 1280px; the dot has 3:1 against the explorer in both themes; reduced motion: no dot ever, each press moves exactly one stop through all seven, then starts again, nothing moves by itself | pass |
| **D3** filtering | every filter shows exactly its cards, All shows 9, the visually hidden status line (`role="status"`) says "N project(s) shown" with the right singular and plural; staying cards glide with offsets clamped to 120px and durations up to 420 ms, entering cards fade and scale from 0.96, leaving cards disappear at once, off-screen cards do not animate; touch tap works | pass |
| **D3** rapid chips | four chips within about 400 ms, four different orders: only the last chip pressed, the right cards, status correct, and 1.1 s later no running animation, no inline transform, no `tilt` class | pass |
| **D3** dialog | Details grows the dialog from that card (transform origin within 3.3px of the card centre, opacity starts below 0.9 and ends at 1, no animation left), a lesson card keeps today's entrance, closing is instant and the override is cleared on the next tick, and focus returns to the same Details button after Escape and after the close button; touch tap works | pass |
| **D3** reduced motion, print | filtering creates no card animation and the count is still announced; the dialog opens with no new animation and no origin; print shows all 9 projects with a filter on | pass |
| Cross-cutting | no sideways scroll while cards travel, the mood changes and a heartbeat runs at 320, 390, 430, 761, 1024 and 1280px | pass |
| Regression | original suite 171 passed, 45 skipped (= Orchestra's); QA 199 passed; real CDN 21 passed; lint, HTML validation, asset check clean | pass |

**Flakiness.** The 62 D1-D3 cases ran 5 times in parallel (310/310) and the timing-sensitive subset (4 s hold, cycling resume, rapid presses and chips, hover, focus, Escape, scroll-off, tab switch, natural run, touch skip, dialog, reduced motion) 8 times on one worker (224/224). The first repeat found one intermittent failure (2 of 40 alone, 13 of 60 under load): my test read the dialog's leftover transform-origin before the `close` event cleared it (O-5); fixed in the test, no site change.

**Performance (spec "Performance check"): 4x CPU slowdown, 430px, about 11-13 s recordings, baseline `bb08f34` alternated with `31602a9`, two rounds each.** The PC was not idle (other sessions and Chrome windows existed) but the load was **4-14%** before every run, so these are recorded as measured, with that caveat. Chrome headless with the DevTools CPU throttle is an emulation, not a phone.

| Scenario (new effect vs baseline) | frames within 20 ms (base / new) | long tasks over 50 ms, count (longest ms), base / new | rAF per second (base / new) |
|---|---|---|---|
| Hero: five mood presses vs the idle hero | 99.5, 99.5 / 99.0, 99.1 | 2 (103), 2 (97) / 2 (102), 2 (94) | 412, 417 / 406, 407 |
| MEDS explorer: a heartbeat run vs idle | 98.4, 97.9 / 97.4, 97.1 | 2 (99), 2 (161) / 2 (100), 2 (117) | 253, 251 / 245, 237 |
| Projects: five filter presses (cards travel vs the old view transition) | 96.9, 97.5 / 97.9, 97.6 | 9 (118), 10 (130) / 3 (107), 2 (119) | 232, 236 / 256, 247 |
| Everything off screen (scrolled to the footer) | 96.1, 96.2 / 96.1, 96.3 | 2 (101), 2 (106) / 2 (99), 2 (99) | 239, 246 / 243, 244 |

Reading: at least 90% of frames were within 20 ms in all 16 runs (lowest 96.1%). The new code adds **no long tasks over the baseline** (the two in every run are the page's own work, present even with everything off screen), and fewer in the filter scenario. While off screen, rAF activity equals the baseline (about 240 per second, which includes the page's own loops and QA's frame counter), so none of the new effects runs while its section is off screen. **Verdict: pass.** Not measured: a real phone.

#### Code-level review of `f1b4103` (AWS backend; **nothing deployed, nothing run on AWS**)
| Requirement | Code-level result |
|---|---|
| R1-R3 create, validate, approve-first | read `validate.mjs`, `reviews.mjs`, `store.mjs`: whitelist of fields, server sets id, status and expiry, public read queries `approved` only and returns name/role/rating/comment/date; 50/50 tests pass |
| R4 owner-only moderation | `moderate.mjs` is not routed, ids must be uuids so the counter item cannot be touched; template has no function URL for it (by reading) |
| R5 visits | one atomic `ADD`; reading does not count |
| R6 abuse | Origin check, honeypot, 4 KB cap, 200-pending cap (`503`), throttling 2/s API-wide and 1/s on POST /reviews (in `template.yaml`) |
| R7 minimal data / logs | handlers log an event name and error class only; no IP, cookie or email stored |
| R8-R9 cost, contract | budget alerts at 50% and 100% in the template; `openapi.yaml` documents that a digit-string rating is accepted |
| CI | new `backend-tests` job runs `node --test` and `ci-passed` requires it (read from the workflow; **not run in Actions**) |

Findings (none blocks the code-level sign-off): **B-12** `backend/` is published unless excluded (major when merged alone). Hardening suggestions: (1) the list function's IAM allows `Query` on the whole status index, so a compromised function could read pending reviews; add `dynamodb:LeadingKeys: ["approved"]` on that statement, and similarly `["pending"]` for the create function's count query. (2) The 200-pending cap is check-then-put, so a burst can overshoot slightly; throttling bounds it. (3) R2 says wrong types give 400 but a digit string rating is accepted on purpose; the contract says so, the requirement wording should too.
**Not tested (needs a real AWS deployment):** deploy, IAM denial for the other functions, throttling, CORS in a browser, TTL deletion, budget alerts arriving, ADD under concurrency, cost, teardown, and the later site-to-API integration.

### Live-site smoke checks (after a merge to `main`)
Opening the live page in a browser adds one visit to the public counter, so do at most **one** browser session; the rest is HTTP only.
1. **Pipeline:** CI -> Build -> Deploy -> Verify all green for the merge commit; Verify output says "serving this commit".
2. `npm run verify:live` against the live URL passes (HTTP only, no counter): home page, title, every linked file, robots.txt, sitemap.xml, 404 page, developer paths hidden. **Also check `/docs/` returns 404.**
3. View source: the three asset links end with the merge commit's short ID, not `?v=6` / `?v=5`.
4. `robots.txt` and `sitemap.xml` load and name the canonical URL.
5. One real phone, one browser session (issue 5): the hero, menu (portrait and landscape), the three proof folders (**files under the tapped folder; closing hides them**), skills, projects filters, the guestbook (sort chips hidden with 0 reviews; Send tells the truth), Download CV, theme toggle.
6. One laptop: smooth scroll works; with the browser's "reduce motion" on, the page still scrolls normally.
7. Console shows no errors; no horizontal scroll at 360px.
8. Old URLs `about.html`, `academic.html`, `contact.html`, `qualities.html`, `works.html` still land on a section.
9. Paste the live URL into a link-preview checker (or a chat app): title, description and image appear.
10. Run Google's Mobile-Friendly / PageSpeed Insights on the live URL (needs the user; adds a visit).

## Not tested / limits
- Real devices (issue 5), Safari/WebKit and Firefox (a browser download needs the user's OK; listed, not done); screen readers; throttled network or CPU; real print-to-PDF page breaks; animation smoothness; pixel-level visual checks (screenshots only).
- Anything that needs a real GitHub Actions run or the live site.
- Colour contrast is checked on three text styles only.
- The Designer's six interactions: not built or not final, so **not tested**.
