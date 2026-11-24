# Motion and interaction spec

For: Developer E (build) and QA (test). Base: `main` at `e322405`. Status: items 1-3 reviewed at `1438e0b`, changes requested; 4-6 not built.

Idea: **the site reacts as one connected thing.** Most pieces exist but do not talk to each other. Each item below connects two of them, around the work itself (MEDS, projects, skills).

| # | Interaction | Priority | Connects |
|---|---|---|---|
| 1 | Set the mood | P1 | MEDS widget + neural-network hero |
| 2 | Send a heartbeat | P1 | MEDS architecture explorer + its explanations |
| 3 | Cards that travel | P1 | Project filters + cards |
| 4 | Skill wires | P2 | Skill pills + projects behind them |
| 5 | Desk with weight | P2 | Photo desk + touch and keyboard |
| 6 | Badge flight | P3 | 14 badges + trophy |

Build in this order, one pull request each. Each is useful alone.

## Rules for all six

- **No new dependency.** CSS, Web Animations (`el.animate`), and the existing canvas. None needs GSAP or Lenis, so **with every CDN blocked all six behave exactly the same**. Put them in `js/script.js`, not `js/motion.js`.
- **Animate only `transform`, `translate`, `opacity`** (plus the existing canvas and SVG line strokes). Read layout once before animating, never per frame.
- **Loops stop** off screen and when `document.hidden`.
- **Reduced motion:** use the existing `reduceMotion` constant. The CSS rule only shortens CSS animations; it does not stop `el.animate` or canvas, so each JS effect checks it. Content and state changes still happen.
- **No information only in motion or colour.** Every effect also changes text or an ARIA state.
- **Controls** are real `<button type="button">`, at least 44 × 44 px, with the site's visible focus style.
- **Theme:** use tokens (`--text`, `--muted`, `--accent`, `--accent-2`, `--bg-2`, `--border`). Text at least 4.5:1, meaningful lines and borders at least 3:1, in both themes.
- **No sideways scroll** at 320, 390, 430, 761, 1024 and 1280 px, during effects too. Flying elements use a clipped layer, like `burst()`.
- **Print:** hide new controls and text in `@media print` unless they sit in an already hidden block.
- Easing: `--ease` = `cubic-bezier(0.22, 1, 0.36, 1)`; "spring" = `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- `css/style.css`, `js/script.js`: bump the `?v=` in `index.html` when changed.

---

## 1. Set the mood (P1)

**Where:** `.meds` widget and `#net` in the hero.
**Purpose:** show what MEDS does in five seconds, and make the hero respond to the visitor.
**Trigger:** five buttons under the face, one for each state in `states`, in a `role="group"` named "Set the demo mood". `aria-pressed` marks the choice. Keep the "simulated" label. Pressing the chosen one again returns to automatic cycling.

| Mood | Node speed | Link distance | Tint |
|---|---|---|---|
| Calm | 0.5× | 150 px | `--accent-2` |
| Neutral | 0.8× | 130 px | `--accent` |
| Happy | 1× | 130 px | `--accent` |
| Surprised | 1.5× | 120 px | `--accent-2` |
| Excited | 1.9× | 110 px | `--accent` |

**Timing:** speed and link distance ease to target over 800 ms. One ring expands from the centre of the canvas and pushes nodes at most 12 px, 600 ms, `--ease`. Face uses the existing `pop`. The existing `setInterval(next, 3200)` stops while a mood is chosen.
**Build note:** share one mood object between the `meds()` and `net()` functions. Cache the tint when mood or theme changes; today `draw()` calls `getComputedStyle` every frame. Multiply speed when moving nodes; do not change `vx`/`vy`.
**Phone/touch:** same buttons, on one row, 44 px each with 4 px gaps (236 px). Remove the hidden click on `#medsFace` (an `aria-hidden` element nobody can reach by keyboard).
**Keyboard:** Tab to each, Enter or Space to choose. No arrow keys.
**Reduced motion:** label, face, heart rate and pressed state change at once; the canvas redraws once in the tint. No ring, no movement. Heart rate must be set directly, because its ticker does not run in this mode.
**Scroll fade:** the existing hero fade in `js/motion.js` must target `.hero-copy` only. Its selector `.hero-copy, .hero > div` matches the outer `.hero-grid` first, which dims this card and makes the buttons look disabled.
**CDNs down:** identical.
**Files:** `index.html`, `css/style.css`, `js/script.js`, `js/motion.js`.

**Accept when:**
- With GSAP loaded, the card and all its ancestors have opacity 1 while the mood buttons are on screen, at 320, 430, 760 and 1280 px.
- At 320 px the card height is the same for all five moods.
- Choosing Excited sets `#medsEmotion` to "Excited", one button has `aria-pressed="true"`, and it is still "Excited" 4 s later.
- Pressing it again leaves no button pressed and cycling resumes within 4 s.
- Under reduced motion, choosing Calm shows "Calm" and 66 bpm, and two canvas captures 500 ms apart are identical.
- At 320 px the five buttons stay on one row inside the card.

---

## 2. Send a heartbeat (P1)

**Where:** `#p-arch` in the MEDS case study.
**Purpose:** today the six parts are read one by one. A travelling reading shows how they fit together.
**Trigger:** a `#sendBeat` button, "▶ Send a heartbeat", under the grid.
**Order:** sensor → app → ml → app → supa → edge → claude. This runs the data in story order; the existing `archText` is the only copy, so no new technical claims are made.
**Timing:** a 12 px dot moves between the top-centre edges of the parts (centred on the border, so it never rests on an icon or label), 550 ms per hop, `--ease`. On arrival the node gets `.on` and one 1 → 1.06 → 1 scale (300 ms), and `#archInfo` shows its text. Pause 1400 ms at each part. Text must stay readable, so the button becomes "Next part →" on arrival to skip the pause, and "↻ Send again" at the end. About 13 s untouched.
**Announcements:** the live region would queue seven long texts. During a run set `#archInfo` `aria-live="off"` and announce only "Reading reached: Flutter app" in a visually hidden `role="status"`. Restore `polite` after.
**Stop:** hover, focus or press on any node, change tab, scroll off screen, or hide the document: cancel the run, remove the dot, restore the button and live region. Use one run token; a stale run must do nothing. The button itself must not count as a node.
**Phone/touch:** same; the grid is two columns, so measure the stops at the start of each hop. At 760 px and below the button is right-aligned, clear of the fixed trophy at bottom-left. Dot is inside `#arch` (already `position: relative`), `pointer-events: none`.
**Keyboard:** Enter or Space starts and advances; focus stays on the button. Escape stops.
**Reduced motion:** no dot, no timer. The first press shows the sensor, each later press moves one part, and the button reads "Next part →" until the end.
**CDNs down:** identical.
**Files:** `index.html`, `css/style.css`, `js/script.js`.

**Accept when:**
- A run visits the seven stops in order, ends on `claude`, and leaves no dot in the DOM.
- Hovering or focusing a node mid-run stops it, and that node's text stays for 3 s.
- Switching tab mid-run and back shows no dot and an enabled button.
- Two fast presses never run two dots.
- At 320, 430 and 760 px the button never overlaps `#trophy` at any scroll position.
- Under reduced motion each press moves exactly one stop.
- `#archInfo` is `aria-live="polite"` after any end or stop.

---

## 3. Cards that travel (P1)

**Where:** `#projectList`, its filter chips, and the Details dialog.
**Purpose:** filtering now cross-fades the whole page. Cards that glide show which ones stayed.
**Trigger:** a project filter chip.
**Timing:** staying cards move to their new place in 420 ms, `--ease`, 25 ms stagger, 150 ms at most. Entering cards fade and scale 0.96 → 1 in 260 ms. Leaving cards go at once.
**Build note:** FLIP, not View Transitions: measure visible cards, change `hidden`, measure again, animate the difference with `el.animate`. Before measuring, cancel running card animations and remove `.tilt`. WAAPI overrides the card's CSS transform while it plays; that is fine. Do not call `vt()` here.
**Fix first (bug):** the handler binds `$$(".filters .chip")`, which also matches the guestbook's sort chips. Their `data-filter` is undefined, so sorting reviews hides **every project**. Scope it to `.proj-head .chip`, both for binding and for `aria-pressed`. (Hidden until there are two reviews, so it may not be visible yet.)
**Status:** a visually hidden `role="status"` reads "3 projects shown".
**Details:** the dialog enters from the pressed card: `transform-origin` at the card's centre, scale 0.94 → 1 and opacity, 280 ms, `--ease`. Opened any other way (palette, terminal, lesson), it keeps today's entrance. Closing stays instant.
**Phone/touch:** one column, so cards travel far. Clamp each offset to 120 px. Cards off screen before and after do not animate.
**Keyboard:** chips as today; focus stays on the chip. The dialog returns focus to Details on close (native).
**Reduced motion:** instant filter and dialog, status still announced.
**CDNs down:** identical.
**Files:** `index.html`, `css/style.css`, `js/script.js`.

**Accept when:**
- Each filter shows exactly the cards whose `data-cats` contains it; All shows 9.
- Four chips pressed within 500 ms end on the last filter, and 1 s later no card has a running animation or inline transform.
- With two test reviews, pressing both sort chips leaves all 9 projects visible. (Fails today.)
- Focus returns to the same Details button after Escape.
- Print shows all projects with any filter active.

---

## 4. Skill wires (P2)

**Where:** `#skillInfo`.
**Purpose:** "Flutter shows up in 2 projects" is a sentence; make the connection visible.
**Trigger:** the existing skill press, and Surprise me.
**Design:** the project links in the sentence become small chips beside the skill icon. An SVG line joins icon to each chip.
**Timing:** line draws by `stroke-dashoffset`, 400 ms, `--ease`, 80 ms stagger; its chip then scales 0.9 → 1 over 200 ms, spring. Links are usable from the first frame. Existing sparkle stays.
**Colour:** lines use `var(--muted)`, 2 px; the group colour only on a 6 px end dot beside the text, since group colours are not checked for contrast in both themes.
**Layout:** desktop, icon left and chips stacked right. Redraw lines on resize without animating. SVG is `aria-hidden`, clipped to the card, `pointer-events: none`.
**Phone/touch:** below 480 px chips stack under the icon with one vertical line instead of wires.
**Keyboard:** pills as today. Chips stay links in DOM order.
**Reduced motion:** finished lines and chips at once.
**CDNs down:** identical.
**Files:** `css/style.css`, `js/script.js`. Print already hides `.skill-info`.

**Accept when:**
- The text still matches `Flutter shows up in \d+ projects?` (existing test) and the number of chips equals it.
- Number of lines equals number of chips on desktop; a skill with no project shows the existing message and no line.
- Three skills in 500 ms leave only the last skill's chips and lines.
- At 320 px no chip or line leaves the card; resizing 1280 → 320 → 1280 keeps lines attached.
- Each chip opens its project by click and by Enter.

---

## 5. Desk with weight (P2)

**Where:** Moments, desk mode (`.moments.desk`).
**Purpose:** photos stop dead on release and cannot be moved by keyboard. Give them weight and give everyone the same play.
**Trigger:** drag and release; a new "Tidy up" button beside the mode button, shown only in desk mode.
**Timing:** on release, glide on the last 80 ms of pointer speed, capped at 1.2 px/ms, friction 0.92 per 16.7 ms (scale by real frame time), stop below 0.02 px/ms. At an edge reverse at 40%. Pick up: the existing 1.06 scale. Tidy up: to the starting grid without jitter, 500 ms, spring, 20 ms stagger.
**Build note:** set position as `left`/`top` once, on entering the mode; move with the separate `translate` property, so the tilt in `transform` is untouched. Keep x and y in JS. Clamp in one function used by drag, glide and keys: photos stay fully inside, matching `overflow: hidden`. Recalculate on resize. Handle `pointercancel` like release without a glide; today only `pointerup` ends a drag. Keep the "drag does not open the photo" guard, but reset it on the next pointerdown.
**Phone/touch:** the desk fills 480 px and photos use `touch-action: none`, so a visitor can be trapped. Leave a 32 px clear strip on both sides (inside the desk) with normal scrolling, and no photo placed there.
**Keyboard:** with a photo focused, arrows move 24 px (Shift: 72 px) and `preventDefault`; Enter opens it as today. A short hint is linked with `aria-describedby` in desk mode only. Focus raises the photo.
**Reduced motion:** dragging follows the pointer; no glide, bounce, or animated tidy.
**CDNs down:** identical. With Lenis, the strip already has `data-lenis-prevent`.
**Files:** `index.html`, `css/style.css`, `js/script.js`.

**Accept when:**
- A fast flick moves a photo further after release and ends fully inside the desk; under reduced motion it moves 0 px after release.
- A drag over 5 px does not open the lightbox; the next plain tap does.
- ArrowRight moves the focused photo 24 px and the page does not scroll; Enter opens it.
- On the phone project, swiping up in the side strip scrolls the page.
- Tidy up, then leaving desk mode, leaves no inline position or translate on any photo.

---

## 6. Badge flight (P3)

**Where:** `unlock()` and `#trophy`.
**Purpose:** a toast hides what was earned and where it goes. Show it, and suggest one next thing.
**Trigger:** a badge unlocked for the first time.
**Timing:** the badge's emoji flies from the last pressed element (screen centre if none) to the trophy, 700 ms, `--ease`, scale 1.6 → 0.6, then the existing `bump`. Progress ring around the trophy grows over 400 ms.
**Build note:** record the last `pointerdown` position; discard it if older than 1 s. The flyer is `position: fixed`, `pointer-events: none`, `aria-hidden`, removed on finish and on cancel, never more than one (later unlocks skip the flight). If a modal dialog is open it covers the page, so skip the flight and keep the toast. Emoji are the site's own existing ones.
**Next hint:** in the Achievements dialog, the first locked badge is marked "Try next" and the count is in the heading. No new badges.
**Accessible name:** today `aria-label="Achievements"` hides the visible count. Make it "Achievements, 3 of 14" and update it.
**Phone/touch:** same.
**Keyboard:** starts from the focused element when the unlock followed a key press.
**Reduced motion:** no flight; ring and count change at once, toast as today.
**CDNs down:** identical. **Storage blocked:** works for the visit.
**Files:** `index.html`, `css/style.css`, `js/script.js`.

**Accept when:**
- Opening a proof folder for the first time creates one flyer, gone within 1.5 s; repeating the action creates none.
- Unlocking inside a dialog creates no flyer and still shows the toast.
- The accessible name always matches `#trophyCount`.
- "Try next" is on exactly one badge, and on none at 14/14. Reset returns to 0 of 14.

---

## Performance check (items 1, 2, 3, 5)

Chrome, 4× CPU slowdown, 430 px, 10 s recording: no long task over 50 ms caused by the effect, and at least 90% of frames within 20 ms. Nothing from these effects runs while its section is off screen.

## Design review of items 1-3 at `1438e0b`

Chrome, real GSAP and Lenis, 320, 430 and 1280 px, dark and light. No script errors, no sideways scroll.

| Check | Dark | Light | Need |
|---|---|---|---|
| Mood border on card | 7.37 | 6.29 | 3 |
| Pressed mood fill on card | 9.72 | 4.17 | 3 |
| Pressed against unpressed fill | 8.93 | 3.89 | 3 |
| Dot on panel / node / active node | 9.47 / 8.63 / 7.66 | 3.66 / 3.40 / 3.17 | 3 |
| Active node text | 12.46 | 13.46 | 4.5 |

Ratios come from computed solid backgrounds; the cursor spotlight and blur were not included. Item 3 accepted. Changes requested for 1 and 2 are written into those items above.

## Before this branch merges

`docs/` is not in the `exclude` list in `_config.yml`, so **merging would publish this file on the live site**. Add `- docs` to that list in the same pull request; it is outside the Designer's folder.

## Decisions for the owner

1. All six, or only the P1 set? **Recommended: the three P1 items first.**
2. Hero tints: existing two accents only (**recommended**, safe in both themes) or a new colour per mood?


Left out on purpose: sound, vibration, custom cursor, more particles, scroll hijacking, new badges.
