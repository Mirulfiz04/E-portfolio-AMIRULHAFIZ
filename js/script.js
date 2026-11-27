// Amirul Hafiz — portfolio interactions. No dependencies.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");
$("#year").textContent = new Date().getFullYear();

/* ---------- Data ---------- */
// lesson themes: sec = Security, data = Data & AI, arch = Architecture & APIs,
// team = Teamwork & leadership, users = Users & clients, ship = Shipping & process, fund = Fundamentals
const themes = { sec: "🔒 Security", data: "🧠 Data & AI", arch: "🧩 Architecture & APIs", team: "🤝 Teamwork & leadership", users: "🙋 Users & clients", ship: "🚀 Shipping & process", fund: "⚙️ Fundamentals" };
const projects = [
  {
    id: "meds",
    title: "MEDS: Multimodal Emotion Detection System",
    cats: ["ai", "mobile"],
    featured: true,
    emoji: "🧠💓",
    award: "Paper @ ISIRA 2026",
    blurb: "Final-year project. Reads emotion from face, heart rate and voice, with a hardened Supabase backend and a CI/CD pipeline that tests and ships every change.",
    challenge: "A camera alone is a poor judge of emotion: lighting, angle and a straight face all fool it. I wanted a phone app that cross-checks the face against the body, while keeping each user’s data private.",
    points: [
      "Flutter app with an on-device TFLite face-emotion model (MobileNet transfer learning) and a voice-emotion model for an “Are you OK?” check-in.",
      "ESP32 + MAX30102 sends heart rate and SpO₂; late fusion uses HR change as an arousal signal, with smoothing and hysteresis.",
      "Supabase backend: Auth, Postgres with Row Level Security, and Edge Functions for Claude-powered session summaries and email export, with per-user rate limits.",
      "GitHub Actions CI/CD: Flutter tests, Python self-checks and Deno type checks on every PR; release APK and Edge Function deploy on merge.",
      "Design paper presented at ISIRA 2026."
    ],
    lessons: [
      { th: "data", t: "Check the test set before trusting the score", d: "About 75% of my merged FER2013 test faces were also in training. I wrote a dedupe script and rebuilt the split, so the accuracy I report is real." },
      { th: "sec", t: "The app is not trusted", d: "The API key ships inside every APK, so every rule lives in Postgres (RLS, triggers) or an Edge Function. A check that exists only in Dart is a convenience, not security." },
      { th: "ship", t: "Automate the risky parts, and pin versions", d: "Six GitHub Actions jobs test every PR and ship every merge. When “latest” of the Supabase CLI broke a deploy, I pinned a known-good version." },
      { th: "data", t: "Combine signals with humility", d: "Heart rate can’t tell anger from fear, so it only nudges an uncertain face reading and never overrides a confident one." },
      { th: "ship", t: "Write it down", d: "Backend, AI and training guides, plus an honest list of known limits, mean someone else can run and extend the project." }
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
    blurb: "Full-stack web system for visual inspection reports: upload and annotate photos, build the report, then submit it for review. I led the team.",
    challenge: "Industry partner iPetro Services Sdn Bhd set the case study “From Inspection Photo to Visual Inspection Report”: turn raw inspection photos into a finished, reviewed report in one system.",
    points: [
      "Team leader and full-stack developer: planned the work, split tasks and integrated the codebase.",
      "Laravel back end with an Inertia + React + TypeScript front end, shadcn/ui components and Tailwind CSS.",
      "Photo upload with an in-browser image editor for marking findings on inspection photos.",
      "Roles (user, reviewer, admin) and a report workflow: draft → submitted → approved or rejected. Reports export to PDF.",
      "Chart.js dashboard and two-factor authentication with Laravel Fortify.",
      "Won the Gold Award and the Best Project Award at the FTMK Workshop II Innovation Competition (15 Jan 2026)."
    ],
    lessons: [
      { th: "team", t: "Leading means unblocking people", d: "As team leader I split the work by feature and brought it together into one codebase. Integrating early and often is what keeps a team ready to demo." },
      { th: "arch", t: "Model the workflow as explicit states", d: "Reports move draft → submitted → approved or rejected. Writing down the states, and who may change them, removes a whole class of “how did this get approved?” bugs." },
      { th: "sec", t: "Check permissions on the server", d: "Only reviewers and admins can approve, and the Laravel controllers enforce it. Hiding a button in React is not access control. 2FA protects the accounts." },
      { th: "users", t: "Build around the user’s real output", d: "Inspectors annotate findings on the photo in the browser and export a PDF: the same document they actually hand over." },
      { th: "fund", t: "Let types catch mistakes before users do", d: "TypeScript flags wrong props and missing fields at compile time, which helps when several people edit the same screens." }
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
    challenge: "Make ordering at a busy restaurant faster: customers order from their own table, and the kitchen and counter see each order straight away.",
    points: [
      "Customer flow: menu with search and categories, add-ons, cart, checkout with 6% SST, payment (online banking or e-wallet) and live order tracking.",
      "Kitchen display and staff dashboard behind a staff login, with order status and mark-as-paid.",
      "PHP REST API over MySQL; order confirmation emails sent with PHPMailer.",
      "A Python script generates a printable QR code for every table."
    ],
    lessons: [
      { th: "users", t: "One system, three very different users", d: "Customers on phones, cooks at a kitchen display and staff at the counter each get a screen that shows only what they need right now." },
      { th: "sec", t: "Never build SQL from strings", d: "Every query in the API is a PDO prepared statement and staff passwords are checked with password_verify, so user input can’t rewrite a query." },
      { th: "arch", t: "Keep the API and the UI apart", d: "The PHP endpoints only return JSON; the pages fetch it. The kitchen and tracking screens poll for updates, which kept the back end simple." },
      { th: "fund", t: "Script the boring jobs", d: "A small Python script makes a QR code for every table, instead of creating them by hand each time the layout changes." }
    ],
    tags: ["PHP", "MySQL", "JavaScript", "REST API", "Python"],
    links: [{ label: "GitHub", href: "https://github.com/Mirulfiz04/group16projectwad" }]
  },
  {
    id: "nanadash",
    title: "NanaDash (SULAM project)",
    cats: ["mobile"],
    img: "assets/project2.jpg",
    blurb: "Community-service (SULAM) mobile app for a local business, covering ordering, delivery, announcements and the product catalogue.",
    challenge: "SULAM community-service project: give a local business one mobile app for ordering, delivery, announcements and its products.",
    points: [
      "Flutter app for customers: products, ordering with delivery options, news and profile.",
      "Admin screens to manage products, news and orders, including order status updates.",
      "My own PHP REST API (sign-up, login, password reset, products, news with image upload, orders) over an 8-table MySQL schema.",
      "Delivered as a Software Project Management course project, with a demo video and project site."
    ],
    lessons: [
      { th: "users", t: "Design for the person who runs it", d: "Besides the customer app I built admin screens for products, news and orders, so the business can update its own app without a developer." },
      { th: "arch", t: "A mobile app is only half the system", d: "The Flutter app talks to an API I wrote myself, from auth and password reset to image uploads. That taught me to design endpoints around the screens that use them." },
      { th: "ship", t: "Scope to the deadline", d: "Run as a project-management course project: plan the scope, track progress, and ship a working demo on the date." }
    ],
    tags: ["Flutter", "Dart", "PHP", "REST API", "MySQL"],
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
    challenge: "Paper appointment books cause double bookings and scattered patient records. Build one server that patient and doctor apps share.",
    points: [
      "REST server on Java’s built-in HttpServer, with CORS and endpoints for patients, doctors, treatments, records and appointments (book, reschedule, status).",
      "Separate Swing screens for login, registration, patients and doctors.",
      "MySQL database plus a JSON data layer."
    ],
    lessons: [
      { th: "arch", t: "Learn HTTP without a framework", d: "Routing requests, parsing JSON and adding CORS by hand on Java’s built-in HttpServer showed me what Laravel or Spring quietly do for you." },
      { th: "arch", t: "Thin clients, rules on the server", d: "Booking, rescheduling and status changes live in the server, so the patient and doctor apps can never disagree about an appointment." },
      { th: "fund", t: "Plan for the unhappy path", d: "If the default port is taken, the server tries the next ones instead of crashing on start-up." }
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
    challenge: "Manual stock-taking causes errors, stockouts and overstocking. Specify a system that fixes it before writing any code.",
    points: [
      "Functional requirements: authentication, real-time tracking by barcode or RFID, low-stock alerts, automatic purchase orders and a sales analytics dashboard.",
      "Non-functional requirements: 50+ concurrent users, AES-256 encryption, role-based access control and 99% uptime.",
      "Use case model with 5 actors (store manager, warehouse staff, supplier, business owner, IT) and 6 use cases."
    ],
    lessons: [
      { th: "ship", t: "Make requirements testable", d: "“Fast” can’t be tested; “50+ users at once without lag” can. Writing requirements that way makes the design decisions obvious." },
      { th: "users", t: "Map every actor first", d: "Five actors and six use cases showed who needs what: suppliers only see purchase orders, owners see sales trends." },
      { th: "sec", t: "Design security in, not on", d: "Encryption and role-based access went into the specification on day one, not into a patch later." }
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
    challenge: "Connect a multi-floor headquarters and two branch offices so the network is secure today and can grow tomorrow.",
    points: [
      "Multi-floor headquarters (technical, management, server farm, sales) and two branch offices linked over a WAN.",
      "VLSM subnetting for efficient IP allocation with room to grow.",
      "Wired and wireless access, router and switch configuration, and network segmentation for security and performance.",
      "Connectivity tested end to end."
    ],
    lessons: [
      { th: "fund", t: "Plan the addressing before plugging anything in", d: "VLSM sizes each subnet to its department, so no address space is wasted and adding a floor later doesn’t mean renumbering." },
      { th: "sec", t: "Segment to contain problems", d: "Separating departments limits what a compromised or misbehaving machine can reach, and keeps traffic local." },
      { th: "fund", t: "Know what’s under the app", d: "Every app I build runs on networks like this. Understanding routing and subnets makes deployment problems far less mysterious." }
    ],
    tags: ["Cisco Packet Tracer", "VLSM", "Routing", "Wireless", "Segmentation"],
    links: [{ label: "Video presentation", href: "https://www.youtube.com/watch?v=mCOF6I-53U4" }]
  },
  {
    id: "farmintel",
    title: "FarmIntel: Fruit & Vegetable Disease Detector",
    cats: ["ai"],
    img: "assets/project3.jpg",
    blurb: "Image classifier that tells healthy produce from rotten produce, from a photo or a live camera feed.",
    challenge: "Checking produce quality by eye is slow, tiring and subjective. Could a model do it consistently from a photo?",
    points: [
      "CNN trained with Teachable Machine on a Kaggle dataset covering 14 kinds of fruit and vegetables, each healthy or rotten.",
      "Python desktop app with photo and live-camera detection, saving results to a CSV history.",
      "In the same course: rule-based expert systems using forward chaining."
    ],
    lessons: [
      { th: "data", t: "The data decides what the model can see", d: "The model can only learn colour change, mould and bruising because the images show them. The variety and labelling of the dataset set the ceiling on what it can learn." },
      { th: "data", t: "Rules or learning: pick for the problem", d: "Building rule-based expert systems alongside a CNN showed the trade-off: rules are easy to explain, learned models cope with messy real photos." },
      { th: "users", t: "A model needs a product around it", d: "Camera input and a saved history turned a model file into something a person could actually use." }
    ],
    tags: ["Python", "Teachable Machine", "Keras", "CNN"],
    links: [
      { label: "GitHub", href: "https://github.com/Mirulfiz04/Fruit-and-Vegetable-Disease-AI-Project" },
      { label: "Report (PDF)", href: "assets/reports/FarmIntel-Fruit & Vegetable Disease Detector Group 28.pdf" }
    ]
  },
  {
    id: "events",
    title: "Event Management System",
    cats: ["design"],
    img: "assets/project4.png",
    blurb: "Workshop I project: a C++ system with a MySQL database for event registration, ticket sales, volunteers and admin reports.",
    challenge: "Participants queued to buy tickets on paper, and admins had no digital records or reports. Build one central system for participants, volunteers and admins.",
    points: [
      "Participant, volunteer and admin modules: registration, login, ticket purchase, event checks and volunteer management.",
      "Normalised MySQL schema with primary and foreign keys.",
      "Admin reports with graphs of ticket sales, attendance and participant engagement.",
      "Input validation (for example a 12-digit IC number) and try/catch around database calls."
    ],
    lessons: [
      { th: "fund", t: "Know what the computer is actually doing", d: "In C++ I handled the MySQL connection and result sets through pointers myself, which made memory and resource clean-up very real." },
      { th: "users", t: "Fail with a useful message", d: "Instead of a crash or a cryptic error, bad input gets a clear message such as “IC Number must be 12 digits long!”." },
      { th: "ship", t: "Delays cascade", d: "My report found that one late phase pushed back every phase after it. My fix for next time: short iterations, buffer time and building the critical features first." }
    ],
    tags: ["C++", "MySQL", "SQL", "Data modelling"],
    links: [
      { label: "GitHub", href: "https://github.com/Mirulfiz04/Event-Management-System-workshop1" },
      { label: "Report (PDF)", href: "assets/reports/event-management-system-report.pdf" }
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

/* ---------- View transitions (animated DOM swaps where supported) ---------- */
function vt(update) {
  if (!document.startViewTransition || reduceMotion || document.hidden) return update();
  document.startViewTransition(update).ready.catch(() => {}); // a skipped transition still runs update
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
  vt(swap);
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
      <p class="p-lesson"><span aria-hidden="true">💡</span> <span><small>Taught me</small>${p.lessons[0].t}</span></p>
      <ul class="tags">${p.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
      <button class="p-more" type="button" data-open-project="${p.id}" aria-haspopup="dialog" aria-label="Details: ${p.title}">Details <span aria-hidden="true">→</span></button>
    </div>
  </article>`).join("");
observeReveals($$(".reveal"));

// .proj-head only: other chip groups (the guestbook sort, the lesson themes) also sit in a .filters box and must not hide projects
$$(".proj-head .chip").forEach((chip) => chip.addEventListener("click", () => {
  $$(".proj-head .chip").forEach((c) => c.setAttribute("aria-pressed", c === chip));
  const f = chip.dataset.filter;
  const apply = () => $$(".p-card").forEach((card) => { card.hidden = f !== "all" && !card.dataset.cats.includes(f); card.classList.add("in"); });
  vt(apply);
}));

/* ---------- What my projects taught me ---------- */
const allLessons = projects.flatMap((p) => p.lessons.map((l) => ({ ...l, p })));
const themeChips = $("#themeChips"), lessonList = $("#lessonList");
themeChips.innerHTML = [["all", `All <b>${allLessons.length}</b>`], ...Object.entries(themes).map(([k, v]) => [k, `${v} <b>${allLessons.filter((l) => l.th === k).length}</b>`])]
  .map(([k, label], i) => `<button class="chip" type="button" data-th="${k}" aria-pressed="${i === 0}">${label}</button>`).join("");
function renderLessons(th) {
  const show = () => {
    lessonList.innerHTML = allLessons.filter((l) => th === "all" || l.th === th).map((l, i) => `
      <button class="lesson card" type="button" data-open-project="${l.p.id}" style="--i:${i}">
        <span class="l-proj">${l.p.title.split(":")[0]}</span>
        <b>${l.t}</b>
        <span class="l-d">${l.d}</span>
        <span class="l-th">${themes[l.th]}</span>
      </button>`).join("");
    lessonList.classList.toggle("clip", th === "all" && !lessonsOpen); // phones: first 6 until asked
    moreBtn.hidden = th !== "all" || lessonsOpen;
  };
  vt(show);
}
themeChips.addEventListener("click", (e) => {
  const c = e.target.closest(".chip"); if (!c) return;
  $$(".chip", themeChips).forEach((x) => x.setAttribute("aria-pressed", x === c));
  renderLessons(c.dataset.th);
});
const moreBtn = $("#moreLessons");
let lessonsOpen = false;
moreBtn.textContent = `Show all ${allLessons.length} lessons`;
moreBtn.addEventListener("click", () => { lessonsOpen = true; lessonList.classList.remove("clip"); moreBtn.hidden = true; lessonList.children[6]?.focus(); });
renderLessons("all");

const modal = $("#projectModal");
function openProject(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return false;
  $("#mBody").innerHTML = `${cover(p)}
    <div class="m-body">
      <h2 id="mTitle">${p.title}</h2>
      <p class="muted">${p.blurb}</p>
      <h3 class="m-h">🎯 The challenge</h3>
      <p>${p.challenge}</p>
      <h3 class="m-h">🛠️ What I built</h3>
      <ul class="points">${p.points.map((x) => `<li>${x}</li>`).join("")}</ul>
      <div class="m-learned"><h3>💡 What it taught me</h3>
        <ol>${p.lessons.map((l) => `<li><b>${l.t}</b> <span class="th">${themes[l.th]}</span><br />${l.d}</li>`).join("")}</ol></div>
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
function termPrint(html, cls = "") { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; out.append(d); out.scrollTop = out.scrollHeight; }
const cmds = {
  help: () => `Commands:
  <span class="c">whoami</span>       short intro
  <span class="c">experience</span>   work history
  <span class="c">projects</span>     list projects  ·  <span class="c">open &lt;id&gt;</span> for details
  <span class="c">lessons</span>      what each project taught me
  <span class="c">skills</span>       tech stack
  <span class="c">education</span>    degrees and results
  <span class="c">contact</span>      how to reach me
  <span class="c">github</span>       latest repos (live)
  <span class="c">cv</span>           save my CV as PDF
  <span class="c">hello</span>        say hi in 4 languages
  <span class="c">quiz</span>         4 questions about me
  <span class="c">review</span>       leave me a review
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
  lessons: () => projects.map((p) => `<span class="c">${p.title.split(":")[0]}</span>\n${p.lessons.map((l) => `  · ${l.t}`).join("\n")}`).join("\n"),
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
  termPrint(`<span class="c">$</span> ${esc(line)}`);
  if (!line) return;
  hist.push(line); hIdx = hist.length;
  const [name, ...rest] = line.split(/\s+/);
  const fn = Object.hasOwn(cmds, name.toLowerCase()) && cmds[name.toLowerCase()];
  const res = fn ? await fn(rest.join(" ").toLowerCase()) : `${esc(name)}: command not found. Type <span class="c">help</span>.`;
  if (res) termPrint(res);
}
function openTerm() {
  if (!out.childElementCount) {
    termPrint(`Welcome to amirul.sh v2.0. Type <span class="c">help</span> to see what I can do.`, "d");
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
  setTimeout(() => window.print(), 300);
}
$$("[data-print-cv]").forEach((b) => b.addEventListener("click", printCV));

/* ---------- Moments: polaroid strip + lightbox ---------- */
const moments = [
  { src: "assets/gallery/cip2026-workshop.jpg", date: "May 2026", cap: "Cabaran Inspirasi Inovasi Pintar 2026 at SMK Intan Perdana: students training their own image models in Teachable Machine", alt: "School hall at SMK Intan Perdana with Teachable Machine projected on the screen and students working on laptops" },
  { src: "assets/gallery/cip2026-donation.jpg", date: "May 2026", cap: "45 micro:bit + 45 Arduino units handed over for the programme (UTeM × onsemi × PPD Port Dickson)", alt: "Projected slide: Sumbangan Peralatan Pendidikan, 45 unit micro:bit, 45 unit Arduino, Bengkel dan Cabaran Inovasi Pintar Daerah Port Dickson 2026" },
  { src: "assets/gallery/cip2026-mentoring.jpg", date: "Jun 2026", cap: "CIP 2026 school session: helping students wire up and code their micro:bit projects (students’ faces blurred)", alt: "Classroom of secondary school students at laptops with micro:bit kits while a facilitator looks on; faces blurred" },
  { src: "assets/gallery/cip2026-school-visit.jpg", date: "Jul 2026", cap: "Cabaran Inspirasi Inovasi Pintar 2026 (onsemi × UTeM): school visit with facilitators and participants", alt: "Group of facilitators and school students standing beside a Cabaran Inspirasi Inovasi Pintar banner; faces blurred" },
  { src: "assets/gallery/arduino2026-workshop.jpg", date: "May 2026", cap: "Arduino workshop in a school hall, part of the Port Dickson smart-innovation programme", alt: "School hall with students working at laptops on desks during an Arduino workshop; faces blurred" },
  { src: "assets/gallery/arduino2026-prize.jpg", date: "May 2026", cap: "Prize-giving for the Arduino programming competition (Pertandingan Pengaturcaraan Arduino), UTeM × onsemi", alt: "Stage slide reading Tempat Ke-1 Pertandingan Pengaturcaraan Arduino, SMK Bukit Saujana, with prize winners in front; faces blurred" },
  { src: "assets/gallery/deans-award-day.jpg", date: "Jun 2026", cap: "Collecting my Dean’s Award at the FTMK Majlis Anugerah", alt: "Amirul Hafiz in a black shirt holding his Dean's Award certificate on the UTeM campus lawn" },
  { src: "assets/gallery/deans-award-cert.jpg", date: "Sem I 2025/2026", cap: "Dean’s List certificate, one of five in a row", alt: "Dean's Award certificate for Amirul Hafiz bin Anuar, Bachelor of Computer Science (Software Development), Semester I Session 2025/2026" },
  { src: "assets/gallery/w2-award.jpg", date: "Jan 2026", cap: "With the Best Project Award and trophy on the day, FTMK Workshop II Innovation Competition", alt: "Amirul Hafiz in a suit holding the iPetro Best Project Award certificate and a gold trophy" },
  { src: "assets/gallery/w2-poster.jpg", date: "Jan 2026", cap: "Our iPetro Report Inspection poster: Laravel 3-tier architecture, waterfall method, API 510 reports", alt: "Poster titled iPetro Report Inspection showing the introduction, problem statement, system architecture with Laravel and MySQL, methodology and results" },
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
strip.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse" && !strip.classList.contains("desk")) drag = { x: e.clientX, left: strip.scrollLeft, moved: false }; });
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

/* ---------- Evidence thumbnails on experience cards (open the same lightbox) ---------- */
$$(".ev").forEach((ev) => {
  ev.innerHTML = `<span class="ev-label">📎 Evidence</span>` + ev.dataset.ev.split(" ").map((name) => {
    const i = moments.findIndex((m) => m.src.endsWith(`/${name}.jpg`));
    return i < 0 ? "" : `<button class="ev-thumb" type="button" data-i="${i}" aria-label="Open photo: ${esc(moments[i].cap)}"><img src="${moments[i].src}" alt="" loading="lazy" /></button>`;
  }).join("");
  ev.addEventListener("click", (e) => {
    const b = e.target.closest(".ev-thumb");
    if (b) { showMoment(+b.dataset.i); lb.showModal(); unlock("photo"); }
  });
});

/* ---------- Proof folders: click one to spill its evidence out ---------- */
const momentIdx = (name) => moments.findIndex((m) => m.src.endsWith(`/${name}.jpg`));
const folders = [
  { k: "awards", icon: "🏆", name: "Awards & certificates", items: ["deans-award-cert", "workshop2-award", "w2-award", "deans-award-day", "2",
    { label: "Gold Award, FTMK Workshop II (iPetro)", sub: "PDF · 0.8 MB", href: "assets/proof/gold-award-ipetro.pdf" },
    { label: "ISIRA 2026 participant certificate", sub: "PDF · 0.7 MB", href: "assets/proof/isira-2026-participant-certificate.pdf" },
    { label: "Facilitator certificate, CIIP 2026 (JPN Negeri Sembilan)", sub: "Image · 0.1 MB", href: "assets/proof/sijil-penghargaan-fasilitator.jpg" }] },
  { k: "events", icon: "📸", name: "Teaching & events", items: ["cip2026-workshop", "cip2026-mentoring", "cip2026-school-visit", "arduino2026-workshop", "arduino2026-prize", "cip2026-donation"] },
  { k: "reports", icon: "📄", name: "Reports & posters", items: ["w2-poster",
    { label: "MEDS design paper, ISIRA 2026", sub: "PDF · 0.5 MB", href: "assets/proof/isira-meds-design-paper.pdf" },
    { label: "MEDS app: Insights screen", sub: "Screenshot", href: "assets/proof/meds-insights.png" },
    { label: "MEDS app: Emotion analytics", sub: "Screenshot", href: "assets/proof/meds-emotion-analytics.png" },
    { label: "MEDS app: Session details", sub: "Screenshot", href: "assets/proof/meds-session-details.png" },
    { label: "FarmIntel report", sub: "PDF · 3.5 MB", href: "assets/reports/FarmIntel-Fruit & Vegetable Disease Detector Group 28.pdf" },
    { label: "Event Management System report", sub: "PDF · 1.6 MB", href: "assets/reports/event-management-system-report.pdf" }] }
];
$("#folders").innerHTML = folders.map((f) => {
  const peek = f.items.filter((x) => typeof x === "string").slice(0, 2).map((n) => `<img src="${moments[momentIdx(n)].src}" alt="" loading="lazy" />`).join("");
  return `<button class="folder" type="button" data-k="${f.k}" aria-expanded="false" aria-controls="foldBody">
    <span class="f-peek">${peek}</span><span class="f-front"><span class="f-ico" aria-hidden="true">${f.icon}</span><b>${f.name}</b><small>${f.items.length} files</small></span></button>`;
}).join("");
const foldBody = $("#foldBody");
$("#folders").addEventListener("click", (e) => {
  const b = e.target.closest(".folder");
  if (!b) return;
  const open = b.getAttribute("aria-expanded") === "true";
  $$(".folder").forEach((x) => x.setAttribute("aria-expanded", "false"));
  if (open) { foldBody.hidden = true; return; }
  b.setAttribute("aria-expanded", "true");
  const f = folders.find((x) => x.k === b.dataset.k);
  foldBody.innerHTML = f.items.map((x, n) => {
    if (typeof x !== "string") return `<a class="f-doc" style="--d:${n}" href="${encodeURI(x.href)}" target="_blank" rel="noopener"><span aria-hidden="true">📄</span><b>${x.label}</b><small>${x.sub} ↗</small></a>`;
    const i = momentIdx(x);
    return `<button class="f-item" type="button" style="--d:${n}" data-i="${i}"><img src="${moments[i].src}" alt="" loading="lazy" /><span>${moments[i].cap}</span></button>`;
  }).join("");
  foldBody.hidden = false;
  unlock("proof");
});
foldBody.addEventListener("click", (e) => {
  const b = e.target.closest(".f-item");
  if (b) { showMoment(+b.dataset.i); lb.showModal(); unlock("photo"); }
});

/* ---------- Moments desk mode: spread the polaroids out and drag them around ---------- */
const deskBtn = $("#deskMode");
let deskDrag = null, deskMoved = false;
deskBtn.addEventListener("click", () => {
  const on = !strip.classList.contains("desk");
  strip.classList.toggle("desk", on);
  deskBtn.setAttribute("aria-pressed", on);
  deskBtn.textContent = on ? "↩ Back to the strip" : "🖐 Spread them on a desk";
  $$(".moment", strip).forEach((m, i) => {
    if (!on) { m.style.left = m.style.top = ""; return; }
    // loose grid + jitter so the pile covers the whole desk
    const W = strip.clientWidth, H = strip.clientHeight, w = m.offsetWidth;
    const cols = Math.max(2, Math.floor(W / (w + 10))), rows = Math.ceil(moments.length / cols);
    const cellW = (W - w) / Math.max(1, cols - 1), cellH = (H - m.offsetHeight) / Math.max(1, rows - 1);
    m.style.left = `${Math.min(W - w, Math.max(0, (i % cols) * cellW + (Math.random() - 0.5) * 30))}px`;
    m.style.top = `${Math.max(0, Math.floor(i / cols) * cellH + (Math.random() - 0.5) * 30)}px`;
    m.style.zIndex = i;
  });
  if (on) unlock("desk");
});
strip.addEventListener("pointerdown", (e) => {
  const m = e.target.closest(".moment");
  if (!strip.classList.contains("desk") || !m) return;
  deskDrag = { m, x: e.clientX - m.offsetLeft, y: e.clientY - m.offsetTop, sx: e.clientX, sy: e.clientY };
  deskMoved = false;
  m.style.zIndex = 99 + Date.now() % 1e6;
  m.setPointerCapture(e.pointerId);
});
strip.addEventListener("pointermove", (e) => {
  if (!deskDrag) return;
  if (Math.hypot(e.clientX - deskDrag.sx, e.clientY - deskDrag.sy) > 5) deskMoved = true;
  deskDrag.m.style.left = `${Math.max(-40, Math.min(strip.clientWidth - 160, e.clientX - deskDrag.x))}px`;
  deskDrag.m.style.top = `${Math.max(-20, Math.min(strip.clientHeight - 120, e.clientY - deskDrag.y))}px`;
});
strip.addEventListener("pointerup", () => (deskDrag = null));
// a drag on the desk should not also open the photo
strip.addEventListener("click", (e) => { if (deskMoved) { e.stopImmediatePropagation(); deskMoved = false; } }, true);

/* ---------- Timeline line fills as you scroll ---------- */
const tl = $(".timeline");
const fillTimeline = () => {
  const r = tl.getBoundingClientRect();
  tl.style.setProperty("--fill", Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / r.height)).toFixed(3));
};
addEventListener("scroll", fillTimeline, { passive: true });
fillTimeline();

/* ---------- Skills: tap one to see where it was used ---------- */
const skillInfo = $("#skillInfo");
const skillLis = $$(".skill-group li");
const tappedSkills = new Set();
// sparkles + a boing from the pill you picked. Particles live in a page-sized, clipped layer so they scroll with the page and never add a sideways scrollbar.
function burst(el, color) {
  if (reduceMotion || !el.animate) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2 + scrollX, cy = r.top + r.height / 2 + scrollY;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = `position:absolute;left:0;top:0;width:100%;height:${document.documentElement.scrollHeight}px;overflow:hidden;pointer-events:none;z-index:96`;
  const palette = [color, "#ffb547", "#ff5f8a", "#00d4a8"];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span"), c = palette[i % palette.length], star = i % 3 === 0;
    const a = (Math.PI * 2 * i) / 18 + Math.random() * 0.4, d = 48 + Math.random() * 56;
    if (star) p.textContent = "✦";
    p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;color:${c};font-size:22px;line-height:1;${star ? "" : `width:9px;height:9px;border-radius:50%;background:${c};`}`;
    layer.append(p);
    p.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0.2) rotate(180deg)`, opacity: 0 }
    ], { duration: 550 + Math.random() * 300, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)", fill: "forwards" });
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1000);
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.15) rotate(-4deg)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }], { duration: 450, easing: "ease-out" });
}
const skillShow = new Map();
$$(".skill-group ul").forEach((ul) => [...ul.children].forEach((li, n) => li.style.setProperty("--n", n)));
skillLis.forEach((li) => {
  li.tabIndex = 0;
  li.setAttribute("role", "button");
  const show = (fromRoll = false) => {
    $$(".skill-group li.on").forEach((x) => x.classList.remove("on"));
    li.classList.add("on");
    const alias = { SQL: "SQL / MySQL / PostgreSQL", "Tailwind CSS": "Tailwind" };
    const terms = (alias[li.textContent] || li.textContent).split(" / ").map((t) => new RegExp(`(^|[^\\w])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\w]|$)`, "i"));
    const used = projects.filter((p) => terms.some((re) => re.test([p.title, p.blurb, ...p.tags].join(" | "))));
    const ico = li.querySelector("img"), color = getComputedStyle(li.closest(".skill-group")).getPropertyValue("--g").trim() || "#00d4a8";
    skillInfo.style.setProperty("--g", color);
    skillInfo.innerHTML = `<span class="si-ico">${ico ? `<img src="${ico.getAttribute("src")}" alt="" width="30" height="30" />` : ""}</span><span>${used.length
      ? `<b>${esc(li.textContent)}</b> shows up in ${used.length} project${used.length > 1 ? "s" : ""}: ${used.map((p) => `<a href="#projects" data-open-project="${p.id}">${p.title}</a>`).join(" · ")}`
      : `<b>${esc(li.textContent)}</b> comes from my work and teaching, not a listed project. <a href="#experience">See my experience →</a>`}</span>`;
    if (!reduceMotion) skillInfo.animate([{ opacity: 0.3, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 350, easing: "ease-out" });
    burst(li, color);
    tappedSkills.add(li.textContent);
    if (tappedSkills.size >= 5) unlock("toolbox");
    if (fromRoll) toast(`🎲 ${li.textContent}: ${used.length ? `in ${used.length} project${used.length > 1 ? "s" : ""}` : "from my work and teaching"}`);
    else skillInfo.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" }); // on phones the answer sits below all groups
  };
  skillShow.set(li, show);
  li.addEventListener("click", () => show());
  li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
});
// 🎲 pick a random skill (never the one already open), bring it into view and show it
$("#skillRoll")?.addEventListener("click", () => {
  const pool = skillLis.filter((x) => !x.classList.contains("on"));
  const pick = pool[(Math.random() * pool.length) | 0];
  pick.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  skillShow.get(pick)(true);
});

/* ---------- Live GitHub activity (public API, cached per session) ---------- */
const ago = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 864e5);
  return days < 1 ? "today" : days === 1 ? "yesterday" : days < 30 ? `${days} days ago` : days < 365 ? `${Math.floor(days / 30)} mo ago` : `${Math.floor(days / 365)} yr ago`;
};
const langColor = { Dart: "#00b4ab", TypeScript: "#3178c6", PHP: "#777bb4", Java: "#b07219", CSS: "#663399", Python: "#3572a5", JavaScript: "#f1e05a" };
let repos = [];
const isRepo = (r) => r && typeof r.name === "string" && /^https:\/\/github\.com\//.test(r.html_url)
  && typeof r.pushed_at === "string" && (r.language == null || typeof r.language === "string");
async function loadRepos() {
  try {
    // only trust a cached list that has exactly the shape we stored; anything else (edited, truncated, old format) is refetched
    const cached = JSON.parse(sessionStorage.getItem("gh-repos"));
    if (Array.isArray(cached) && cached.every(isRepo)) return cached;
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
    $("#ghList").innerHTML = repos.map((r) => `<li><a href="${esc(r.html_url)}" target="_blank" rel="noopener">
      <b>${esc(r.name)}</b>
      <span class="gh-meta">${r.language ? `<i style="background:${langColor[r.language] || "var(--muted)"}"></i>${esc(r.language)} · ` : ""}updated ${ago(r.pushed_at)}</span></a></li>`).join("");
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
    return repos.map((r) => `<span class="c">${esc(r.name).padEnd(36)}</span> ${esc(r.language || "").padEnd(11)} <span class="d">${ago(r.pushed_at)}</span>`).join("\n");
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
  secret: ["🎮", "Secret finder", "Found an easter egg"],
  quiz: ["🎯", "Top fan", "Got 4/4 in the quiz"],
  review: ["✍️", "Critic", "Sent a review"],
  proof: ["🗂️", "Fact checker", "Opened a proof folder"],
  desk: ["🖐️", "Tidy desk", "Spread the photos on the desk"],
  toolbox: ["🧰", "Toolbox tourist", "Tapped 5 different skills"]
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
// eslint-disable-next-line no-func-assign -- intentional: wrap confetti so every easter egg also unlocks the badge
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
  ...[["About", "#about"], ["Experience", "#experience"], ["Projects", "#projects"], ["What my projects taught me", "#lessons"], ["MEDS case study", "#meds"], ["Photos", "#moments"], ["Skills & education", "#skills"], ["Contact", "#contact"]]
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

/* ---------- Guestbook: approved reviews + visitor count ---------- */
// Paste the Formspree form ID here (formspree.io/f/<ID>). Empty = the form opens an email draft instead.
const FORMSPREE_ID = "";
const REVIEW_TO = "amirul.hafiz73@gmail.com";
let reviews = [], rvSort = "new";
const starStr = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
function renderReviews() {
  const n = reviews.length;
  const avg = n ? reviews.reduce((a, r) => a + r.rating, 0) / n : 0;
  $("#rvAvg").textContent = n ? avg.toFixed(1) : "–";
  $("#rvAvgStars").textContent = n ? starStr(avg) : "";
  $("#rvCount").textContent = n ? `from ${n} review${n > 1 ? "s" : ""}` : "No reviews yet";
  $(".rv-sort").hidden = n < 2;
  const sorted = [...reviews].sort(rvSort === "top" ? (a, b) => b.rating - a.rating || b.date.localeCompare(a.date) : (a, b) => b.date.localeCompare(a.date));
  $("#rvList").innerHTML = sorted.length ? sorted.map((r) => `<li>
      <header><b>${esc(r.name)}</b>${r.role ? `<span class="muted small">${esc(r.role)}</span>` : ""}<span class="stars" role="img" aria-label="${r.rating} out of 5 stars">${starStr(r.rating)}</span><time class="muted small" datetime="${esc(r.date)}">${esc(r.date)}</time></header>
      <p>${esc(r.comment)}</p></li>`).join("")
    : `<li class="empty">No reviews yet. Be the first one! ✍️</li>`;
}
// reviews.json only holds reviews I approved, so nothing unmoderated is ever shown
fetch("reviews.json", { cache: "no-cache" }).then((r) => r.json())
  .then((d) => { reviews = d.filter((r) => r && r.name && r.comment && r.rating >= 1 && r.rating <= 5 && r.date); renderReviews(); })
  .catch(renderReviews);
$$(".rv-sort .chip").forEach((c) => c.addEventListener("click", () => {
  rvSort = c.dataset.sort;
  $$(".rv-sort .chip").forEach((x) => x.setAttribute("aria-pressed", x === c));
  vt(renderReviews);
}));

const rvForm = $("#rvForm"), rvMsg = $("#rvMsg");
rvForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(rvForm);
  if (f.get("_gotcha")) return; // bots fill the hidden field
  const done = () => { rvForm.reset(); unlock("review"); confetti(); rvMsg.textContent = "Thank you! I’ll read it and put it up soon. 🙏"; };
  if (!FORMSPREE_ID) {
    const body = `Rating: ${f.get("rating")}/5\nName: ${f.get("name")}\nRole: ${f.get("role")}\n\n${f.get("comment")}`;
    location.href = `mailto:${REVIEW_TO}?subject=${encodeURIComponent("Portfolio review")}&body=${encodeURIComponent(body)}`;
    // nothing has been sent yet: the visitor still has to press send in their email app, so keep their text and claim no success
    rvMsg.textContent = `An email draft to ${REVIEW_TO} should have opened. Press send there to deliver your review. Nothing has been sent yet, and your text is still here.`;
    return;
  }
  const btn = rvForm.querySelector("[type=submit]");
  btn.disabled = true; rvMsg.textContent = "Sending…";
  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, { method: "POST", body: f, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(res.status);
    done();
  } catch (err) { rvMsg.textContent = `Couldn’t send it. Please email me at ${REVIEW_TO} instead.`; }
  btn.disabled = false;
});

// shortcut: free no-signup counter (abacus), one visit per browser session; hides itself if the API is down
(async () => {
  const base = "https://abacus.jasoncameron.dev", key = "ahp-folio-x7k2/visits";
  let seen = false;
  try { seen = sessionStorage.getItem("counted") === "1"; } catch (e) {}
  try {
    const r = await fetch(`${base}/${seen ? "get" : "hit"}/${key}`);
    const { value } = await r.json();
    if (typeof value !== "number") throw 0;
    try { sessionStorage.setItem("counted", "1"); } catch (e) {}
    $("#visits").textContent = value.toLocaleString();
  } catch (e) { $("#visits").closest(".rv-stat").hidden = true; }
})();

/* ---------- Quiz ---------- */
const quizQs = [
  ["Where do I study?", ["UTeM", "UTM", "UM", "USM"], 0],
  ["What did iPetro win?", ["Hackathon runner-up", "Gold + Best Project Award", "People’s Choice", "Nothing yet"], 1],
  ["How many languages do I speak?", ["2", "3", "4", "5"], 2],
  ["What does MEDS detect?", ["Earthquakes", "Plant diseases", "Fraud", "Emotions"], 3]
];
const qBody = $("#qBody");
let qi = 0, qScore = 0;
function showQ() {
  if (qi === quizQs.length) {
    const perfect = qScore === quizQs.length;
    qBody.innerHTML = `<p class="lead">You got <b>${qScore}/${quizQs.length}</b>. ${perfect ? "You clearly read everything. 🎉" : "Not bad! Every answer is somewhere on this page. 😉"}</p>
      <p><button class="btn primary" type="button" data-q="again">Try again</button> <a class="btn" href="#reviews" data-q="close">Leave a review</a></p>`;
    if (perfect) { unlock("quiz"); confetti(); }
    return;
  }
  const [q, opts] = quizQs[qi];
  qBody.innerHTML = `<div class="quiz-bar" aria-hidden="true"><i style="width:${(qi / quizQs.length) * 100}%"></i></div>
    <p class="muted small">Question ${qi + 1} of ${quizQs.length}</p><h3>${q}</h3>
    <ul class="quiz-opts">${opts.map((o, i) => `<li><button class="btn" type="button" data-a="${i}">${o}</button></li>`).join("")}</ul>`;
  qBody.querySelector("button").focus();
}
qBody.addEventListener("click", (e) => {
  const b = e.target.closest("button, a");
  if (!b) return;
  if (b.dataset.q === "again") { qi = qScore = 0; return showQ(); }
  if (b.dataset.q === "close") return $("#quiz").close();
  if (b.dataset.a === undefined || qBody.querySelector(".right")) return;
  const ok = +b.dataset.a === quizQs[qi][2];
  if (ok) qScore++; else b.classList.add("wrong");
  qBody.querySelector(`[data-a="${quizQs[qi][2]}"]`).classList.add("right");
  qi++; setTimeout(showQ, ok ? 600 : 1100);
});
function openQuiz() { $$("dialog[open]").forEach((d) => d.close()); qi = qScore = 0; showQ(); $("#quiz").showModal(); }
$("#openQuiz").addEventListener("click", openQuiz);
$("#quiz").addEventListener("click", (e) => { if (e.target.id === "quiz") e.target.close(); });
actions.push(
  { t: "Guestbook & reviews", g: "Go to", run: go("#reviews") },
  { t: "Take the quiz", g: "Action", run: () => { pal.close(); openQuiz(); } }
);
Object.assign(cmds, {
  quiz: () => { setTimeout(openQuiz, 300); return "Starting the quiz… good luck!"; },
  review: () => { setTimeout(() => { term.close(); location.hash = "#reviews"; }, 300); return "Taking you to the guestbook…"; }
});

/* ---------- 3D tilt on project cards (mouse only, respects reduced motion) ---------- */
if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
  list.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".p-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.classList.add("tilt");
    card.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
    card.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -8}deg`);
  });
  list.addEventListener("pointerout", (e) => {
    const card = e.target.closest(".p-card");
    if (card && !card.contains(e.relatedTarget)) card.classList.remove("tilt");
  });
}

// friendly hello for the curious ones
console.log("%cHey, recruiter or fellow dev 👋", "font:700 16px sans-serif;color:#00d4a8", "\nPress ` on the page for terminal mode. Source: github.com/Mirulfiz04/E-portfolio-AMIRULHAFIZ");
