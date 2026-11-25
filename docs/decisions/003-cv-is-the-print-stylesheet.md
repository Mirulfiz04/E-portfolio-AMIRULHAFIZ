# Download CV prints the page instead of linking a PDF

- **Date:** 2026-11-22 (CV export, `fcfe36c`); fixed 2026-11-24 in #7
- **Status:** accepted

**Context.** A separate PDF would drift from the page and needs a file to upload.

**Decision.** The buttons call `printCV()`, which opens the print dialog; the print stylesheet in `css/style.css` makes the résumé and the visitor saves it as a PDF.

**Consequences.** One source of truth, no file to maintain. The result depends on the browser's print dialog. #7 was a bug where the terminal's `print()` helper overwrote `window.print`; a test now guards it. The old `assets/cv/README.txt` described a PDF link that never existed in the final design and was corrected on 2026-11-24.
