// Motion layer: Lenis smooth scroll + GSAP ScrollTrigger effects.
// Optional by design: if the CDN libraries fail to load, or the visitor prefers reduced motion,
// the site works exactly as before.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  if (reduce) return;
  const q = (s) => [...document.querySelectorAll(s)];

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    // let dialogs, the photo strip and the palette scroll on their own
    q("dialog, .moments, #palList").forEach((el) => el.setAttribute("data-lenis-prevent", ""));
    // pause page scrolling while any modal dialog is open
    new MutationObserver(() => (document.querySelector("dialog[open]") ? lenis.stop() : lenis.start()))
      .observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    // in-page links glide instead of jumping
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || a.getAttribute("href").length < 2) return;
      const t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      history.pushState(null, "", a.getAttribute("href"));
      lenis.scrollTo(t, { offset: -80 });
    });
  }

  /* ---------- Marquee speeds up with scroll velocity ---------- */
  const track = document.querySelector(".mq-track");
  if (track) {
    let v = 1;
    const tick = () => {
      const anim = track.getAnimations()[0];
      const target = 1 + Math.min(Math.abs(lenis ? lenis.velocity : 0) / 6, 6);
      v += (target - v) * 0.1;
      if (anim) anim.playbackRate = v;
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine) {
    q(".btn.primary, .hero .btn, #deskMode, .trophy").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
      });
      b.addEventListener("pointerleave", () => (b.style.translate = ""));
    });
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Section headings rise in word by word ---------- */
  q(".section h2").forEach((h) => {
    if (h.closest("dialog") || h.children.length) return; // skip headings with markup inside
    h.setAttribute("aria-label", h.textContent);
    h.innerHTML = h.textContent.split(" ").map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(" ");
    gsap.from(h.querySelectorAll(".w > span"), {
      yPercent: 110, rotate: 6, duration: 0.9, ease: "power4.out", stagger: 0.06,
      scrollTrigger: { trigger: h, start: "top 88%" }
    });
  });

  /* ---------- Hero drifts away as you scroll ---------- */
  const heroIn = document.querySelector(".hero-copy, .hero > div");
  if (heroIn) gsap.to(heroIn, { yPercent: -14, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Folders and stats pop in with a little bounce ---------- */
  gsap.from(".folder", { y: 60, rotate: (i) => [-6, 3, -3][i % 3], opacity: 0, duration: 0.9, ease: "back.out(1.6)", stagger: 0.12,
    scrollTrigger: { trigger: "#folders", start: "top 85%" } });
  gsap.from(".cs-stats li", { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.08,
    scrollTrigger: { trigger: ".cs-stats", start: "top 88%" } });

  /* ---------- Portrait parallax ---------- */
  if (document.querySelector("#about .photo")) gsap.fromTo("#about .photo", { y: 40 }, { y: -40, ease: "none", scrollTrigger: { trigger: "#about", scrub: true } });
})();
