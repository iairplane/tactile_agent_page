const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const components = {
  observe: { kicker: '01 / Perception', title: 'Extract the interaction, preserve the evidence.', description: 'A fixed RGB-D camera records the human demonstration with aligned depth and timestamps. Segmentation and hand keypoints identify the target and interaction intervals. The recorded trajectory is evidence for understanding the task.', contract: 'Object tracks, hand keypoints, interaction intervals, and observation provenance.' },
  compile: { kicker: '02 / Task compiler', title: 'Turn a demonstration into a stage program.', description: 'Each stage carries an intended effect, a target strategy, preconditions, completion predicates, and a bounded recovery policy. Contact-critical stages retain the demonstrated hand–object relation; movement stages request a new plan. Current real-robot runners are task-specific.', contract: 'A task skill: ordered stages + interaction constraints + transition conditions.' },
  ground: { kicker: '03 / Relative geometry', title: 'Bind the relation to the live object.', description: 'Locate the object or task frame in the robot base, transfer the grasp relation, and adapt it to the installed gripper. Cup-rim contact and cap-axis interaction use task-specific geometry. Unobservable orientation and uncertain depth stay explicit.', contract: 'Robot-specific TCP candidates, grasp width, approach constraints, and live grounding evidence.' },
  execute: { kicker: '04 / Planning & control', title: 'Plan goals. Execute bounded actions.', description: 'The agent chooses stage-level goals from the current scene. MoveIt plans robot motion from measured state. A deterministic task-specific executor runs the actions and evaluates declared transitions. A language model is not the joint-level servo controller.', contract: 'Planned motion, measured completion, gripper state, and per-stage action receipts.' },
  touch: { kicker: '05 / Tactile supervision', title: 'Give each task the contact evidence it needs.', description: 'Sensor adapters preserve timestamps and baselines. Task profiles select contact geometry, load changes, or slip candidates. Temporal predicates tell the stage machine whether to continue, complete, recover, or hold. Each predicate is enabled only at its demonstrated qualification level.', contract: 'Task-specific, validity-aware predicates; the supervisor does not invent motion targets.' }
};
function selectComponent(key) {
  const data = components[key];
  $$('.flow-node, .supervisor-node').forEach((button) => {
    const active = button.dataset.component === key;
    button.classList.toggle('active', active);
    if (button.getAttribute('role') === 'tab') { button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; }
    else button.setAttribute('aria-pressed', String(active));
  });
  // Keep the main tab group reachable while the separate tactile control is selected.
  if (key === 'touch') $('#node-observe').tabIndex = 0;
  $('#detail-kicker').textContent = data.kicker;
  $('#detail-title').textContent = data.title;
  $('#detail-description').textContent = data.description;
  $('#detail-contract').replaceChildren(Object.assign(document.createElement('span'), { textContent: 'Output' }), document.createTextNode(data.contract));
  $('#architecture-detail').setAttribute('aria-labelledby', `node-${key}`);
}
$$('[data-component]').forEach((button) => button.addEventListener('click', () => selectComponent(button.dataset.component)));

function enableArrowTabs(groupSelector, attribute, callback) {
  const group = $(groupSelector);
  group.addEventListener('keydown', (event) => {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(document.activeElement);
    if (index === -1 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex].focus(); callback(tabs[nextIndex].dataset[attribute]);
  });
}
enableArrowTabs('.flow-main', 'component', selectComponent);

const taskData = {
  cup: {
    kicker: 'Task 01 / Nested cups', title: 'One rim.<br>One cup.', description: 'Transfer a side pinch onto the top rim of a stack of thin paper cups. The two fingertips contact different surfaces: one inside the rim, the other outside.', question: 'Is the contact pattern consistent with the intended rim grasp?', evidence: 'Recorded tactile images · Scripted correction', shadow: true, label: 'Cup experiment · 72.6 s · English captions', boundary: 'The robot probes at a lower height, unloads, retries 6 mm higher, and lifts about 67 mm. The retry is scripted; tactile images are recorded and assessed offline. Front RGB and operator review confirm one cup. The robot clip ends at lift/hold.',
    stages: [
      { name: 'Demonstrate', time: 8, role: 'Task intent', color: 'subdued', title: 'Read the human operation.', rule: 'Observe approach, rim pinch, separation and the subsequent intent.', description: 'The human demonstration includes later movement and release. These provide task structure; they are not all executed in the selected robot recording.' },
      { name: 'Transfer', time: 21.6, role: 'Relative pose', color: 'geometry', title: 'Keep the rim-pinch relation.', rule: 'Ground the pinch relative to the current top rim.', description: 'The intended interaction uses an inner finger and an outer finger. Their contact patterns need not be symmetric. The recorded showcase uses a reviewed robot grasp location.' },
      { name: 'Plan', time: 27.2, role: 'Agentic planning', color: 'agent', title: 'Choose stage goals for the robot.', rule: 'Approach and clearance are robot task policies.', description: 'The task program separates movement goals from the contact relation. MoveIt handles robot trajectories; the demonstration is not converted into a sequence of copied hand waypoints.' },
      { name: 'Probe & retry', time: 41.8, role: 'Scripted correction', color: 'geometry', title: 'Unload before correcting the grasp.', rule: 'Low probe → unload → raise 6 mm → close again.', description: 'This retry was deliberately scripted to expose the contact change. The synchronized tactile images were logged in shadow mode and assessed offline; they did not trigger the retry.' },
      { name: 'Lift & hold', time: 56.7, role: 'Observed result', color: 'agent', title: 'Lift the selected cup.', rule: 'The recorded robot sequence ends at lift / hold.', description: 'The robot lifts approximately 67 mm. Front RGB and operator review confirm one cup. This result is not evidence of an online tactile cup-count classifier.' }
    ]
  },
  bottle: {
    kicker: 'Task 02 / Press-and-turn cap', title: 'Press. Turn.<br>Know when to lift.', description: 'The bottle starts upright. The program engages the safety cap, turns around its task axis, and automatically resets and regrasps when wrist travel is exhausted.', question: 'Is contact retained, and has the resistance fallen enough to verify release?', evidence: 'Online tactile gates · Recorded relative force windows', shadow: false, label: 'Cap experiment · 66.0 s · English captions', boundary: 'Run16 executes 54 increments of 10°: 540° total, six 90° segments and five automatic wrist-reset / regrasp cycles. Fresh relative raw Fz windows support release verification before a 30 mm cap lift. The values are not calibrated force or torque; synchronized tactile RGB was not recorded in this run.',
    stages: [
      { name: 'Demonstrate', time: 4, role: 'Task intent', color: 'subdued', title: 'Identify the press-and-turn strategy.', rule: 'The bottle is already upright in this demonstration.', description: 'Human wrist resets reveal a repeated twist-and-regrasp strategy. The robot does not have to reproduce the exact number of human strokes.' },
      { name: 'Ground & approach', time: 19.5, role: 'Relative pose + planning', color: 'geometry', title: 'Work in the live cap frame.', rule: 'Use the cap center and bottle axis with a reviewed grasp direction.', description: 'The round cap does not provide a unique visual yaw. The agent plans the approach; contact and axial motion use the cap task frame.' },
      { name: 'Press verify', time: 27, role: 'Online tactile gate', color: 'tactile', title: 'Establish a fresh contact response.', rule: 'A baseline-relative response on either finger permits twisting.', description: 'The gate tolerates asymmetric contact. It uses raw SDK Fz changes relative to the current session baseline, rather than a claimed calibrated axial force.' },
      { name: 'Twist & regrasp', time: 36, role: 'Bounded execution + touch', color: 'tactile', title: 'Keep turning while contact is retained.', rule: 'At 90°: open → unload → reset → regrasp → baseline → repress.', description: 'Both fingers losing contact stops rotation. Wrist limits define the segment length; tactile supervision checks the interaction as the program performs five automatic regrasp cycles.' },
      { name: 'Verify & lift', time: 50, role: 'Online tactile gate', color: 'tactile', title: 'Verify release before lifting.', rule: 'Peak established + low fresh windows + retained contact + stationary verification.', description: 'After sufficient rotation, the resistance proxy falls while contact remains present. The stage machine records release_verified, then lifts the cap 30 mm.' }
    ]
  }
};
let currentTask = 'cup';
let currentStage = -1;
const taskVideo = $('#task-video');
function selectStage(index, seek = true) {
  currentStage = index;
  const stage = taskData[currentTask].stages[index];
  $$('#stage-selector button').forEach((button, i) => { button.classList.toggle('active', index === i); button.setAttribute('aria-pressed', String(index === i)); });
  $('#stage-detail').innerHTML = `<div><span class="tag ${stage.color}">${stage.role}</span><h4>${stage.title}</h4></div><p><strong>${stage.rule}</strong>${stage.description}</p>`;
  if (seek) {
    const seekAndPlay = () => { taskVideo.currentTime = stage.time; taskVideo.play().catch(() => {}); };
    if (taskVideo.readyState >= 1) seekAndPlay();
    else { taskVideo.addEventListener('loadedmetadata', seekAndPlay, { once: true }); taskVideo.load(); }
  }
}
function selectTask(key) {
  const task = taskData[key];
  taskVideo.pause(); currentTask = key; currentStage = -1;
  $$('.task-tabs button').forEach((button) => { const selected = button.dataset.task === key; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
  $('#task-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('#task-kicker').textContent = task.kicker;
  $('#task-title').innerHTML = task.title;
  $('#task-description').textContent = task.description;
  $('#task-question').textContent = task.question;
  $('#task-evidence').innerHTML = `<span class="evidence-dot${task.shadow ? ' shadow' : ''}"></span>${task.evidence}`;
  $('#task-boundary p').textContent = task.boundary;
  $('#task-video-label').textContent = task.label;
  taskVideo.poster = `assets/${key}-poster.jpg`;
  taskVideo.setAttribute('aria-label', `English ${key === 'cup' ? 'paper cup' : 'press-and-turn cap'} framework explainer`);
  taskVideo.querySelector('source').src = `assets/${key}-explainer.mp4`;
  $('#task-captions').src = `assets/${key}-captions.vtt`;
  taskVideo.load();
  $('#download-video').href = `assets/${key}-explainer.mp4`;
  $('#stage-selector').replaceChildren(...task.stages.map((stage, i) => {
    const button = document.createElement('button'); button.type = 'button'; button.innerHTML = `<b>0${i+1}</b>${stage.name}`; button.addEventListener('click', () => selectStage(i)); return button;
  }));
  selectStage(0, false);
}
$$('[data-task]').forEach((button) => button.addEventListener('click', () => selectTask(button.dataset.task)));
enableArrowTabs('.task-tabs', 'task', selectTask);
selectTask('cup');
taskVideo.addEventListener('timeupdate', () => {
  const stages = taskData[currentTask].stages;
  const stageIndex = stages.reduce((last, stage, i) => taskVideo.currentTime >= stage.time ? i : last, 0);
  if (stageIndex !== currentStage) selectStage(stageIndex, false);
});

const heroVideo = $('#hero-video');
const heroToggle = $('#hero-toggle');
let heroLoaded = false;
let manualPause = false;
async function playHero() {
  if (!heroLoaded) { heroVideo.querySelector('source').src = heroVideo.querySelector('source').dataset.src; heroVideo.load(); heroLoaded = true; }
  try { await heroVideo.play(); } catch { /* Poster and explicit play remain available. */ }
}
function heroButtonState() { const paused = heroVideo.paused; heroToggle.innerHTML = `${paused ? 'Play preview' : 'Pause preview'} <span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span>`; heroToggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} experiment preview`); }
heroVideo.addEventListener('play', heroButtonState); heroVideo.addEventListener('pause', heroButtonState);
heroToggle.addEventListener('click', () => { if (heroVideo.paused) { manualPause = false; playHero(); } else { manualPause = true; heroVideo.pause(); } });
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !manualPause && !reduceMotion.matches && !navigator.connection?.saveData) playHero(); else heroVideo.pause(); }, { threshold: .15 }); observer.observe(heroVideo);
}
reduceMotion.addEventListener('change', (event) => { if (event.matches) { manualPause = true; heroVideo.pause(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) { heroVideo.pause(); taskVideo.pause(); } });

const gates = {
  press: ['PRESS_VERIFY', 'Begin a bounded twist', 'A fresh baseline-relative response on either finger permits rotation. Retained contact remains a condition during twisting.'],
  lost: ['CONTACT_LOST', 'Stop rotation and hold', 'When both fingers lose contact presence, the task-specific program stops the twist. A tactile observation does not authorize an unplanned recovery motion.'],
  limit: ['WRIST_LIMIT', 'Unload, reset, and regrasp', 'At the reviewed 90° wrist limit, the program opens, unloads along the axis, resets the wrist, regrasps, records a new baseline, and presses again.'],
  release: ['RELEASE_CANDIDATE', 'Verify at rest, then lift', 'Sufficient rotation and an established peak are required. Fresh low-resistance windows with retained contact are followed by stationary verification before LIFT_CAP.']
};
$$('[data-gate]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-gate]').forEach((item) => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
  const [state, action, description] = gates[button.dataset.gate];
  $('#gate-result').innerHTML = `<span class="tag tactile">${state}</span><span aria-hidden="true">→</span><strong>${action}</strong><p>${description}</p>`;
}));

const svgNS = 'http://www.w3.org/2000/svg';
const frameworkVideo = $('#framework-video');
$$('[data-film-time]').forEach((button) => button.addEventListener('click', async () => {
  if (frameworkVideo.readyState < 1) await new Promise((resolve) => frameworkVideo.addEventListener('loadedmetadata', resolve, { once: true }));
  frameworkVideo.currentTime = Number(button.dataset.filmTime);
  heroVideo.pause(); taskVideo.pause();
  try { await frameworkVideo.play(); } catch { /* Native controls remain available. */ }
}));
frameworkVideo.addEventListener('play', () => { heroVideo.pause(); taskVideo.pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) frameworkVideo.pause(); });
function svgElement(name, attributes, text) { const element = document.createElementNS(svgNS, name); Object.entries(attributes).forEach(([key,value]) => element.setAttribute(key, value)); if (text !== undefined) element.textContent = text; return element; }
function drawSignal(data) {
  const chart = $('#signal-chart');
  const samples = data.samples.filter((sample) => Number.isFinite(sample.time_s) && Number.isFinite(sample.value));
  if (!samples.length) throw new Error('Missing measured signal samples');
  const left=45, right=623, top=24, bottom=262;
  const minTime=Math.min(...samples.map((s)=>s.time_s)), maxTime=Math.max(...samples.map((s)=>s.time_s));
  const maxValue=Math.max(1.2,...samples.map((s)=>s.value))*1.07;
  const x=(t)=>left+(t-minTime)/(maxTime-minTime||1)*(right-left);
  const y=(v)=>bottom-v/maxValue*(bottom-top);
  const label=(attrs,txt)=>svgElement('text',{fill:'#849086','font-family':'system-ui,sans-serif','font-size':10,...attrs},txt);
  for(const v of [0,.4,.8,1.2]) { chart.append(svgElement('line',{x1:left,y1:y(v),x2:right,y2:y(v),stroke:'#e7ece5','stroke-width':1})); chart.append(label({x:left-10,y:y(v)+4,'text-anchor':'end'},v.toFixed(1))); }
  const threshold=.386;
  chart.append(svgElement('line',{x1:left,y1:y(threshold),x2:right,y2:y(threshold),stroke:'#b9904d','stroke-width':1.5,'stroke-dasharray':'5 5'}));
  chart.append(label({x:right,y:y(threshold)-7,'text-anchor':'end',fill:'#a17b3a'},'final release threshold'));
  // Discrete measured windows only: a line would imply observations between samples.
  samples.forEach((s)=>{ const isRelease=s.release_phase === true; const point=svgElement('circle',{cx:x(s.time_s),cy:y(s.value),r:isRelease?4.5:3.5,fill:isRelease?'#247a7c':'#a36787','fill-opacity':.88,tabindex:0,role:'img','aria-label':`${s.phase}, time ${s.time_s.toFixed(1)} seconds, value ${s.value.toFixed(3)} relative raw units`}); point.append(svgElement('title',{},`${s.phase} · ${s.time_s.toFixed(1)} s · ${s.value.toFixed(3)} relative raw units`));chart.append(point);});
  for(let i=0;i<5;i++){const t=minTime+(maxTime-minTime)*i/4;chart.append(label({x:x(t),y:bottom+21,'text-anchor':'middle'},`${Math.round(t)} s`));}
  chart.append(label({x:(left+right)/2,y:bottom+43,'text-anchor':'middle'},'Time from action-log start'));
  const peak=samples.reduce((a,b)=>a.value>b.value?a:b);chart.append(label({x:Math.min(right-55,x(peak.time_s)+9),y:Math.max(15,y(peak.value)-10),fill:'#8f5776'},`peak ${peak.value.toFixed(3)}`));
  $('#signal-caption').textContent=`${samples.length} recorded windows · Dots are measurements; missing intervals are not synthesized. Green marks release checks.`;
}
fetch('assets/bottle-signal.json').then((response)=>{if(!response.ok)throw new Error('Signal file unavailable');return response.json();}).then(drawSignal).catch(()=>{
  $('#signal-caption').textContent='Signal windows could not be loaded. Recorded release evidence: peak 1.102; threshold 0.386; final fresh windows 0.077, 0.115 and 0.057.';
});
