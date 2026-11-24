There is no CV file here and none is needed.

The "Download CV" buttons (hero and contact section, `data-print-cv` in index.html)
call printCV() in js/script.js, which opens the browser's print dialog. The print
stylesheet at the bottom of css/style.css turns the page into a resume,
and the visitor chooses "Save as PDF".

To change what the CV contains, edit the sections marked data-cv in index.html and
the print rules in css/style.css. See issue #7 and docs/decisions/ for why it works this way.
