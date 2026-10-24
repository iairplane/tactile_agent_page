'use strict';

const stages = [
  {id:'approach',n:1,title:'Approach',roles:['plan'],description:'The demonstration approaches the cap. The robot plans its own feasible approach.'},
  {id:'grasp',n:2,title:'Grasp & press',roles:['relation','touch'],description:'Relative contact geometry establishes the grasp. A fresh contact check and press response gate the robot’s first turn.'},
  {id:'twist',n:3,title:'Twist',roles:['relation','touch'],description:'Rotate about the bottle axis while maintaining contact. Continue through a bounded twist segment.'},
  {id:'reset',n:4,title:'Reset & regrasp',roles:['plan','relation','touch'],note:'Return to twist',description:'Unload, reset the wrist, and regrasp. A new baseline and press check prepare the next twist. The robot chooses its own number of cycles.'},
  {id:'release',n:5,title:'Verify release',roles:['relation','touch'],description:'The demonstrated release-check moment. In the recorded robot run, retained contact and fresh low resistance windows must pass stationary confirmation.'},
  {id:'lift',n:6,title:'Lift cap',roles:['plan','relation','touch'],description:'Lift along the bottle axis only after release is verified. The recorded robot lifts the cap by 30 mm.'},
  {id:'place',n:7,title:'Place aside',roles:['plan'],note:'Human demonstration only',description:'The human places the cap aside. The recorded robot sequence ends at cap lift; placement is not part of that recording.'}
];
const roleNames={plan:'Motion planning',relation:'Relative geometry',touch:'Tactile supervision'};
const topRow=document.getElementById('stage-row-top');
const bottomRow=document.getElementById('stage-row-bottom');
stages.forEach(stage=>{
  const button=document.createElement('button');
  button.type='button';button.className='stage-node';button.dataset.stage=stage.id;
  button.setAttribute('aria-label',`${stage.n}. ${stage.title}. ${stage.roles.map(r=>roleNames[r]).join(', ')}. Watch stage.`);
  button.innerHTML=`<video class="ambient" muted loop playsinline preload="none" poster="assets/stage-${stage.id}.jpg" src="assets/stage-${stage.id}.mp4" aria-hidden="true"></video><h3><span>${stage.n}.</span>${stage.title}</h3><span class="stage-roles" aria-hidden="true">${stage.roles.map(r=>`<i class="${r}-dot"></i>`).join('')}</span><span class="node-note">${stage.note||'&nbsp;'}</span>`;
  if(stage.n<=4) topRow.append(button); else bottomRow.prepend(button);
  button.addEventListener('click',()=>openStage(stage));
});

const stageDialog=document.getElementById('stage-dialog');
const stagePlayer=document.getElementById('stage-player');
function openStage(stage){
  document.getElementById('stage-dialog-title').textContent=`${stage.n}. ${stage.title}`;
  document.getElementById('stage-dialog-description').textContent=stage.description;
  stagePlayer.src=`assets/stage-${stage.id}.mp4`;
  stagePlayer.poster=`assets/stage-${stage.id}.jpg`;
  stageDialog.showModal();stagePlayer.play().catch(()=>{});
}
document.getElementById('close-stage').addEventListener('click',()=>stageDialog.close());
stageDialog.addEventListener('close',()=>stagePlayer.pause());
stageDialog.addEventListener('click',event=>{if(event.target===stageDialog){const r=stageDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)stageDialog.close();}});

let motionPaused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ambientVideos=[...document.querySelectorAll('video.ambient')];
const visibleVideos=new Set();
const motionButton=document.getElementById('motion-toggle');
function setMotionState(){motionButton.textContent=motionPaused?'Play motion':'Pause motion';motionButton.setAttribute('aria-pressed',String(motionPaused));for(const v of ambientVideos){if(!motionPaused&&visibleVideos.has(v)){v.muted=true;v.play().catch(()=>{});}else v.pause();}}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visibleVideos.add(entry.target);else visibleVideos.delete(entry.target);}setMotionState();},{threshold:0.12});
ambientVideos.forEach(v=>observer.observe(v));
motionButton.addEventListener('click',()=>{motionPaused=!motionPaused;setMotionState();});
setMotionState();
document.addEventListener('visibilitychange',()=>{if(document.hidden)ambientVideos.forEach(v=>v.pause());else setMotionState();});
const perceptionVideos=[...document.querySelectorAll('.perception-video')];
perceptionVideos[0].addEventListener('timeupdate',()=>{for(const v of perceptionVideos.slice(1)){if(!v.paused&&Math.abs(v.currentTime-perceptionVideos[0].currentTime)>.14)v.currentTime=perceptionVideos[0].currentTime;}});

const film=document.getElementById('film');
document.querySelectorAll('[data-film-time]').forEach(button=>button.addEventListener('click',()=>{film.currentTime=Number(button.dataset.filmTime);film.scrollIntoView({behavior:motionPaused?'instant':'smooth',block:'center'});film.play().catch(()=>{});}));
document.querySelector('a[href="#overview-film"]').addEventListener('click',()=>film.play().catch(()=>{}));

const explanations={1:'A fresh contact check and press response are required before each twist.',2:'Turn about the cap axis while checking that contact is retained.',3:'A prior resistance peak, fresh low windows, retained contact, and stationary confirmation permit the lift.',4:'Unload, reset the wrist, and regrasp. Establish a new baseline before the next turn.'};
function selectPolicy(step){document.querySelectorAll('[data-policy-step]').forEach(b=>{const active=Number(b.dataset.policyStep)===step;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});document.querySelectorAll('[data-code-step]').forEach(line=>line.classList.toggle('highlight',Number(line.dataset.codeStep)===step));document.getElementById('policy-explanation').textContent=explanations[step];}
document.querySelectorAll('[data-policy-step]').forEach(button=>button.addEventListener('click',()=>selectPolicy(Number(button.dataset.policyStep))));
selectPolicy(1);

const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectTab(tab){tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;const panel=document.getElementById(t.getAttribute('aria-controls'));panel.hidden=!selected;if(!selected)panel.querySelectorAll('video').forEach(v=>v.pause());});}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectTab(tabs[next]);tabs[next].focus();}});});

const robot=document.getElementById('robot-video');
const offset=3.4357;
let tactileData=null;
const svgNS='http://www.w3.org/2000/svg';
function svgElement(tag,attrs,text){const e=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=text;return e;}
const plot=document.getElementById('signal-plot');
const px=t=>48+t/225*405,py=v=>250-v/1.25*210;
function buildPlot(){
  plot.replaceChildren();
  for(const value of[0,.4,.8,1.2]){plot.append(svgElement('line',{x1:48,x2:453,y1:py(value),y2:py(value),stroke:'#e0e4e6','stroke-width':1}));plot.append(svgElement('text',{x:36,y:py(value)+4,'text-anchor':'end',fill:'#7d878e','font-size':12},value.toFixed(1)));}
  for(const time of[0,60,120,180,225])plot.append(svgElement('text',{x:px(time),y:274,'text-anchor':'middle',fill:'#7d878e','font-size':12},String(time)));
  plot.append(svgElement('text',{x:250,y:300,'text-anchor':'middle',fill:'#7d878e','font-size':12},'Action-log time (s)'));
  const threshold=svgElement('g',{id:'release-threshold',opacity:'.35'});
  threshold.append(svgElement('line',{x1:px(182.9),x2:px(225),y1:py(tactileData.release.threshold),y2:py(tactileData.release.threshold),stroke:'#d94b20','stroke-dasharray':'4 4','stroke-width':1.5}));
  threshold.append(svgElement('text',{x:450,y:py(tactileData.release.threshold)-10,'text-anchor':'end',fill:'#b55536','font-size':11},'Release limit 0.386'));
  plot.append(threshold);
  tactileData.samples.forEach((s,i)=>{if(s.phase==='pre_press_baseline')plot.append(svgElement('line',{x1:px(s.time_s),x2:px(s.time_s),y1:45,y2:250,stroke:'#d8dddf','stroke-dasharray':'3 5','stroke-width':1}));const point=svgElement('circle',{cx:px(s.time_s),cy:py(s.value),r:4.6,fill:'#d5dadc',id:`window-${i}`});point.append(svgElement('title',{},`${s.time_s.toFixed(2)} s · ${s.phase.replaceAll('_',' ')} · ${s.value.toFixed(3)}`));plot.append(point);});
  plot.append(svgElement('line',{id:'playback-cursor',x1:48,x2:48,y1:34,y2:251,stroke:'#d94b20','stroke-width':1.5,opacity:0}));
  updateRobotEvidence();
}
const phaseNames={pre_press_baseline:'Fresh baseline',press_verify:'Press response',twist:'Twist response',unload_check:'Unload window'};
function updateRobotEvidence(){
  if(!tactileData)return;
  const t=Math.max(0,robot.currentTime-offset);
  let latest=-1;tactileData.samples.forEach((s,i)=>{const measured=s.time_s<=t;if(measured)latest=i;const point=document.getElementById(`window-${i}`);point.setAttribute('fill',measured?(s.release_phase?'#328166':'#d94b20'):'#d5dadc');point.setAttribute('r','4.6');});
  const cursor=document.getElementById('playback-cursor');cursor.setAttribute('x1',String(px(Math.min(t,225))));cursor.setAttribute('x2',String(px(Math.min(t,225))));cursor.setAttribute('opacity',robot.currentTime>0?'1':'0');
  document.getElementById('release-threshold').setAttribute('opacity',t>=182.89?'1':'.35');
  let label='Approach and establish contact';let condition='Each regrasp establishes a fresh baseline.';
  const events=tactileData.events.filter(e=>e.time_s<=t);const event=events.at(-1);
  if(event){if(event.operation.startsWith('twist_batch'))label=event.state==='start'?'Twist about the cap axis':'Check contact after the twist';else if(event.operation.startsWith('wrist_reset'))label='Reset the wrist';else if(event.operation==='regrasp_close')label='Regrasp and re-establish contact';else if(event.operation==='release_verify')label='Release verified';else if(event.operation==='lift_released_cap')label=event.state==='passed'?'Cap lifted · 30 mm':'Lift the released cap';}
  if(latest>=0){const s=tactileData.samples[latest];document.getElementById(`window-${latest}`).setAttribute('r','6.4');document.getElementById('signal-value').textContent=s.value.toFixed(3);document.getElementById('signal-phase').textContent=`${s.event_index===108?'Stationary confirmation':(phaseNames[s.phase]||s.phase)} · segment ${s.segment} · ${s.time_s.toFixed(1)} s`;if(s.phase==='press_verify')condition='A verified press response permits the next twist.';if(s.phase==='unload_check')condition='Unload before resetting and regrasping.';if(s.phase==='twist')condition=s.release_phase?'Check low resistance while retaining contact.':'Keep contact throughout the twist.';}else{document.getElementById('signal-value').textContent='—';document.getElementById('signal-phase').textContent='No measured window yet';}
  if(t>=tactileData.release.time_s)condition='Fresh stationary verification passed. Lift permitted.';
  document.getElementById('robot-stage').textContent=robot.currentTime>0?label:'Recorded bottle execution · Run16';document.getElementById('signal-condition').textContent=condition;
}
(window.TACTILE_MEASURED_WINDOWS ? Promise.resolve({ok:true,json:()=>Promise.resolve(window.TACTILE_MEASURED_WINDOWS)}) : fetch('assets/bottle-windows.json')).then(r=>{if(!r.ok)throw Error('Missing tactile data');return r.json();}).then(data=>{tactileData=data;buildPlot();}).catch(()=>{document.getElementById('signal-condition').textContent='The recorded windows can be downloaded below.';plot.append(svgElement('text',{x:240,y:145,'text-anchor':'middle',fill:'#667078','font-size':16},'Recorded data unavailable in this view'));});
robot.addEventListener('timeupdate',updateRobotEvidence);robot.addEventListener('seeked',updateRobotEvidence);
document.querySelectorAll('[data-robot-time]').forEach(button=>button.addEventListener('click',()=>{robot.currentTime=Number(button.dataset.robotTime);document.querySelectorAll('[data-robot-time]').forEach(b=>b.classList.toggle('active',b===button));robot.play().catch(()=>{});updateRobotEvidence();}));
document.getElementById('robot-speed').addEventListener('change',event=>{robot.playbackRate=Number(event.target.value);});

const cup=document.getElementById('cup-video');
const cupSensors=[document.getElementById('cup-left'),document.getElementById('cup-right')];
function syncCup(force=false){for(const sensor of cupSensors){if(force||Math.abs(sensor.currentTime-cup.currentTime)>.1)sensor.currentTime=cup.currentTime;sensor.playbackRate=cup.playbackRate;}}
cup.addEventListener('play',()=>{syncCup(true);cupSensors.forEach(v=>v.play().catch(()=>{}));});
cup.addEventListener('pause',()=>cupSensors.forEach(v=>v.pause()));
cup.addEventListener('ended',()=>cupSensors.forEach(v=>v.pause()));
cup.addEventListener('seeked',()=>syncCup(true));cup.addEventListener('timeupdate',()=>syncCup());cup.addEventListener('ratechange',()=>syncCup());

// Size the task-graph connectors to the real media panels, including after font load.
function drawGraphConnectors(){
  const graph=document.getElementById('stage-graph');
  const svg=graph.querySelector('.graph-connectors');
  if(getComputedStyle(svg).display==='none')return;
  const origin=graph.getBoundingClientRect();
  svg.setAttribute('viewBox',`0 0 ${origin.width} ${origin.height}`);
  svg.querySelectorAll('g,text').forEach(e=>e.remove());
  const rect=id=>{const n=graph.querySelector(`[data-stage="${id}"]`);const v=n.querySelector('video').getBoundingClientRect();const b=n.getBoundingClientRect();return{left:v.left-origin.left,right:v.right-origin.left,top:v.top-origin.top,bottom:v.bottom-origin.top,cx:v.left-origin.left+v.width/2,cy:v.top-origin.top+v.height/2,fullBottom:b.bottom-origin.top};};
  const nodes=Object.fromEntries(stages.map(s=>[s.id,rect(s.id)]));
  const g=svgElement('g',{fill:'none',stroke:'#969b9f','stroke-width':1.5,'marker-end':'url(#graph-arrow)'});
  for(const [a,b]of[['approach','grasp'],['grasp','twist'],['twist','reset']])g.append(svgElement('path',{d:`M${nodes[a].right+3} ${nodes[a].cy}H${nodes[b].left-6}`}));
  g.append(svgElement('path',{d:`M${nodes.reset.cx} ${nodes.reset.top-2}V14H${nodes.twist.cx}V${nodes.twist.top-5}`}));
  const mid=(nodes.twist.fullBottom+nodes.release.top)/2;
  g.append(svgElement('path',{d:`M${nodes.twist.cx} ${nodes.twist.fullBottom+6}V${mid}H${nodes.release.cx}V${nodes.release.top-6}`}));
  for(const [a,b]of[['release','lift'],['lift','place']])g.append(svgElement('path',{d:`M${nodes[a].left-3} ${nodes[a].cy}H${nodes[b].right+6}`}));
  svg.append(g);
  svg.append(svgElement('text',{x:(nodes.reset.cx+nodes.twist.cx)/2,y:7,'text-anchor':'middle',fill:'#667078','font-size':14},'Repeat as needed'));
  svg.append(svgElement('text',{x:nodes.twist.cx-18,y:mid+5,'text-anchor':'end',fill:'#667078','font-size':14},'Check release'));
}
new ResizeObserver(drawGraphConnectors).observe(document.getElementById('stage-graph'));
document.fonts.ready.then(drawGraphConnectors);
