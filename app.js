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
  }, { threshold: 0.2 });
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
})();
