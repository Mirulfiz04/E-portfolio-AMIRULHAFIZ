// Amirul Hafiz — portfolio interactions. No dependencies.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");
$("#year").textContent = new Date().getFullYear();

/* ---------- Data ---------- */
const projects = [
  {
    id: "meds",
    title: "MEDS: Multimodal Emotion Detection System",
    cats: ["ai", "mobile"],
    featured: true,
    emoji: "🧠💓",
    award: "Paper @ ISIRA 2026",
    blurb: "Final-year project. Reads emotion from face, heart rate and voice, with a hardened Supabase backend and a CI/CD pipeline that tests and ships every change.",
    points: [
      "Flutter app with an on-device TFLite face-emotion model (MobileNet transfer learning) and a voice-emotion model for an “Are you OK?” check-in.",
      "ESP32 + MAX30102 sends heart rate and SpO₂; late fusion uses HR change as an arousal signal, with smoothing and hysteresis.",
      "Supabase backend: Auth, Postgres with Row Level Security, and Edge Functions for Claude-powered session summaries and email export, with per-user rate limits.",
      "GitHub Actions CI/CD: Flutter tests, Python self-checks and Deno type checks on every PR; release APK and Edge Function deploy on merge.",
      "Design paper presented at ISIRA 2026."
    ],
    learned: [
      "Security lives on the server: RLS and triggers, not checks in the app.",
      "Honest evaluation: I found ~75% train/test overlap in my dataset and fixed it.",
      "CI/CD turns every merge into a tested, shippable release."
    ],
    tags: ["Flutter", "TensorFlow Lite", "Supabase", "PostgreSQL", "GitHub Actions", "ESP32", "Claude API"],
    links: [
      { label: "Read the case study", href: "#meds" },
      { label: "GitHub", href: "https://github.com/Mirulfiz04/MEDS" }
    ]
  },
  {
    id: "ipetro",
    title: "iPetro Visual Inspection Report System",
    cats: ["web"],
    img: "assets/project1.jpg",
    award: "🥇 Gold + Best Project",
    blurb: "Full-stack web system for visual inspection reports: upload and annotate photos, build the report, then submit it for approval. I led the team.",
    points: [
      "Team leader and full-stack developer: planned the work, split tasks and integrated the codebase.",
      "Laravel back end with an Inertia + React + TypeScript front end, shadcn/ui components and Tailwind CSS.",
      "Photo upload with an in-browser image editor for marking findings on inspection photos.",
      "Report workflow with roles: reports are submitted, then approved. Reports export to PDF.",
      "Chart.js dashboard and two-factor authentication with Laravel Fortify.",
      "Won the Gold Award and the Best Project Award at the Workshop II Innovation Competition."
    ],
    learned: [
      "Leading a team means unblocking people: clear task splits and early integration.",
      "Designing a real approval workflow with roles and states.",
      "Type-safe React with TypeScript on a Laravel back end."
    ],
    tags: ["Laravel", "React", "TypeScript", "Inertia", "Tailwind", "Chart.js"],
    links: [{ label: "GitHub", href: "https://github.com/Mirulfiz04/WORKSHOP2_IPETRO-VISUAL-INSPECTION" }]
  },
  {
    id: "suptulang",
    title: "Sup Tulang ZZ: QR Table Ordering",
    cats: ["web"],
    img: "assets/project-suptulang.jpg",
    blurb: "Restaurant ordering system: customers scan the QR code on their table, order and track it, while the kitchen and staff manage orders.",
    points: [
      "Customer flow: menu with search and categories, add-ons, cart, checkout with 6% SST, payment (online banking or e-wallet) and live order tracking.",
      "Kitchen display and staff dashboard behind a staff login, with order status and mark-as-paid.",
      "PHP REST API over MySQL; order confirmation emails sent with PHPMailer.",
      "A Python script generates a printable QR code for every table."
    ],
    learned: [
      "Designing one system for three kinds of user: customers, kitchen and staff.",
      "Building a small REST API by hand and keeping the front end separate from it."
    ],
    tags: ["PHP", "MySQL", "JavaScript", "REST API", "Python"],
    links: [{ label: "GitHub", href: "https://github.com/Mirulfiz04/group16projectwad" }]
  },
  {
    id: "nanadash",
    title: "NanaDash (SULAM project)",
    cats: ["mobile"],
    img: "assets/project2.jpg",
    blurb: "Community-service (SULAM) mobile app for a local business, covering ordering, announcements, delivery and product listings.",
    points: [
      "Flutter app with ordering, announcement, delivery and product modules.",
      "Backed by an API and a MySQL database with user sign-in.",
      "Delivered as a Software Project Management course project."
    ],
    learned: [
      "Building for a real, non-technical client.",
      "Planning scope and schedule, and delivering on a deadline."
    ],
    tags: ["Flutter", "Dart", "API", "MySQL"],
    links: [
      { label: "Demo video", href: "https://www.youtube.com/watch?v=Zkb5oBkfVlA" },
      { label: "GitHub", href: "https://github.com/Mirulfiz04/SULAM-PROJECT-NANADASH" },
      { label: "Project site", href: "https://sites.google.com/view/nanadash/home" }
    ]
  },
  {
    id: "clinic",
    title: "Clinic Management System",
    cats: ["design"],
    emoji: "🏥",
    blurb: "Distributed-applications project: Java Swing desktop clients for patients and doctors, talking to a REST server over HTTP.",
    points: [
      "REST server on Java’s built-in HttpServer, with CORS and endpoints for patients, doctors, treatments, records and appointments (book, reschedule, status).",
      "Separate Swing screens for login, registration, patients and doctors.",
      "MySQL database plus a JSON data layer."
    ],
    learned: [
      "How client–server systems talk: HTTP, JSON and API design without a framework.",
      "Keeping clients thin and putting the rules on the server."
    ],
    tags: ["Java", "Swing", "REST", "MySQL", "JSON"],
    links: [
      { label: "Video demo", href: "https://www.youtube.com/watch?v=BMUybOm3Q04" },
      { label: "GitHub", href: "https://github.com/Mirulfiz04/Project-DAD" }
    ]
  },
  {
    id: "sims",
    title: "SIMS: Smart Inventory Management System",
    cats: ["design"],
    emoji: "📦",
    blurb: "Software Requirement & Design project: the full specification and design of an inventory system for small and medium retail businesses.",
    points: [
      "Problem: manual stock tracking causes errors, stockouts and overstocking.",
      "Functional requirements: authentication, real-time tracking by barcode or RFID, low-stock alerts, automatic purchase orders and a sales analytics dashboard.",
      "Non-functional requirements: 50+ concurrent users, AES-256 encryption, role-based access control and 99% uptime.",
      "Use case model with 5 actors (store manager, warehouse staff, supplier, business owner, IT) and 6 use cases."
    ],
    learned: [
      "Writing requirements that are specific and testable, not vague wishes.",
      "Modelling who does what before writing any code."
    ],
    tags: ["Requirements (SRS)", "Design (SDD)", "UML", "Use cases"],
    links: [{ label: "Video presentation", href: "https://www.youtube.com/watch?v=9HVk7uUiCfg" }]
  },
  {
    id: "network",
    title: "Enterprise Network Design",
    cats: ["design"],
    emoji: "🌐",
    blurb: "Data Communication & Networking project: a secure, scalable network for a company headquarters and two branches, built and tested in Cisco Packet Tracer.",
    points: [
      "Multi-floor headquarters (technical, management, server farm, sales) and two branch offices linked over a WAN.",
      "VLSM subnetting for efficient IP allocation with room to grow.",
      "Wired and wireless access, router and switch configuration, and network segmentation for security and performance.",
      "Connectivity tested end to end."
    ],
    learned: [
      "How the network under every app is actually put together.",
      "Planning addressing up front saves pain later."
    ],
    tags: ["Cisco Packet Tracer", "VLSM", "Routing", "Wireless", "Segmentation"],
    links: [{ label: "Video presentation", href: "https://www.youtube.com/watch?v=mCOF6I-53U4" }]
  },
  {
    id: "farmintel",
    title: "FarmIntel: Fruit & Vegetable Disease Detector",
    cats: ["ai"],
    img: "assets/project3.jpg",
    blurb: "Image classifier that tells healthy produce from diseased produce, from a photo or a live camera feed.",
    points: [
      "Model trained with Teachable Machine and exported to Keras.",
      "Tkinter desktop GUI with camera input and a history of past predictions."
    ],
    learned: [
      "A model is only half the product: it needs a usable interface around it.",
      "Training data quality matters more than the model."
    ],
    tags: ["Python", "Keras", "Tkinter"],
    links: [
      { label: "GitHub", href: "https://github.com/Mirulfiz04/Fruit-and-Vegetable-Disease-AI-Project" },
      { label: "Report (PDF)", href: "assets/reports/FarmIntel-Fruit & Vegetable Disease Detector Group 28.pdf" }
    ]
  },
  {
    id: "events",
    title: "Event Management System",
    cats: ["web"],
    img: "assets/project4.png",
    blurb: "Workshop I project: an event management program taken from requirements analysis to a working build with database storage.",
    points: [
      "Requirements analysis through to a working program.",
      "Saves event data to a database."
    ],
    learned: ["Going from a written specification to working software, end to end."],
    tags: ["Python", "C++", "Database"],
    links: [
      { label: "GitHub", href: "https://github.com/Mirulfiz04/Event-Management-System-workshop1" },
      { label: "Report (PDF)", href: "assets/reports/Final Report AMIRUL HAFIZ BIN ANUAR B032310657.pdf" }
    ]
  }
];

/* ---------- Toast ---------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

/* ---------- Theme ---------- */
const sysLight = matchMedia("(prefers-color-scheme: light)");
const currentTheme = () => root.dataset.theme || (sysLight.matches ? "light" : "dark");
function setTheme(t) {
  root.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch (e) {}
  $('meta[name="theme-color"]').content = t === "light" ? "#f6f7fb" : "#0b0d12";
}
function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  const swap = () => setTheme(next);
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(swap);
  else swap();
  toast(next === "light" ? "☀️ Light mode" : "🌙 Dark mode");
  return next;
}
$("#themeBtn").addEventListener("click", toggleTheme);

/* ---------- Scroll: progress bar, header border, active nav ---------- */
const bar = $("#progress"), topbar = $(".topbar");
function onScroll() {
  const max = root.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  topbar.classList.toggle("scrolled", scrollY > 8);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const navLinks = $$(".nav a");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => {
      const on = a.hash === "#" + e.target.id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => sectionObserver.observe(s));

/* ---------- Reveal on scroll (staggered per parent) ---------- */
function observeReveals(els) {
  els.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 5) * 0.07}s`);
    revealObserver.observe(el);
  });
}
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12 });

/* ---------- Card spotlight (follows the cursor) ---------- */
document.addEventListener("pointermove", (e) => {
  const card = e.target.closest?.(".card");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${e.clientX - r.left}px`);
  card.style.setProperty("--my", `${e.clientY - r.top}px`);
}, { passive: true });

/* ---------- Typewriter ---------- */
const roles = ["full-stack web apps", "Flutter mobile apps", "emotion-aware AI", "IoT gadgets", "things people enjoy using"];
const typeEl = $("#type");
if (!reduceMotion) {
  let ri = 0, ci = roles[0].length, deleting = false;
  (function tick() {
    if (!deleting && ci === roles[ri].length) { deleting = true; return setTimeout(tick, 1800); }
    if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; return setTimeout(tick, 300); }
    ci += deleting ? -1 : 1;
    typeEl.textContent = roles[ri].slice(0, ci);
    setTimeout(tick, deleting ? 35 : 70);
  })();
}

/* ---------- Counters ---------- */
function countUp(el) {
  const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1200;
  (function step(t) {
    const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (end * eased).toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
if (!reduceMotion) $$("[data-count]").forEach(countUp);

/* ---------- Hero: interactive "neural net" background ---------- */
(function net() {
  const cv = $("#net"), ctx = cv.getContext("2d");
  let w, h, dpr, nodes = [], mouse = { x: -999, y: -999 }, running = true;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (w * h) / 16000));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 }));
  }
  function draw() {
    const accent = getComputedStyle(root).getPropertyValue("--accent").trim();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ctx.strokeStyle = accent;
    for (const a of nodes) {
      if (!reduceMotion) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
        if (d < 160) { a.x -= dx * 0.012; a.y -= dy * 0.012; } // nodes shy away from the cursor
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) { ctx.globalAlpha = (1 - d / 130) * 0.35; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      ctx.globalAlpha = md < 160 ? 0.9 : 0.5;
      ctx.beginPath(); ctx.arc(a.x, a.y, md < 160 ? 2.6 : 1.6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (running && !reduceMotion) requestAnimationFrame(draw);
  }
  const hero = $(".hero");
  hero.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
  addEventListener("resize", () => { size(); if (reduceMotion) draw(); });
  // pause when the hero is off screen
  new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was && !reduceMotion) draw(); }).observe(hero);
  sysLight.addEventListener("change", () => reduceMotion && draw());
  size(); draw();
  $("#themeBtn").addEventListener("click", () => reduceMotion && setTimeout(draw, 50));
})();

/* ---------- Hero: MEDS widget (simulated) ---------- */
(function meds() {
  const card = $(".meds"), face = $("#medsFace"), emo = $("#medsEmotion"), conf = $("#medsConf"), hr = $("#medsHr"), spo2 = $("#medsSpo2"), ecg = $("#ecg");
  const states = [["🙂", "Happy", 78], ["😐", "Neutral", 72], ["😮", "Surprised", 91], ["😌", "Calm", 66], ["😄", "Excited", 96]];
  let si = 0, bpm = 78, pts = Array(60).fill(15), phase = 0;
  function ecgStep() {
    phase = (phase + 1) % 20;
    const y = phase === 8 ? 2 : phase === 9 ? 27 : phase === 10 ? 11 : 15 + (Math.random() - 0.5) * 2;
    pts.push(y); pts.shift();
    ecg.setAttribute("points", pts.map((v, i) => `${i * 2},${v}`).join(" "));
  }
  for (let i = 0; i < 60; i++) ecgStep();
  function next() {
    si = (si + 1) % states.length;
    const [f, name, target] = states[si];
    face.textContent = f; emo.textContent = name;
    conf.textContent = `${84 + Math.floor(Math.random() * 14)}%`;
    bpm = target;
    face.classList.remove("pop"); void face.offsetWidth; face.classList.add("pop");
  }
  if (!reduceMotion) {
    setInterval(ecgStep, 60);
    setInterval(() => { hr.textContent = bpm + Math.round((Math.random() - 0.5) * 4); spo2.textContent = 97 + Math.round(Math.random() * 2); }, 900);
  }
  setInterval(next, 3200);
  face.addEventListener("click", next); // tiny extra: click the face to change it
  // 3D tilt following the cursor
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", `${x * 14}deg`); card.style.setProperty("--rx", `${-y * 14}deg`);
    });
    card.addEventListener("pointerleave", () => { card.style.removeProperty("--ry"); card.style.removeProperty("--rx"); });
  }
})();

/* ---------- Projects ---------- */
const list = $("#projectList");
const cover = (p) => `<div class="p-cover">${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : `<span class="emoji" aria-hidden="true">${p.emoji}</span>`}${p.award ? `<span class="p-award">${p.award}</span>` : ""}</div>`;
list.innerHTML = projects.map((p) => `
  <article class="card p-card reveal${p.featured ? " featured" : ""}" data-cats="${p.cats.join(" ")}">
    ${cover(p)}
    <div class="p-body">
      <h3>${p.title}</h3>
      <p>${p.blurb}</p>
      <ul class="tags">${p.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
      <button class="p-more" type="button" data-open-project="${p.id}" aria-haspopup="dialog" aria-label="Details: ${p.title}">Details <span aria-hidden="true">→</span></button>
    </div>
  </article>`).join("");
observeReveals($$(".reveal"));

$$(".filters .chip").forEach((chip) => chip.addEventListener("click", () => {
  $$(".filters .chip").forEach((c) => c.setAttribute("aria-pressed", c === chip));
  const f = chip.dataset.filter;
  const apply = () => $$(".p-card").forEach((card) => { card.hidden = f !== "all" && !card.dataset.cats.includes(f); card.classList.add("in"); });
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply); else apply();
}));

const modal = $("#projectModal");
function openProject(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return false;
  $("#mBody").innerHTML = `${cover(p)}
    <div class="m-body">
      <h2 id="mTitle">${p.title}</h2>
      <p class="muted">${p.blurb}</p>
      <ul class="points">${p.points.map((x) => `<li>${x}</li>`).join("")}</ul>
      ${p.learned ? `<div class="m-learned"><h3>💡 What I learned</h3><ul>${p.learned.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : ""}
      <ul class="tags">${p.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
      <div class="m-links">${p.links.map((l) => l.href.startsWith("#")
        ? `<a class="btn primary" href="${l.href}" data-close-modal>${l.label} →</a>`
        : `<a class="btn" href="${encodeURI(l.href)}" target="_blank" rel="noopener">${l.label} ↗</a>`).join("")}</div>
    </div>`;
  $$("dialog[open]").forEach((d) => d.close());
  modal.showModal();
  unlock("project");
  return true;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-open-project]");
  if (t) { e.preventDefault(); openProject(t.dataset.openProject); }
});
modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close-modal]")) modal.close(); }); // backdrop or in-page link closes it

/* ---------- Copy email ---------- */
$("#copyEmail").addEventListener("click", async (e) => {
  try { await navigator.clipboard.writeText(e.currentTarget.dataset.email); toast("📋 Email copied"); }
  catch { toast("Couldn’t copy. Email: amirul.hafiz73@gmail.com"); }
});

/* ---------- Confetti (easter eggs) ---------- */
function confetti() {
  if (reduceMotion) { toast("🎉 You found it!"); return; }
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ["#00d4a8", "#7c8cff", "#ffb547", "#ff5f8a", "#ffffff"];
  const bits = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -14 - 4, s: Math.random() * 6 + 4, r: Math.random() * 6, c: colors[(Math.random() * colors.length) | 0] }));
  let frame = 0;
  (function step() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    bits.forEach((b) => { b.vy += 0.35; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += 0.1; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore(); });
    if (++frame < 180) requestAnimationFrame(step); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}
const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let kIdx = 0;
document.addEventListener("keydown", (e) => {
  kIdx = e.key === konami[kIdx] ? kIdx + 1 : (e.key === konami[0] ? 1 : 0);
  if (kIdx === konami.length) { kIdx = 0; confetti(); toast("🎮 Konami code! +30 lives"); }
});

/* ---------- Terminal mode ---------- */
const term = $("#term"), out = $("#termOut"), input = $("#termInput");
const hist = []; let hIdx = 0;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function print(html, cls = "") { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; out.append(d); out.scrollTop = out.scrollHeight; }
const cmds = {
  help: () => `Commands:
  <span class="c">whoami</span>       short intro
  <span class="c">experience</span>   work history
  <span class="c">projects</span>     list projects  ·  <span class="c">open &lt;id&gt;</span> for details
  <span class="c">skills</span>       tech stack
  <span class="c">education</span>    degrees and results
  <span class="c">contact</span>      how to reach me
  <span class="c">github</span>       latest repos (live)
  <span class="c">cv</span>           save my CV as PDF
  <span class="c">hello</span>        say hi in 4 languages
  <span class="c">theme</span>        toggle light/dark
  <span class="c">clear</span>        clear the screen
  <span class="c">exit</span>         back to the normal site`,
  whoami: () => `Amirul Hafiz. Final-year BCS (Software Development) @ UTeM, CGPA 3.62, Dean’s List Sem 1–5.
Software Engineer Intern @ AirDroiTech (Sep 2026 – present).
Speaks English, Malay, Japanese and Mandarin (the last two at intermediate level).`,
  experience: () => `<span class="c">2026-09 → now</span>   Software Engineer Intern, AirDroiTech
<span class="c">2026-05 → 07</span>    Student Research Assistant, UTeM
                  micro:bit / IoT / HuskyLens workshops (Cabaran Inspirasi Inovasi Pintar 2026,
                  with onsemi and PPD Port Dickson). Mentored 2 teams, both state-level Top 3.`,
  projects: () => projects.map((p) => `<span class="c">${p.id.padEnd(10)}</span> ${p.title}`).join("\n") + `\n<span class="d">Try: open meds</span>`,
  open: (arg) => openProject(arg) ? `Opening ${arg}…` : `open: no project “${esc(arg || "")}”. Run <span class="c">projects</span> to list IDs.`,
  skills: () => `languages  Java · Python · TypeScript · Dart · PHP · SQL
web/mobile React · Laravel · Tailwind · Flutter · Supabase
ai/iot     TensorFlow/Keras · OpenCV · ESP32 · micro:bit · HuskyLens
tools      Git · GitHub · Figma`,
  education: () => `BCS (Software Development), UTeM ......... 2023 – now   CGPA 3.62
Matriculation, KMKPh ..................... 2022 – 2023  CGPA 3.89
SPM ...................................... 2021         5A 3B 1C`,
  contact: () => `email     <a href="mailto:amirul.hafiz73@gmail.com">amirul.hafiz73@gmail.com</a>
github    <a href="https://github.com/Mirulfiz04" target="_blank" rel="noopener">github.com/Mirulfiz04</a>
linkedin  <a href="https://www.linkedin.com/in/mirulfiz040428/" target="_blank" rel="noopener">linkedin.com/in/mirulfiz040428</a>`,
  theme: () => `Theme set to ${toggleTheme()}.`,
  ls: () => `about.txt  experience.log  projects/  skills.json  contact.md`,
  date: () => new Date().toString(),
  sudo: (arg) => /hire/.test(arg) ? (confetti(), `[sudo] permission granted. Excellent decision. 🎉\nRun <span class="c">contact</span> to make it official.`) : `Nice try. Maybe <span class="c">sudo hire-amirul</span>?`,
  clear: () => { out.innerHTML = ""; return null; },
  exit: () => { term.close(); return null; }
};
async function run(raw) {
  const line = raw.trim();
  print(`<span class="c">$</span> ${esc(line)}`);
  if (!line) return;
  hist.push(line); hIdx = hist.length;
  const [name, ...rest] = line.split(/\s+/);
  const fn = Object.hasOwn(cmds, name.toLowerCase()) && cmds[name.toLowerCase()];
  const res = fn ? await fn(rest.join(" ").toLowerCase()) : `${esc(name)}: command not found. Type <span class="c">help</span>.`;
  if (res) print(res);
}
function openTerm() {
  if (!out.childElementCount) {
    print(`Welcome to amirul.sh v2.0. Type <span class="c">help</span> to see what I can do.`, "d");
  }
  term.showModal();
  input.focus();
}
$("#termForm").addEventListener("submit", (e) => { e.preventDefault(); run(input.value); input.value = ""; });
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" && hIdx > 0) { input.value = hist[--hIdx]; e.preventDefault(); }
  if (e.key === "ArrowDown") { hIdx = Math.min(hist.length, hIdx + 1); input.value = hist[hIdx] || ""; e.preventDefault(); }
  if (e.key === "Tab") { // autocomplete
    e.preventDefault();
    const m = Object.keys(cmds).filter((c) => c.startsWith(input.value));
    if (m.length === 1) input.value = m[0] + " ";
  }
});
term.addEventListener("click", (e) => { if (e.target === term) term.close(); else if (!e.target.closest("a,button")) input.focus(); });
$$("[data-open-term]").forEach((b) => b.addEventListener("click", openTerm));
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (e.key === "`" && !typing && !modal.open) { e.preventDefault(); term.open ? term.close() : openTerm(); }
});

/* ---------- Multilingual "Hi" (he speaks all four) ---------- */
const hellos = [["Hi", "English"], ["Hai", "Malay"], ["こんにちは", "Japanese"], ["你好", "Mandarin"]];
const helloEl = $("#hello");
let hi = 0;
function nextHello() {
  hi = (hi + 1) % hellos.length;
  const [word, lang] = hellos[hi];
  helloEl.classList.remove("flip"); void helloEl.offsetWidth; helloEl.classList.add("flip");
  helloEl.textContent = word;
  helloEl.title = lang;
  return `${word}  <span class="d">(${lang})</span>`;
}
helloEl.addEventListener("click", () => { const [, lang] = hellos[(hi + 1) % hellos.length]; nextHello(); toast(`👋 ${lang}`); });
if (!reduceMotion) setInterval(() => { if (document.activeElement !== helloEl) nextHello(); }, 4000);

/* ---------- Mobile menu ---------- */
const menuBtn = $("#menuBtn"), nav = $("#nav");
function setMenu(open) { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); }
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });

/* ---------- CV: the print stylesheet turns the page into a résumé ---------- */
addEventListener("beforeprint", () => $$(".reveal").forEach((el) => el.classList.add("in")));
function printCV() {
  $$("dialog[open]").forEach((d) => d.close());
  toast("Choose “Save as PDF” in the print dialog");
  setTimeout(() => print(), 300);
}
$$("[data-print-cv]").forEach((b) => b.addEventListener("click", printCV));

/* ---------- Moments: polaroid strip + lightbox ---------- */
const moments = [
  { src: "assets/gallery/cip2026-workshop.jpg", date: "May 2026", cap: "Cabaran Inspirasi Inovasi Pintar 2026 at SMK Intan Perdana: students training their own image models in Teachable Machine", alt: "School hall at SMK Intan Perdana with Teachable Machine projected on the screen and students working on laptops" },
  { src: "assets/gallery/cip2026-donation.jpg", date: "May 2026", cap: "45 micro:bit + 45 Arduino units handed over for the programme (UTeM × onsemi × PPD Port Dickson)", alt: "Projected slide: Sumbangan Peralatan Pendidikan, 45 unit micro:bit, 45 unit Arduino, Bengkel dan Cabaran Inovasi Pintar Daerah Port Dickson 2026" },
  { src: "assets/gallery/deans-award-cert.jpg", date: "Sem I 2025/2026", cap: "Dean’s List certificate, one of five in a row", alt: "Dean's Award certificate for Amirul Hafiz bin Anuar, Bachelor of Computer Science (Software Development), Semester I Session 2025/2026" },
  { src: "assets/gallery/workshop2-award.jpg", date: "Jan 2026", cap: "Best Project Award + challenge trophy, FTMK Workshop II Innovation Competition (iPetro)", alt: "Certificate of Excellence from iPetro Services Sdn Bhd for the Best Project Award, held next to a gold trophy" },
  { src: "assets/gallery/2.jpg", date: "Jun 2025", cap: "Receiving my Dean’s Award on stage at UTeM", alt: "Amirul receiving his Dean’s Award certificate on stage at UTeM" },
  { src: "assets/gallery/3.jpg", date: "", cap: "Project review with our lecturer", alt: "Amirul and teammates reviewing a project with their lecturer" },
  { src: "assets/gallery/1.jpg", date: "", cap: "Team walkthrough of a system", alt: "Amirul's team walking through a system on a desktop monitor in a meeting room" },
  { src: "assets/gallery/4.jpg", date: "", cap: "Beyond Unity database project, presented online", alt: "Online presentation of the Beyond Unity database project poster" }
];
const strip = $("#momentList");
strip.innerHTML = moments.map((m, i) => `<button class="moment" type="button" data-i="${i}" style="--tilt:${[-3, 2, -1.5, 3, -2.5][i % 5]}deg">
  <img src="${m.src}" alt="${m.alt}" loading="lazy" />
  <span class="m-cap">${m.cap}${m.date ? `<small>${m.date}</small>` : ""}</span></button>`).join("");
// drag to scroll on desktop (touch already scrolls natively)
let drag = null;
strip.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") drag = { x: e.clientX, left: strip.scrollLeft, moved: false }; });
addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 5) drag.moved = true; strip.scrollLeft = drag.left - dx; });
addEventListener("pointerup", () => setTimeout(() => (drag = null), 0));
const lb = $("#lightbox");
let lbI = 0;
function showMoment(i) {
  lbI = (i + moments.length) % moments.length;
  const m = moments[lbI];
  $("#lbImg").src = m.src; $("#lbImg").alt = m.alt;
  $("#lbCap").textContent = `${m.cap}${m.date ? ` · ${m.date}` : ""}  (${lbI + 1}/${moments.length})`;
}
strip.addEventListener("click", (e) => {
  const b = e.target.closest(".moment");
  if (!b || drag?.moved) return;
  showMoment(+b.dataset.i); lb.showModal(); unlock("photo");
});
$("#lbPrev").addEventListener("click", () => showMoment(lbI - 1));
$("#lbNext").addEventListener("click", () => showMoment(lbI + 1));
lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") showMoment(lbI - 1); if (e.key === "ArrowRight") showMoment(lbI + 1); });
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.id === "lbImg") lb.close(); });

/* ---------- Live GitHub activity (public API, cached per session) ---------- */
const ago = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 864e5);
  return days < 1 ? "today" : days === 1 ? "yesterday" : days < 30 ? `${days} days ago` : days < 365 ? `${Math.floor(days / 30)} mo ago` : `${Math.floor(days / 365)} yr ago`;
};
const langColor = { Dart: "#00b4ab", TypeScript: "#3178c6", PHP: "#777bb4", Java: "#b07219", CSS: "#663399", Python: "#3572a5", JavaScript: "#f1e05a" };
let repos = [];
async function loadRepos() {
  try {
    const cached = sessionStorage.getItem("gh-repos");
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  const res = await fetch("https://api.github.com/users/Mirulfiz04/repos?sort=pushed&per_page=30");
  if (!res.ok) throw new Error(res.status);
  const list = (await res.json())
    .filter((r) => !r.fork && !/^(gitclass|e-portfolio-assignment)$/i.test(r.name))
    .slice(0, 6)
    .map(({ name, html_url, language, pushed_at, description }) => ({ name, html_url, language, pushed_at, description }));
  try { sessionStorage.setItem("gh-repos", JSON.stringify(list)); } catch (e) {}
  return list;
}
// only fetch once the section is near the viewport
new IntersectionObserver(async ([e], obs) => {
  if (!e.isIntersecting) return;
  obs.disconnect();
  try {
    repos = await loadRepos();
    if (!repos.length) return;
    $("#ghList").innerHTML = repos.map((r) => `<li><a href="${r.html_url}" target="_blank" rel="noopener">
      <b>${esc(r.name)}</b>
      <span class="gh-meta">${r.language ? `<i style="background:${langColor[r.language] || "var(--muted)"}"></i>${r.language} · ` : ""}updated ${ago(r.pushed_at)}</span></a></li>`).join("");
    $("#ghActivity").hidden = false;
    $("#ghActivity").classList.add("in");
  } catch (err) { /* API down or rate-limited: the section just stays hidden */ }
}, { rootMargin: "400px" }).observe($("#projects"));

Object.assign(cmds, {
  hello: () => nextHello(),
  cv: () => { setTimeout(printCV, 400); return "Opening print dialog… choose “Save as PDF”."; },
  resume: () => cmds.cv(),
  github: async () => {
    try { repos = repos.length ? repos : await loadRepos(); } catch { return `Couldn’t reach GitHub. Visit <a href="https://github.com/Mirulfiz04" target="_blank" rel="noopener">github.com/Mirulfiz04</a>`; }
    return repos.map((r) => `<span class="c">${esc(r.name).padEnd(36)}</span> ${(r.language || "").padEnd(11)} <span class="d">${ago(r.pushed_at)}</span>`).join("\n");
  }
});

/* ---------- Achievements (fun: rewards exploring) ---------- */
const badges = {
  project: ["🔍", "Curious", "Opened a project"],
  casestudy: ["📖", "Deep diver", "Read what I learned from MEDS"],
  pipeline: ["🚀", "Shipper", "Ran the CI/CD pipeline"],
  terminal: ["💻", "Hacker", "Opened terminal mode"],
  palette: ["⌘", "Power user", "Used the command palette"],
  theme: ["🌗", "Night owl", "Switched the theme"],
  photo: ["📸", "Paparazzi", "Opened a photo"],
  polyglot: ["🗣️", "Polyglot", "Said hi in another language"],
  secret: ["🎮", "Secret finder", "Found an easter egg"]
};
let got = [];
try { got = JSON.parse(localStorage.getItem("badges") || "[]").filter((k) => badges[k]); } catch (e) {}
const trophy = $("#trophy");
function renderTrophy() {
  $("#trophyCount").textContent = `${got.length}/${Object.keys(badges).length}`;
  $("#badgeList").innerHTML = Object.entries(badges).map(([k, [icon, name, how]]) =>
    `<li class="${got.includes(k) ? "got" : ""}"><span aria-hidden="true">${got.includes(k) ? icon : "🔒"}</span><b>${name}</b><small>${how}</small></li>`).join("");
}
function unlock(k) {
  if (!badges[k] || got.includes(k)) return;
  got.push(k);
  try { localStorage.setItem("badges", JSON.stringify(got)); } catch (e) {}
  renderTrophy();
  trophy.classList.remove("bump"); void trophy.offsetWidth; trophy.classList.add("bump");
  setTimeout(() => toast(`🏆 ${badges[k][1]} unlocked (${got.length}/${Object.keys(badges).length})`), 400);
  if (got.length === Object.keys(badges).length) setTimeout(() => { confetti(); toast("🏆 All badges! You’ve seen everything. Let’s talk?"); }, 2400);
}
renderTrophy();
trophy.addEventListener("click", () => $("#badges").showModal());
$("#resetBadges").addEventListener("click", () => { got = []; try { localStorage.removeItem("badges"); } catch (e) {} renderTrophy(); });
// hook the badges into what already exists
$("#themeBtn").addEventListener("click", () => unlock("theme"));
$$("[data-open-term]").forEach((b) => b.addEventListener("click", () => unlock("terminal")));
helloEl.addEventListener("click", () => unlock("polyglot"));
new MutationObserver(() => { if (term.open) unlock("terminal"); }).observe(term, { attributes: true, attributeFilter: ["open"] });
const _confetti = confetti;
confetti = function () { unlock("secret"); _confetti(); };

/* ---------- MEDS case study: tabs ---------- */
const tabs = $$('[role="tab"]');
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
    $("#" + t.getAttribute("aria-controls")).hidden = !on;
  });
  if (tab.id === "t-learn") unlock("casestudy");
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", (e) => { // arrow-key navigation, per the ARIA tabs pattern
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); selectTab(n);
  });
});

/* ---------- MEDS case study: architecture explorer ---------- */
const archText = {
  sensor: "The ESP32 reads heart rate and SpO₂ from the MAX30102 and serves them over its own Wi-Fi hotspot. A native Android channel pins the app’s request to Wi-Fi so it still works while mobile data carries the internet.",
  app: "Flutter app (MVVM-style view models and services). It runs the camera, the sensor link, the voice check-in and live fusion, then saves a reading every 5 seconds.",
  ml: "Two TensorFlow Lite models run on the phone: a MobileNet face-emotion model fed 224×224 crops from ML Kit face detection, and a voice-emotion model. No video leaves the device.",
  supa: "Supabase: Auth issues a JWT, the Data API turns tables into HTTPS endpoints, and Postgres Row Level Security decides which rows each user can touch. Indexes match the app’s real queries.",
  edge: "TypeScript Edge Functions hold the secrets: ai-proxy calls Claude for session summaries and insights, and send-data-email sends exports. Both enforce per-user rate limits in Postgres.",
  claude: "Claude writes plain-language session summaries, insights and admin trend reports. The API key never ships in the app."
};
$$("#arch .node").forEach((n) => {
  const show = () => { $$("#arch .node").forEach((x) => x.classList.toggle("on", x === n)); $("#archInfo").textContent = archText[n.dataset.k]; };
  n.addEventListener("mouseenter", show); n.addEventListener("focus", show); n.addEventListener("click", show);
});
$('#arch .node[data-k="sensor"]').classList.add("on");

/* ---------- MEDS case study: CI/CD pipeline run ---------- */
let piping = false;
$("#runPipe").addEventListener("click", async () => {
  if (piping) return; piping = true;
  const jobs = $$("#pipe .job"), btn = $("#runPipe");
  jobs.forEach((j) => j.className = j.className.replace(/ ?(run|ok)/g, ""));
  btn.disabled = true; btn.textContent = "Running…";
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const ci = jobs.filter((j) => !/apk|deploy/.test(j.dataset.job)), cd = jobs.filter((j) => /apk|deploy/.test(j.dataset.job));
  ci.forEach((j) => j.classList.add("run"));
  for (const j of ci) { await wait(450 + Math.random() * 500); j.classList.replace("run", "ok"); }
  cd.forEach((j) => j.classList.add("run"));
  for (const j of cd) { await wait(700); j.classList.replace("run", "ok"); }
  btn.disabled = false; btn.textContent = "✓ Shipped · run again";
  toast("✅ All checks passed · APK built · functions deployed");
  unlock("pipeline");
  piping = false;
});

/* ---------- Command palette (Ctrl/⌘ + K) ---------- */
const pal = $("#palette"), palIn = $("#palInput"), palList = $("#palList");
const go = (hash) => () => { pal.close(); location.hash = hash; };
const actions = [
  ...[["About", "#about"], ["Experience", "#experience"], ["Projects", "#projects"], ["MEDS case study", "#meds"], ["Photos", "#moments"], ["Skills & education", "#skills"], ["Contact", "#contact"]]
    .map(([t, h]) => ({ t, g: "Go to", run: go(h) })),
  ...projects.map((p) => ({ t: p.title, g: "Project", run: () => { pal.close(); openProject(p.id); } })),
  { t: "Download CV (PDF)", g: "Action", run: () => { pal.close(); printCV(); } },
  { t: "Copy email address", g: "Action", run: () => { pal.close(); $("#copyEmail").click(); } },
  { t: "Toggle light / dark theme", g: "Action", run: () => { pal.close(); $("#themeBtn").click(); } },
  { t: "Open terminal mode", g: "Action", run: () => { pal.close(); openTerm(); } },
  { t: "View achievements", g: "Action", run: () => { pal.close(); $("#badges").showModal(); } },
  { t: "GitHub profile", g: "Link", run: () => { pal.close(); open("https://github.com/Mirulfiz04", "_blank", "noopener"); } },
  { t: "LinkedIn profile", g: "Link", run: () => { pal.close(); open("https://www.linkedin.com/in/mirulfiz040428/", "_blank", "noopener"); } }
];
let palItems = [], palIdx = 0;
// loose "fuzzy" match: every typed character appears in order
const fuzzy = (q, s) => { let i = 0; for (const ch of s.toLowerCase()) if (ch === q[i]) i++; return i === q.length; };
function renderPal() {
  const q = palIn.value.trim().toLowerCase();
  // substring matches first (earlier = better), loose in-order matches after
  const score = (a) => { const s = a.t.toLowerCase(), i = s.indexOf(q); return i >= 0 ? i : fuzzy(q, s) ? 100 : -1; };
  palItems = q ? actions.map((a) => [score(a), a]).filter(([s]) => s >= 0).sort((x, y) => x[0] - y[0]).map(([, a]) => a) : actions;
  palIdx = Math.min(palIdx, Math.max(palItems.length - 1, 0));
  palList.innerHTML = palItems.map((a, i) => `<li role="option" id="pal-${i}" aria-selected="${i === palIdx}"><span>${a.t}</span><small>${a.g}</small></li>`).join("") || `<li class="empty">No matches</li>`;
  palIn.setAttribute("aria-activedescendant", palItems.length ? `pal-${palIdx}` : "");
  $(`#pal-${palIdx}`)?.scrollIntoView({ block: "nearest" });
}
function openPalette() { $$("dialog[open]").forEach((d) => d.close()); palIn.value = ""; palIdx = 0; renderPal(); pal.showModal(); palIn.focus(); unlock("palette"); }
palIn.addEventListener("input", () => { palIdx = 0; renderPal(); });
palIn.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { palIdx = (palIdx + 1) % Math.max(palItems.length, 1); renderPal(); e.preventDefault(); }
  if (e.key === "ArrowUp") { palIdx = (palIdx - 1 + palItems.length) % Math.max(palItems.length, 1); renderPal(); e.preventDefault(); }
  if (e.key === "Enter" && palItems[palIdx]) { e.preventDefault(); palItems[palIdx].run(); }
});
palList.addEventListener("click", (e) => { const li = e.target.closest("li[id]"); if (li) palItems[+li.id.slice(4)].run(); });
pal.addEventListener("click", (e) => { if (e.target === pal) pal.close(); });
$$("[data-open-palette]").forEach((b) => b.addEventListener("click", openPalette));
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.open ? pal.close() : openPalette(); }
});
$("#badges").addEventListener("click", (e) => { if (e.target.id === "badges") e.target.close(); });

Object.assign(cmds, { badges: () => got.map((k) => `${badges[k][0]} ${badges[k][1]}`).join("\n") || "No badges yet. Explore the site!" });

// friendly hello for the curious ones
console.log("%cHey, recruiter or fellow dev 👋", "font:700 16px sans-serif;color:#00d4a8", "\nPress ` on the page for terminal mode. Source: github.com/Mirulfiz04/E-portfolio-AMIRULHAFIZ");
