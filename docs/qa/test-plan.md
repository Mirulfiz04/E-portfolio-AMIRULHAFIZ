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

Projects: `phone` (430px touch) and `desktop` (1280px) run the original specs; `qa` runs `tests/qa-*.spec.js`, which set their own size per test. The `qa-motion` specs need internet (they load GSAP/Lenis from the CDN) and skip themselves if it is unreachable. They never open the live site, so the public visit counter is not incremented.

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

### Animation (`qa-motion.spec.js`, real GSAP/ScrollTrigger/Lenis)
- **A1** libraries load (URLs and SRI hashes still valid) with no errors. **A2** mouse wheel scrolls. **A3** headings split into words and settle. **A4** folders pop in and end at opacity 1. **A5** hero drifts and comes back. **A6** menu link glides to its section. **A7** a dialog freezes page scroll and gives it back. **A8** no sideways scroll while animating. **A9** phone: touch scroll works, folders visible. **A10** reduced motion: no word-splitting, normal wheel scroll.
- **C1-C4** CDN partly down: all blocked / GSAP only blocked / ScrollTrigger only blocked / Lenis only blocked. Each must still scroll and show content (**C2 and C3 fail: B-02**).
- **M:** smoothness (no jank, no flicker when headings animate) on a real phone and an older laptop. Automation can only prove end states.

### Search on mobile (`qa-seo.spec.js`)
- **S1** `lang`, title (10-65 chars), description (50-170). **S2** viewport is `width=device-width` and zoom is not disabled. **S3** canonical is the absolute https URL and equals `og:url`. **S4** Open Graph title, description and absolute image. **S5** JSON-LD parses. **S6** no `noindex`. **S7** one visible h1, all images have alt. **S8** `robots.txt` allows crawling and names the sitemap; **S9** `sitemap.xml` lists the canonical page. **S10** all in-page links have a target, local links return < 400, `target=_blank` has `rel=noopener`; **S11** every image loads. **S12** redirect stubs have an absolute canonical (**fails: B-03**).
- **M:** after publishing, run Google's Mobile-Friendly / PageSpeed Insights on the live URL (needs the user; opening the live page also bumps the public visit counter).

### Guestbook (`qa-motion.spec.js`)
- **G1** submit must not claim success when only a mail draft opened (**fails: B-04**).

## Needs the user (not done, not automatable here)
1. **Real devices (issue 5):** at least one real iPhone (Safari) and one Android (Chrome), portrait and landscape: scrolling feel, address-bar resize, notch/safe areas, tap targets, tap-to-open folders, the menu, the print/CV button, form keyboard, pinch-zoom.
2. **Firefox and WebKit (Safari engine):** `npx playwright install firefox webkit` downloads a few hundred MB of browsers. Not run; needs the user's OK. After that, add `firefox` and `webkit` projects (3 lines in `playwright.config.js`). WebKit is the closest automated stand-in for iPhone Safari.
3. Live-site checks (Search Console, PageSpeed) as above.

## Baseline (current `main`, before any fixes)

| Suite | Result |
|---|---|
| Original specs, `phone` + `desktop` | 40 passed, 6 skipped (identical to the developer baseline) |
| New `qa` project | 101 passed, 3 skipped (the skips are "menu fits" on the 3 wide screens, which have no menu button) |
| of which expected failures (known bugs, reported by Playwright as passed) | 10: B-01 x2, B-02 x2, B-03 x5, B-04 x1 |
| `eslint .` | clean |

## Bugs found on `main`

| ID | Severity | Where | Steps | Expected | Actual |
|---|---|---|---|---|---|
| **B-01** | high on phones | `css/style.css` mobile `.nav` (breakpoint 1080px) | Phone held sideways (844x390, 740x360). Tap the menu button. | Every link reachable: menu fits or scrolls. | Menu is ~410px tall and runs to y=479 on a 390px screen; the header is sticky and the menu has `overflow: visible`, so the last links (Skills, Contact) are off-screen and cannot be reached. Suggested fix: `max-height: calc(100dvh - 68px); overflow-y: auto` on `.nav.open`. |
| **B-02** | medium | `js/motion.js` | Block `gsap.min.js` (corporate filter, ad blocker, CDN outage) but let Lenis load. Scroll with the mouse wheel. | Page scrolls. | Page does not scroll: Lenis is created but only ticks from `gsap.ticker`, which never starts. Same when only ScrollTrigger is missing. Fix: create Lenis only after the GSAP check, or drive it with its own `requestAnimationFrame` when GSAP is absent. |
| **B-03** | low (SEO) | `about/academic/contact/qualities/works.html` | View source. | Absolute canonical without a fragment, or a plain redirect. | `<link rel="canonical" href="index.html#about">`: relative and with a fragment, so search engines ignore it. |
| **B-04** | medium | `js/script.js` guestbook (`FORMSPREE_ID` is empty) | Fill the review form, press Send. | An honest message ("your email app should open, press send there"). | Shows "Thank you! I'll read it and put it up soon", unlocks the badge and fires confetti although only a `mailto:` draft opened; if the visitor has no mail app or closes it, the review is silently lost. |

Not bugs: the second `h1` is the hidden print-only CV header; `<img id="lbImg">` (lightbox) has no `src` until opened.

## Not tested / limits
- Real devices, Safari, Firefox (above); the live site; screen readers (NVDA/VoiceOver); slow-network and low-end-CPU throttling; touch-gesture details beyond tap and scroll.
- Colour contrast is checked on three text styles only, not every component.
- Visual correctness is only covered by attached screenshots, not pixel comparison (no approved reference images exist yet; worth adding once the design settles).

## Next round (after Developer E)
Re-run `npx playwright test`; for every fixed bug delete its `test.fail` line; add one test per new feature to the matching spec; refresh the screenshots and re-check the manual items.
