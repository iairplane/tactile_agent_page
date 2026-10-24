#!/usr/bin/env python3
"""Mux the rendered film, attach chapters, and publish self-contained provenance."""
from pathlib import Path
import hashlib, json, shutil, subprocess
import render_bottle_story as film
R=film.ROOT;P=film.WORK;A=R/'assets'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
chapters=['One demonstration','Human task','Video stage graph','Hand perception','Relative interaction','Agent planning','Tactile primitive tree','Task policy','Robot execution','Release verification','Framework summary']
metadata=[';FFMETADATA1','title=Tactile Agent: From Demonstration to Tactile-Supervised Action']
for (a,b,key),title in zip(film.SCENES,chapters):metadata+=['[CHAPTER]','TIMEBASE=1/1000',f'START={a*1000}',f'END={b*1000}',f'title={title}']
meta=P/'chapters.ffmeta';meta.write_text('\n'.join(metadata)+'\n')
out=A/'bottle-framework-film_EN.mp4'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-i',str(P/'bottle_framework_film_EN_silent.mp4'),'-i',str(P/'audio/narration.wav'),'-i',str(meta),'-map','0:v','-map','1:a','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','160k','-movflags','+faststart','-t','174',str(out)],check=True)
for ext in ['srt','vtt']:shutil.copyfile(P/f'audio/narration.{ext}',A/f'bottle-framework-film_EN.{ext}')
perception=json.loads((P/'assets/evidence.json').read_text())
manifest={
 'schema':'tactile-agent.framework-film.v1','created':'2026-10-24','language':'en','duration_s':174,'resolution':[1920,1080],'fps':30,
 'file':out.name,'bytes':out.stat().st_size,'sha256':sha(out),
 'reference_style':'Original white-background academic motion graphics inspired by the owner-supplied RAPID presentation; no reference assets or audio reused.',
 'audio':{'type':'Synthetic English neural narration','voice':'en-US-AriaNeural','words':343,'captions':'Word-timed, burned into video and provided as separate SRT/VTT','music':False},
 'chapters':[{'start_s':a,'end_s':b,'id':key,'title':title} for (a,b,key),title in zip(film.SCENES,chapters)],
 'human_source':{'path':str(film.DEMO.relative_to(film.SOURCE)),'sha256':sha(film.DEMO),'fps':15,'trim_first_frame':1110},
 'robot_source':{'path':str(film.ROBOT.relative_to(film.SOURCE)),'sha256':sha(film.ROBOT),'run':'Run16'},
 'video_nodes':[{'title':title,'badge':badge,'source_frames':[a,b],'trim_s':[(a-1110)/15,(b-1110)/15]} for title,badge,c,a,b in film.NODES],
 'perception':{'status':'Actual offline reprocessing on the same recorded demonstration, not historical live robot input','models':['SAM 2.1 Hiera Small','RTMPose-m Hand5 ONNX'],'prompts':'Manual initial hand and bottle boxes; SAM2 temporal propagation','source_frames':[1146,1248],'playback':0.5,'files':[]},
 'presentation':{'graph':'Seven semantic groups from eleven observed intervals; active node excerpts loop at1x; Twist↔Reset loop and Twist→Release check branch. Placement is human-only.','relative_geometry':'Conceptual retargeting diagram. Full cap yaw was not recovered from the symmetric black cap. Run16 used a reviewed robot-aligned cap frame.','primitive_tree':'Images, forces, torques shown as library channels. Bottle run uses raw Fz proxies; torque branch unselected.','policy':'Illustrative task-policy pseudocode, not a recording of an agent generating and deploying code.','robot':'Approach2.3x; twist/regrasp overview8.7x; final lift1x; captions in-frame.'},
 'release_evidence':{'source':'runs/live/medicine_bottle_execution_20261023_16_video_fast/action_log.json','units':'Session-relative raw SDK Fz proxy, not N or calibrated torque','peak':1.1020157608973933,'final_limit':0.3857055163140876,'candidate_windows':[.0773481817,.1152006566],'stationary':.05672473664418365,'contact':.3182583798223816,'contact_minimum':.015675945806702035,'rotation_deg':540,'resets':5,'lift_mm':30},
 'evidence_boundary':'Bottle starts upright. Robot ends after verified cap lift; no robot placement in this take. No synchronized tactile RGB was recorded for Run16. Trace shows measured discrete windows, not invented continuous samples.'
}
for k in ['rgb_crop','mask_crop','pose_crop']:
 p=P/'assets'/perception['perception_video'][k];manifest['perception']['files'].append({'file':str(p.relative_to(R)),'sha256':sha(p)})
(A/'bottle-framework-film-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(out)
