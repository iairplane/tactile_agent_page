// CaTS project page: task player, animated charts, scroll reveal, table of contents.
(function () {
  "use strict";

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

  // ---------- simulation task grid (paper Fig. 5, CaTS per task) ----------
  const SIM = [
    ["UniVTAC", "Lift (Bottle)", 70.0], ["UniVTAC", "Lift (Can)", 63.3], ["UniVTAC", "Place (Bottle)", 66.7], ["UniVTAC", "Classify", 50.0],
    ["UniVTAC", "Insert (Hole)", 64.4, 1], ["UniVTAC", "Insert (HDMI)", 53.3], ["UniVTAC", "Insert (Tube)", 88.9, 1], ["UniVTAC", "Pull (Key)", 50.0, 1],
    ["NeoSim", "Grasp (Chip)", 56.7], ["NeoSim", "Pour (Ball)", 40.0], ["NeoSim", "Insert (USB)", 66.7], ["NeoSim", "Replug (Charger)", 46.7],
    ["NeoSim", "Insert (Screw)", 46.7], ["NeoSim", "Place (Gears)", 73.3], ["NeoSim", "Unstack (Bowl)", 56.7], ["NeoSim", "Handover (Cup)", 68.9, 1],
    ["NeoSim", "Stack (Cups)", 26.7], ["NeoSim", "Stack (Plates)", 80.0, 1], ["NeoSim", "Stack (Bowls)", 66.7], ["NeoSim", "Unstack (Cup)", 100.0, 1],
  ];
  const grid = document.getElementById("sim-grid");
  if (grid) {
    grid.innerHTML = SIM.map(([b, n, v, hl], i) =>
      `<div class="sim-card${hl ? " hl" : ""}" style="transition-delay:${i * 45}ms">
         <div class="bench ${b === "NeoSim" ? "neo" : "uni"}">${b}</div>
         <div class="task">${n}</div>
         <div class="pct" data-v="${v}">0.0%</div>
         <div class="mini"><i data-v="${v}"></i></div></div>`).join("");
  }

  // ---------- reveal + animate on scroll ----------
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countUp(el, v, delay) {
    if (reduce) { el.textContent = v.toFixed(1) + "%"; return; }
    const t0 = performance.now() + delay, dur = 1100;
    (function step(now) {
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (v * e).toFixed(1) + "%";
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("in");
      el.querySelectorAll(".bar-fill").forEach((f) => { f.style.width = f.dataset.v + "%"; });
      if (el.id === "sim-grid") {
        el.querySelectorAll(".pct").forEach((p, i) => countUp(p, +p.dataset.v, i * 45 + 200));
        el.querySelectorAll(".mini i").forEach((m) => { m.style.width = m.dataset.v + "%"; });
      }
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal, .bars, #sim-grid").forEach((el) => io.observe(el));

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
