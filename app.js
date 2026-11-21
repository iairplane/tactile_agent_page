// CaTS project page: task player, animated charts, scroll reveal, table of contents.
(function () {
  "use strict";

  // ---------- hero teaser: play once, then glide down to the article ----------
  const hero = document.getElementById("hero-video");
  const bar = document.getElementById("hero-bar");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (hero) {
    if (reduceMotion) { hero.removeAttribute("autoplay"); hero.pause(); }
    hero.addEventListener("timeupdate", () => { if (bar && hero.duration) bar.style.width = (100 * hero.currentTime / hero.duration) + "%"; });
    hero.addEventListener("ended", () => {
      if (bar) bar.style.width = "100%";
      // only dissolve + auto-scroll if the reader is still on the hero
      if (reduceMotion || window.scrollY > window.innerHeight * 0.3) return;
      dissolveHero(() => document.getElementById("title").scrollIntoView({ behavior: "smooth", block: "start" }));
    });
    hero.play().catch(() => {});
  }

  // Particle dissolve of the final logo frame: bright pixels become particles that drift away.
  function dissolveHero(onHalfway) {
    const box = hero.parentElement, W = box.clientWidth, H = box.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement("canvas");
    cv.className = "hero-fx"; cv.width = W * dpr; cv.height = H * dpr;
    box.appendChild(cv);
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    // where the video is drawn inside the box (object-fit: contain)
    const vr = hero.videoWidth / hero.videoHeight, br = W / H;
    const vw = vr > br ? W : H * vr, vh = vr > br ? W / vr : H, vx = (W - vw) / 2, vy = (H - vh) / 2;
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const o = off.getContext("2d"); o.fillStyle = "#0a0b0d"; o.fillRect(0, 0, W, H);
    try { o.drawImage(hero, vx, vy, vw, vh); } catch (e) { onHalfway(); cv.remove(); return; }
    const data = o.getImageData(0, 0, W, H).data;
    const step = W > 1200 ? 3 : 2, P = [];
    let minX = W, maxX = 0;
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
      const i = (y * W + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
      if (r + g + b < 150) continue;               // keep the logo, title and subtitle
      const ang = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 2.2;
      P.push({ x, y, r, g, b, vx: Math.cos(ang) * sp + 1.2, vy: Math.sin(ang) * sp - 1.4, s: step * (0.9 + Math.random() * 0.6), d: 0 });
      if (x < minX) minX = x; if (x > maxX) maxX = x;
    }
    // stagger: the dissolve sweeps from left to right
    P.forEach((p) => { p.d = ((p.x - minX) / Math.max(1, maxX - minX)) * 700 + Math.random() * 220; });
    ctx.drawImage(off, 0, 0, W, H);
    hero.style.opacity = "0";
    const t0 = performance.now(), LIFE = 1100, TOTAL = 700 + 220 + LIFE;
    let fired = false;
    (function frame(now) {
      const t = now - t0;
      ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H);
      // the part the sweep has not reached yet stays the crisp original frame
      const sweep = minX + ((t - 220) / 700) * (maxX - minX);
      if (sweep < maxX + step) { ctx.save(); ctx.beginPath(); ctx.rect(Math.max(0, sweep), 0, W, H); ctx.clip(); ctx.drawImage(off, 0, 0, W, H); ctx.restore(); }
      for (const p of P) {
        const k = (t - p.d) / LIFE;
        if (k >= 1 || (k <= 0 && p.x >= sweep)) continue;
        let x = p.x, y = p.y, a = 1, s = p.s;
        if (k > 0) {
          const e = k * k;
          x += p.vx * e * 90 + Math.sin((p.y + t * 0.6) * 0.02) * 12 * k;
          y += p.vy * e * 90;
          a = 1 - k; s = p.s * (1 - 0.6 * k);
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = k > 0 ? `rgb(${Math.min(255, p.r + 40 * k)},${Math.min(255, p.g + 60 * k)},${255})` : `rgb(${p.r},${p.g},${p.b})`;
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;
      if (!fired && t > TOTAL * 0.45) { fired = true; onHalfway(); }
      if (t < TOTAL) requestAnimationFrame(frame);
      else setTimeout(() => { cv.remove(); hero.style.transition = "opacity .8s"; hero.style.opacity = "1"; }, 900);
    })(t0);
  }

  // ---------- real-robot task player ----------
  const TASKS = [
    { id: "01_safety_cap", name: "T1 · Push-and-turn cap opening", rate: 80, desc: "Rotation Guard detects when the child-resistant cap engages; Release Guard verifies it is free before the lift." },
    { id: "02_top_cup", name: "T2 · Top-cup extraction", rate: 50, desc: "The contact pattern distinguishes holding one cup from holding several before lifting." },
    { id: "03_top_bowl", name: "T3 · Top-bowl extraction", rate: 60, desc: "The force pattern confirms a single-bowl grasp before extraction." },
    { id: "05_usb", name: "T4 · USB unplugging and reinsertion", rate: 70, desc: "Contact force and torque correct the insertion pose. The clip shows the insertion; the success rate is for the full task." },
    { id: "04_dropper", name: "T5 · Pipette aspiration and dispensing", rate: 80, desc: "Shear force regulates the squeeze; the visual branch follows the cup when it is moved." },
    { id: "06_test_tube", name: "T6 · Tube reorientation and insertion", rate: 60, desc: "The demonstrated rotation transfers to the robot; contact feedback corrects the insertion angle of the transparent tube." },
  ];
  const tabs = document.querySelector(".tabs");
  const video = document.getElementById("task-video");
  function selectTask(i, play) {
    const t = TASKS[i];
    tabs.querySelectorAll(".tab").forEach((b, j) => b.setAttribute("aria-selected", String(i === j)));
    video.poster = `assets/cats/tasks/${t.id}.jpg`;
    video.src = `assets/cats/tasks/${t.id}.mp4`;
    document.getElementById("task-name").textContent = t.name;
    document.getElementById("task-desc").textContent = t.desc;
    document.getElementById("task-rate").textContent = `CaTS success ${t.rate}%`;
    if (play) video.play().catch(() => {});
  }
  window.__selectTask = selectTask;
  if (tabs && video) {
    TASKS.forEach((t, i) => {
      const b = document.createElement("button");
      b.className = "tab"; b.type = "button"; b.setAttribute("role", "tab");
      b.textContent = t.name.split(" · ")[1];
      b.addEventListener("click", () => selectTask(i, true));
      tabs.appendChild(b);
    });
    selectTask(0, false);
  }

  // ---------- horizontal bar charts ----------
  document.querySelectorAll(".bars[data-bars]").forEach((el) => {
    const rows = JSON.parse(el.dataset.bars);
    el.innerHTML = rows.map(([n, v, ours]) =>
      `<div class="bar-row${ours ? " ours" : ""}"><span class="name">${n}</span><span class="bar-track"><span class="bar-fill" data-v="${v}"></span></span><span class="val">${v.toFixed(1)}%</span></div>`).join("");
  });

  // ---------- count-up helper ----------
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countTo(el, from, to, dur = 1100, delay = 0, suffix = "%") {
    if (reduce) { el.textContent = to.toFixed(1) + suffix; return; }
    const t0 = performance.now() + delay;
    (function step(now) {
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (from + (to - from) * e).toFixed(1) + suffix;
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  // ---------- "race" bar charts (real-robot mean, simulation means) ----------
  const SIM_SETS = {
    all: { rows: [["CaTS (Ours)", 61.8, 1], ["Agent0 + D", 43.1], ["Agent0", 30.6]], note: "Mean over all 20 simulated tasks." },
    uni: { rows: [["CaTS (Ours)", 63.3, 1], ["UniV.", 48.0], ["Agent0 + D", 46.7], ["Agent0", 41.0], ["VITaL", 40.5], ["ACT", 30.9]], note: "UniVTAC, 8 tasks. ACT, VITaL and UniV. are published results: reference points, not same-protocol controls." },
    neo: { rows: [["CaTS (Ours)", 60.7, 1], ["π0.5", 45.8], ["Agent0 + D", 40.6], ["LingBot", 32.1], ["Agent0", 23.7], ["Xiaomi-R0", 23.4]], note: "NeoSim, 12 tasks. π0.5, LingBot and Xiaomi-R0 are published results: reference points, not same-protocol controls." },
  };
  function drawRace(box, rows, deltaText, animateFromZero) {
    const wrap = box.querySelector(".race-rows");
    const prev = {};
    wrap.querySelectorAll(".race-row").forEach((r) => { prev[r.dataset.k] = +r.dataset.v; });
    wrap.innerHTML = rows.map(([n, v, ours]) =>
      `<div class="race-row${ours ? " ours" : ""}" data-k="${n}" data-v="${v}"><span class="name">${n}</span><span class="bar-track"><span class="bar-fill"></span></span><span class="val">0.0%</span></div>`).join("");
    const d = box.querySelector(".delta");
    d.innerHTML = deltaText ? `<span>${deltaText}</span>` : "";
    wrap.querySelectorAll(".race-row").forEach((r, i) => {
      const v = +r.dataset.v, from = animateFromZero ? 0 : (prev[r.dataset.k] ?? 0);
      const fill = r.querySelector(".bar-fill");
      fill.style.transition = "none"; fill.style.width = from + "%"; void fill.offsetWidth; fill.style.transition = "";
      setTimeout(() => { fill.style.width = v + "%"; }, 60 + i * 110);
      countTo(r.querySelector(".val"), from, v, 1100, 60 + i * 110);
    });
    if (d.firstChild) setTimeout(() => d.firstChild.classList.add("on"), 1200);
  }
  function bestDelta(rows) { const best = Math.max(...rows.filter((r) => !r[2]).map((r) => r[1])); return `+${(rows[0][1] - best).toFixed(1)} points over the best baseline`; }
  const realRace = document.getElementById("real-race");
  const realRows = realRace ? JSON.parse(realRace.querySelector(".race-rows").dataset.race) : [];
  const simRace = document.getElementById("sim-race");
  let simSet = "all";
  function showSim(set, fromZero) {
    simSet = set; const S = SIM_SETS[set];
    simRace.querySelectorAll("[data-set]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.set === set)));
    drawRace(simRace, S.rows, bestDelta(S.rows), fromZero);
    simRace.querySelector(".race-note").textContent = S.note;
  }
  if (simRace) simRace.querySelectorAll("[data-set]").forEach((b) => b.addEventListener("click", () => showSim(b.dataset.set, false)));
  document.querySelectorAll("[data-replay]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.replay === "real-race") drawRace(realRace, realRows, bestDelta(realRows), true);
    else showSim(simSet, true);
  }));

  // ---------- real-robot task cards (click to play) ----------
  const cardsEl = document.getElementById("task-cards");
  const ZERO = { "01_safety_cap": 1, "02_top_cup": 1, "06_test_tube": 1 };
  if (cardsEl) {
    cardsEl.innerHTML = TASKS.map((t, i) => {
      const [id, name] = t.name.split(" · ");
      return `<button type="button" class="task-card" style="--d:${i * 90}ms" data-i="${i}">
        <img src="assets/cats/tasks/${t.id}.jpg" alt="" loading="lazy"><span class="play"></span>
        <div class="tc-body"><div class="tc-id">${id}</div><div class="tc-name">${name}</div>
        <div class="tc-pct" data-v="${t.rate}">0.0%</div><div class="tc-base">${ZERO[t.id] ? "both baselines: 0%" : "CaTS success"}</div></div></button>`;
    }).join("");
    cardsEl.querySelectorAll(".task-card").forEach((c) => c.addEventListener("click", () => {
      window.__selectTask(+c.dataset.i, true);
      document.getElementById("demos").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }));
  }

  // ---------- simulation task grid (paper Fig. 5, CaTS per task) ----------
  const SIM = [
    ["UniVTAC", "Lift (Bottle)", 70.0], ["UniVTAC", "Lift (Can)", 63.3], ["UniVTAC", "Place (Bottle)", 66.7], ["UniVTAC", "Classify", 50.0],
    ["UniVTAC", "Insert (Hole)", 64.4, "s"], ["UniVTAC", "Insert (HDMI)", 53.3], ["UniVTAC", "Insert (Tube)", 88.9, "s"], ["UniVTAC", "Pull (Key)", 50.0, "s"],
    ["NeoSim", "Grasp (Chip)", 56.7], ["NeoSim", "Pour (Ball)", 40.0], ["NeoSim", "Insert (USB)", 66.7], ["NeoSim", "Replug (Charger)", 46.7],
    ["NeoSim", "Insert (Screw)", 46.7], ["NeoSim", "Place (Gears)", 73.3], ["NeoSim", "Unstack (Bowl)", 56.7], ["NeoSim", "Handover (Cup)", 68.9, "b"],
    ["NeoSim", "Stack (Cups)", 26.7], ["NeoSim", "Stack (Plates)", 80.0, "b"], ["NeoSim", "Stack (Bowls)", 66.7], ["NeoSim", "Unstack (Cup)", 100.0, "b"],
  ];
  const WHY = { s: "Paper highlight: contact changes must switch the response between stages.", b: "Paper highlight: the demonstration coordinates action modes across both arms." };
  const ranks = SIM.map((r) => r[2]).slice().sort((a, b) => b - a);
  const grid = document.getElementById("sim-grid");
  if (grid) {
    grid.innerHTML = SIM.map(([b, n, v, hl], i) =>
      `<div class="sim-card${hl ? " hl" : ""}" tabindex="0" data-i="${i}" data-b="${b}" data-v="${v}" data-hl="${hl ? 1 : 0}" style="transition-delay:${i * 45}ms">
         <div class="bench ${b === "NeoSim" ? "neo" : "uni"}">${b}<span class="rank">#${ranks.indexOf(v) + 1} of 20</span></div>
         <div class="task">${n}</div>
         <div class="pct" data-v="${v}">0.0%</div>
         <div class="mini"><i data-v="${v}"></i></div>
         <div class="why">${hl ? WHY[hl] : "CaTS success over 90 trials."}</div></div>`).join("");
  }
  // filter + sort with a FLIP animation
  let filt = "all";
  function layoutGrid() {
    const cards = [...grid.children];
    const first = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    const sorted = document.getElementById("sort-sim").checked;
    const order = cards.slice().sort((a, b) => sorted ? (+b.dataset.v - +a.dataset.v) : (+a.dataset.i - +b.dataset.i));
    order.forEach((c) => grid.appendChild(c));
    cards.forEach((c) => {
      const show = filt === "all" || (filt === "hl" ? c.dataset.hl === "1" : c.dataset.b === filt);
      c.classList.toggle("gone", !show);
    });
    if (reduce) return;
    cards.forEach((c) => {
      if (c.classList.contains("gone")) return;
      const a = first.get(c), b = c.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      c.style.transitionDelay = "0ms";
      if (a.width === 0) { c.animate([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 350, easing: "ease-out" }); return; }
      if (dx || dy) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  }
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
    filt = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    layoutGrid();
  }));
  const sortBox = document.getElementById("sort-sim");
  if (sortBox) sortBox.addEventListener("change", layoutGrid);

  // ---------- ablation toggle ----------
  const pt = document.getElementById("prior-toggle");
  if (pt) pt.addEventListener("change", () => {
    const on = pt.checked, box = document.getElementById("prior-box");
    box.classList.toggle("off", !on);
    document.getElementById("prior-label").textContent = on ? "with priors" : "without priors";
    const st = on ? 80.0 : 40.0, ac = on ? 76.9 : 65.1;
    countTo(document.getElementById("prior-stage"), on ? 40.0 : 80.0, st, 700);
    countTo(document.getElementById("prior-acc"), on ? 65.1 : 76.9, ac, 700);
    document.getElementById("prior-stage-bar").style.width = st + "%";
    document.getElementById("prior-acc-bar").style.width = ac + "%";
  });

  // ---------- cross-sensor selector ----------
  const SENS = [["5.715", "5.774", "−0.384", "100%"], ["5.763", "5.752", "−0.970", "100%"], ["5.722", "5.747", "−0.329", "100%"]];
  document.querySelectorAll("[data-sensor]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-sensor]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    document.querySelectorAll(".sensor-vals b").forEach((el) => {
      const v = SENS[+b.dataset.sensor][+el.dataset.k];
      if (el.textContent !== v) { el.textContent = v; el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 600); }
    });
  }));

  // ---------- reveal + animate on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("in");
      el.querySelectorAll(".bars .bar-fill").forEach((f) => { f.style.width = f.dataset.v + "%"; });
      if (el.classList.contains("bars")) el.querySelectorAll(".bar-fill").forEach((f) => { f.style.width = f.dataset.v + "%"; });
      if (el.id === "sim-grid") {
        el.querySelectorAll(".pct").forEach((p, i) => countTo(p, 0, +p.dataset.v, 1100, i * 45 + 200));
        el.querySelectorAll(".mini i").forEach((m) => { m.style.width = m.dataset.v + "%"; });
        setTimeout(() => el.querySelectorAll(".sim-card").forEach((c) => (c.style.transitionDelay = "0ms")), 1500);
      }
      if (el.id === "task-cards") el.querySelectorAll(".tc-pct").forEach((p, i) => countTo(p, 0, +p.dataset.v, 1000, i * 90 + 200));
      if (el.id === "real-race") drawRace(realRace, realRows, bestDelta(realRows), true);
      if (el.id === "sim-race") showSim("all", true);
      io.unobserve(el);
    });
  }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".reveal, .bars, #sim-grid, #task-cards, #real-race, #sim-race").forEach((el) => io.observe(el));

  // ---------- table of contents highlight ----------
  const links = [...document.querySelectorAll(".toc a")];
  const targets = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  function onScroll() {
    let cur = 0;
    targets.forEach((t, i) => { if (t.getBoundingClientRect().top < window.innerHeight * 0.3) cur = i; });
    links.forEach((a, i) => a.classList.toggle("active", i === cur));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- copy BibTeX ----------
  const copy = document.getElementById("copy-bib");
  if (copy) copy.addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("bib").textContent).then(() => {
      copy.textContent = "Copied"; setTimeout(() => (copy.textContent = "Copy"), 1500);
    }).catch(() => {});
  });

  // ---------- simulation reel ----------
  (function () {
    const reel = document.getElementById("sim-reel");
    if (!reel) return;
    const ROWS = [
      [["lift_bottle", "u", "Lift (Bottle)"], ["lift_can", "u", "Lift (Can)"], ["place_bottle", "u", "Place (Bottle)"], ["classify", "u", "Classify"], ["insert_hole", "u", "Insert (Hole)"], ["insert_hdmi", "u", "Insert (HDMI)"]],
      [["insert_tube", "u", "Insert (Tube)"], ["pull_key", "u", "Pull (Key)"], ["grasp_chip", "n", "Grasp (Chip)"], ["insert_usb", "n", "Insert (USB)"], ["insert_screw", "n", "Insert (Screw)"], ["place_gears", "n", "Place (Gears)"]],
      [["unstack_bowl", "n", "Unstack (Bowl)"], ["handover_cup", "n", "Handover (Cup)"], ["stack_cups", "n", "Stack (Cups)"], ["stack_plates", "n", "Stack (Plates)"], ["stack_bowls", "n", "Stack (Bowls)"], ["unstack_cup", "n", "Unstack (Cup)"]],
    ];
    const tile = ([id, b, name]) => `<div class="reel-tile ${b}"><video muted loop playsinline preload="none" poster="assets/cats/sim/${id}.jpg" src="assets/cats/sim/${id}.mp4"></video><span><i></i>${name}</span></div>`;
    const rows = ROWS.map((r, k) => {
      const row = document.createElement("div");
      row.className = "reel-row";
      row.innerHTML = `<div class="reel-track">${r.map(tile).join("")}${r.map(tile).join("")}</div>`;
      reel.appendChild(row);
      return { el: row, dir: k % 2 ? -1 : 1, speed: 26 + k * 6, pos: 0, hold: 0 };
    });
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const half = (r) => r.el.scrollWidth / 2;
    rows.forEach((r) => {
      const el = r.el, pause = (ms) => { r.hold = performance.now() + ms; };
      el.addEventListener("mouseenter", () => { r.hover = true; });
      el.addEventListener("mouseleave", () => { r.hover = false; pause(600); });
      el.addEventListener("wheel", () => pause(2500), { passive: true });
      el.addEventListener("touchstart", () => pause(3000), { passive: true });
      el.addEventListener("scroll", () => { if (r.hover || performance.now() < r.hold) r.pos = el.scrollLeft; }, { passive: true });
      // mouse drag to scroll on desktop; touch uses native panning
      let sx = 0, sl = 0, drag = false;
      el.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; drag = true; sx = e.clientX; sl = el.scrollLeft; el.classList.add("dragging"); el.setPointerCapture(e.pointerId); });
      el.addEventListener("pointermove", (e) => { if (!drag) return; el.scrollLeft = sl - (e.clientX - sx); r.pos = el.scrollLeft; });
      const end = () => { if (!drag) return; drag = false; el.classList.remove("dragging"); pause(1500); };
      el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    });
    let visible = false, last = 0, started = false;
    function start() {
      if (started) return; started = true;
      rows.forEach((r) => { if (r.dir < 0) { r.pos = half(r) - 1; r.el.scrollLeft = r.pos; } });
    }
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (visible && !still) rows.forEach((r) => {
        const h = half(r);
        if (!r.hover && now > r.hold) r.pos += r.dir * r.speed * dt;
        if (r.pos >= h) r.pos -= h; else if (r.pos < 0) r.pos += h;
        if (!r.hover && now > r.hold) r.el.scrollLeft = r.pos;
        else if (r.el.scrollLeft >= h) { r.el.scrollLeft -= h; r.pos = r.el.scrollLeft; } else if (r.el.scrollLeft <= 0) { r.el.scrollLeft += h; r.pos = r.el.scrollLeft; }
      });
      requestAnimationFrame(tick);
    }
    new IntersectionObserver((ents) => {
      visible = ents[0].isIntersecting;
      if (visible) start();
      reel.querySelectorAll("video").forEach((v) => { if (visible) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause(); });
    }, { rootMargin: "200px 0px" }).observe(reel);
    requestAnimationFrame(tick);
  })();

  // ---------- framework explorers ----------
  (function () {
    const FIGS = {
      "fx-overview": { steps: [
        { k: "1", t: "One RGB-D demonstration", s: "what to do", r: [2.6, 13.6, 17.8, 73.6],
          d: "A single human RGB-D demonstration of the task. CaTS tracks the hand and the object and splits the demonstration into ordered stages, here Approach, Twist, Verify and Lift.",
          subs: [
            { t: "Hand and object tracking", r: [3.5, 31.6, 17.0, 41.8], d: "The hand branch propagates hand masks (SAM 2.1), estimates 2D keypoints (RTMPose) and lifts them to 3D joints with local depth; the object branch segments targets (SAM3) and estimates 6-DoF poses." },
            { t: "Demonstration stages", r: [2.6, 73.5, 17.8, 12.5], d: "Changes in hand–object relative motion and contact divide the demonstration into stages, each with a subgoal, a motion intent and the contacts to establish, maintain or release." } ] },
        { k: "2", t: "CaTS agent", s: "plan and supervise", r: [21.3, 13.6, 24.3, 73.6],
          d: "At planning time an agent turns the demonstration into a robot stage plan and writes a tactile supervisor for every stage that depends on contact.",
          subs: [
            { t: "Task decomposition", r: [22.0, 23.3, 23.0, 14.9], d: "Mechanism priors expand the demonstrated Twist into Press & Twist and Lift & Twist, which a child-resistant cap requires. The robot plan becomes Approach → Press & Twist → Lift & Twist → Lift." },
            { t: "Supervisor synthesis", r: [22.0, 40.4, 23.0, 19.0], d: "The agent reads tactile-pattern priors, physics-grounded patterns with a fixed meaning, and composes them into stage supervisors." },
            { t: "Rotation & Release Guards", r: [22.1, 59.5, 22.6, 23.2], d: "Rotation Guard watches the marker-flow trend to detect when the cap engages during Press & Twist. Release Guard watches the force signal to confirm the cap is free to lift." } ] },
        { k: "3", t: "Executable program", s: "local runtime", r: [46.5, 13.6, 28.7, 73.6],
          d: "The stage plan and its supervisors are compiled once into an ordinary program. From here on, no foundation model is called during execution.",
          subs: [
            { t: "Stage plan + supervisor calls", r: [47.7, 23.9, 26.5, 36.9], d: "Each stage is a function call guarded by its supervisor: press_twist runs until the cap is engaged, lift_twist until rotation is complete, and a probe decides whether to lift or retry with a bounded number of attempts." },
            { t: "Embedded tactile supervision", r: [47.7, 63.2, 26.5, 19.9], d: "At every control step raw tactile data are encoded into contact patterns, the active stage supervisor evaluates them, and its result drives the program's control flow." } ] },
        { k: "4", t: "Tactile-guided execution", s: "closed loop on the robot", r: [76.1, 13.6, 21.6, 73.6],
          d: "The robot runs the program with live touch in the loop: Press & Twist, Lift & Twist, then Lift Cap, each stage ending when its tactile condition holds.",
          subs: [
            { t: "Robot stages", r: [77.0, 27.5, 20.6, 60.0], d: "The fingertip's tactile image is checked locally at every step, so a stage advances on contact evidence rather than on a fixed timer." },
            { t: "Live tactile loop", r: [49.5, 80.5, 38.5, 15.0], d: "Live tactile observations flow back into the program's embedded supervision, closing the feedback loop on the robot itself." } ] },
      ] },
      "fx-pipeline": { steps: [
        { k: "A", t: "Demo-to-robot plan adaptation", s: "demonstration → robot stage plan", r: [0.5, 0.5, 51.5, 72.3],
          d: "Turns the task, the scene and one human RGB-D demonstration into a robot stage plan P adapted to the object, the scene and the robot.",
          subs: [
            { t: "Inputs", r: [1.7, 7.7, 49.4, 14.1], d: "A task description (open the child-resistant cap), the robot's scene, and one human RGB-D demonstration." },
            { t: "Demo processing", r: [1.7, 22.4, 49.4, 14.3], d: "The demonstration is segmented into stages with a motion intent per stage. For grasping stages, the human contact location, closing axis and approach direction are extracted, and only GraspGen-X robot grasps consistent with them are kept." },
            { t: "Plan adaptation & expansion", r: [1.4, 39.4, 49.7, 22.5], d: "The agent maps human stages to robot stages using internal priors, for example splitting Twist into Press & Twist and Lift & Twist to satisfy the cap mechanism." },
            { t: "Robot stage plan P", r: [1.4, 62.7, 49.7, 8.7], d: "Each robot stage specifies a goal, TCP targets, a gripper command and a contact requirement, such as keeping top or side contact while twisting to unseal." } ] },
        { k: "B", t: "Hierarchical tactile supervision", s: "raw touch → patterns → supervisors", c: "c-b", r: [0.4, 73.0, 51.6, 27.0],
          d: "Three layers link agent-driven supervisor synthesis at planning time with local tactile evaluation at execution time. Because L2 patterns have a fixed physical meaning, one supervision program runs unchanged across different tactile sensors.",
          subs: [
            { t: "Stage context", r: [11.4, 73.0, 28.0, 5.1], d: "Each stage hands its goal, motion and expected contact change to the tactile hierarchy, so supervisors are written for that stage specifically." },
            { t: "L1 · raw observations", r: [1.1, 84.5, 14.3, 14.2], d: "Raw tactile images (RGB) and marker coordinates from the visuotactile sensor." },
            { t: "L2 · physics-grounded patterns", r: [17.4, 84.5, 16.9, 14.2], d: "Patterns such as normal force, torque, contact distribution and marker flow. The agent reads their definitions while planning; a unified encoder fills in their values at run time." },
            { t: "L3 · stage supervisors", r: [36.2, 84.5, 15.1, 14.2], d: "Stage-specific supervisors composed from L2 patterns, such as Slip, Rotate and Jam Guards." } ] },
        { k: "C", t: "Program synthesis & execution", s: "compile once, run locally", r: [56.2, 0.5, 43.6, 99.5],
          d: "The stage plan and the supervisors compile into one program that governs bounded responses and stage transitions on the robot, with no further model calls.",
          subs: [
            { t: "Compile once", r: [57.0, 9.0, 42.0, 24.1], d: "Per stage, the agent synthesizes a bounded response set and a visual-plus-tactile supervisor, then assembles them with transition logic into the program Π." },
            { t: "Local closed-loop execution", r: [57.2, 36.8, 41.9, 61.8], d: "The compiled program runs on the robot; all feedback processing is local." },
            { t: "Active stage", r: [59.4, 46.1, 37.6, 6.0], d: "At any moment one stage is active, carrying its plan, supervisor, responses and transition logic." },
            { t: "Observations", r: [59.2, 53.9, 14.4, 17.7], d: "Vision, raw touch and the tactile patterns encoded from it at every control step." },
            { t: "Stage supervisor", r: [74.1, 54.1, 14.2, 17.5], d: "Visual and tactile supervisors evaluate the observations together with robot state and memory." },
            { t: "Response & transition", r: [60.5, 74.2, 35.4, 5.6], d: "The supervisor selects a bounded response, and the program moves to the next stage when its transition condition holds." } ] },
      ] },
    };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Object.entries(FIGS).forEach(([id, cfg]) => {
      const root = document.getElementById(id);
      if (!root) return;
      const stage = root.querySelector(".fx-stage"), view = root.querySelector(".fx-view"), hole = root.querySelector(".fx-hole");
      const stepsEl = root.querySelector(".fx-steps"), subsEl = root.querySelector(".fx-subs"), detail = root.querySelector(".fx-detail");
      const bar = root.querySelector(".fx-bar i"), play = root.querySelector(".fx-play"), reset = root.querySelector(".fx-reset");
      stepsEl.style.setProperty("--n", cfg.steps.length);
      let cur = { si: -1, bi: -1 }, timer = null, tourIdx = 0, scale = 1;
      const intro = `<div><h4>${id === "fx-overview" ? "From one demonstration to tactile-guided execution" : "CaTS pipeline"}</h4><p>${id === "fx-overview"
        ? "CaTS turns one human RGB-D demonstration into a robot stage plan, has an agent synthesize a tactile supervisor for each stage, and compiles both into a local program that closes the feedback loop on the robot."
        : "(A) Demo-to-robot plan adaptation. (B) The three-layer tactile hierarchy. (C) The stage plan and supervisors compile into a local program that governs bounded responses and stage transitions."}</p></div>`;
      cfg.steps.forEach((st, si) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "fx-step " + (st.c || ""); b.setAttribute("aria-pressed", "false");
        b.innerHTML = `<span class="k">${st.k}</span><b>${st.t}</b><small>${st.s}</small>`;
        b.addEventListener("click", () => { stopTour(); (cur.si === si && cur.bi < 0) ? select(-1, -1) : select(si, -1); });
        stepsEl.appendChild(b);
      });
      function frame(r) {
        const [x, y, w, h] = r;
        scale = Math.max(1, Math.min(2.6, 0.92 * Math.min(100 / w, 100 / h)));
        let tx = 50 - (x + w / 2) * scale, ty = 50 - (y + h / 2) * scale;
        tx = Math.min(0, Math.max(100 - 100 * scale, tx)); ty = Math.min(0, Math.max(100 - 100 * scale, ty));
        view.style.transform = `translate(${tx}%, ${ty}%) scale(${scale})`;
        view.style.setProperty("--s", scale);
        Object.assign(hole.style, { left: x + "%", top: y + "%", width: w + "%", height: h + "%" });
      }
      function select(si, bi) {
        cur = { si, bi };
        [...stepsEl.children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === si)));
        if (si < 0) {
          root.classList.remove("on"); stage.classList.remove("zoomed");
          view.style.transform = ""; view.style.setProperty("--s", 1); scale = 1;
          subsEl.innerHTML = ""; detail.innerHTML = intro; return;
        }
        const st = cfg.steps[si], it = bi < 0 ? st : st.subs[bi];
        subsEl.innerHTML = st.subs.map((s, i) => `<button type="button" class="fx-sub" aria-pressed="${i === bi}" style="animation-delay:${i * 50}ms">${s.t}</button>`).join("");
        [...subsEl.children].forEach((b, i) => b.addEventListener("click", () => { stopTour(); select(si, cur.si === si && cur.bi === i ? -1 : i); }));
        root.classList.add("on"); stage.classList.add("zoomed");
        frame(it.r);
        detail.innerHTML = `<div><h4>${st.k} · ${bi < 0 ? st.t : st.t + " → " + it.t}</h4><p>${it.d}</p></div>`;
      }
      // click the figure: zoom out if zoomed into the clicked spot's own region, else go to the smallest region under the cursor
      stage.addEventListener("click", (e) => {
        stopTour();
        const rc = stage.getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(view).transform);
        const px = ((e.clientX - rc.left) - m.e) / m.a / rc.width * 100, py = ((e.clientY - rc.top) - m.f) / m.d / rc.height * 100;
        const inside = (r) => px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3];
        let best = null;
        cfg.steps.forEach((st, si) => {
          if (inside(st.r) && (!best || st.r[2] * st.r[3] < best.a)) best = { si, bi: -1, a: st.r[2] * st.r[3] };
          st.subs.forEach((s, bi) => { if (inside(s.r) && (!best || s.r[2] * s.r[3] < best.a)) best = { si, bi, a: s.r[2] * s.r[3] }; });
        });
        if (!best || (best.si === cur.si && best.bi === cur.bi)) select(-1, -1); else select(best.si, best.bi);
      });
      reset.addEventListener("click", () => { stopTour(); select(-1, -1); });
      // guided tour through every step and its components
      const tour = []; cfg.steps.forEach((st, si) => { tour.push([si, -1]); st.subs.forEach((_, bi) => tour.push([si, bi])); });
      const DWELL = 3600;
      function stopTour() { if (timer) { clearInterval(timer); timer = null; } play.textContent = "▶ Walk through"; bar.style.transition = "none"; bar.style.width = "0"; }
      function stepTour() {
        if (tourIdx >= tour.length) { stopTour(); select(-1, -1); return; }
        const [si, bi] = tour[tourIdx++]; select(si, bi);
        bar.style.transition = "none"; bar.style.width = (100 * (tourIdx - 1) / tour.length) + "%"; void bar.offsetWidth;
        bar.style.transition = `width ${DWELL}ms linear`; bar.style.width = (100 * tourIdx / tour.length) + "%";
      }
      function startTour() { stopTour(); tourIdx = 0; play.textContent = "❚❚ Pause"; stepTour(); timer = setInterval(stepTour, DWELL); }
      play.addEventListener("click", () => (timer ? stopTour() : startTour()));
      select(-1, -1);
      // the overview tours itself once when it first comes into view
      if (id === "fx-overview" && !still) {
        let toured = false;
        const io = new IntersectionObserver((ents) => {
          if (ents[0].isIntersecting && !toured) { toured = true; setTimeout(() => { if (cur.si < 0) startTour(); }, 600); }
          else if (!ents[0].isIntersecting && timer) stopTour();
        }, { threshold: 0.6 });
        io.observe(stage);
      }
    });
  })();
})();
