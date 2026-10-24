#!/usr/bin/env python3
"""Reproducible English research film: original diagrams + recorded bottle evidence.
No robot access. Reads only saved recordings and offline perception outputs.
"""
from __future__ import annotations
import argparse, bisect, functools, json, math, subprocess, textwrap
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'production/bottle_story'
ASSETS=WORK/'assets'
SOURCE=ROOT.parent/'tactile_agent'
DEMO=SOURCE/'runs/live/medicine_bottle_demo_20261023_01/analysis/demo_trim_1110_1274.mp4'
ROBOT=SOURCE/'runs/live/medicine_bottle_robot_video_20261023_01/robot_execution_front_full.mp4'
W,H,FPS=1920,1080,30
DURATION=174
BG='#fafbf9'; WHITE='#ffffff'; INK='#233c43'; MUTED='#64777b'; LINE='#d8e0df'
CYAN='#007f89'; GOLD='#ae741c'; PINK='#98508b'; GREEN='#2e825b'; RED='#b95b59'
LIGHT={CYAN:'#e7f3f3',GOLD:'#fbf1df',PINK:'#f4eaf2',GREEN:'#e8f3ec',INK:'#edf1f1'}
SCENES=[(0,8,'hook'),(8,20,'demo'),(20,42,'graph'),(42,58,'perception'),(58,74,'relative'),(74,84,'planning'),(84,106,'tree'),(106,124,'code'),(124,146,'execution'),(146,164,'release'),(164,174,'outro')]
NODES=[
 ('Approach the cap','PLAN',CYAN,1119,1142),
 ('Grasp & press','RELATIVE + TOUCH',GOLD,1142,1152),
 ('Twist about the axis','RELATIVE + TOUCH',GOLD,1152,1183),
 ('Reset & regrasp','PLAN + RELATIVE',CYAN,1183,1189),
 ('Check for release','RELATIVE + TOUCH',PINK,1240,1248),
 ('Lift along the axis','PLAN + RELATIVE',CYAN,1248,1253),
 ('Place the cap aside','PLAN · HUMAN ONLY',CYAN,1253,1265),
]
CAPTIONS={
'hook':'One demonstration. Object-relative interaction. Task-specific tactile supervision.',
'demo':'The demonstration reveals a goal, contact relations, and a sequence of actions.',
'graph':'The agent assigns planning authority and interaction constraints to each stage.',
'perception':'Offline hand masks and hand keypoints make the interaction visible.',
'relative':'Preserve the contact relation, then adapt it to the robot gripper.',
'planning':'The agent plans reachable motion around the interaction constraints.',
'tree':'The task determines which tactile information becomes a transition condition.',
'code':'Selected primitives become explicit stage conditions and recovery rules.',
'execution':'The executor follows the stage conditions through twist and regrasp cycles.',
'release':'Fresh low-resistance windows with contact retained permit the cap lift.',
'outro':'Understand the intent. Transfer the interaction. Supervise with touch.'}

@functools.lru_cache(None)
def font(size,bold=False,mono=False):
 p='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf' if mono else '/usr/share/fonts/truetype/lato/Lato-'+('Bold' if bold else 'Regular')+'.ttf'
 return ImageFont.truetype(p,int(size))
def clamp(x):return max(0,min(1,x))
def ease(x):x=clamp(x);return x*x*(3-2*x)
def txt(im,x,y,s,size=32,color=INK,bold=False,anchor='la',mono=False,maxw=None):
 d=ImageDraw.Draw(im);f=font(size,bold,mono)
 if maxw:
  while d.textlength(s,font=f)>maxw and size>14:
   size-=1;f=font(size,bold,mono)
 d.text((x,y),s,font=f,fill=color,anchor=anchor)
def wrap(im,x,y,s,width=650,size=30,color=MUTED,bold=False,line=1.4):
 d=ImageDraw.Draw(im); words=s.split(); rows=[];row=''
 for word in words:
  test=(row+' '+word).strip()
  if d.textlength(test,font=font(size,bold))>width and row: rows.append(row);row=word
  else:row=test
 if row:rows.append(row)
 for i,row in enumerate(rows):txt(im,x,y+i*size*line,row,size,color,bold)
 return y+len(rows)*size*line

def panel(im,box,fill=WHITE,outline=LINE,r=20,width=2):ImageDraw.Draw(im).rounded_rectangle(tuple(map(int,box)),radius=r,fill=fill,outline=outline,width=width)
def pill(im,x,y,s,c=CYAN,size=22):
 d=ImageDraw.Draw(im);w=int(d.textlength(s,font=font(size,True)))+32
 panel(im,(x,y,x+w,y+size+22),LIGHT.get(c,'#f1f4f3'),None,r=11)
 txt(im,x+16,y+10,s,size,c,True)
 return w

def line(im,points,c=LINE,width=3,progress=1):
 d=ImageDraw.Draw(im)
 lengths=[math.dist(points[i],points[i+1]) for i in range(len(points)-1)];remaining=sum(lengths)*clamp(progress)
 for i,l in enumerate(lengths):
  if remaining<=0:break
  a,b=points[i],points[i+1];r=min(1,remaining/max(l,1));end=(a[0]+(b[0]-a[0])*r,a[1]+(b[1]-a[1])*r)
  d.line([a,end],fill=c,width=width);remaining-=l

def arrow(im,a,b,c=CYAN,width=4,progress=1):
 p=clamp(progress);end=(a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p)
 line(im,[a,end],c,width)
 if p>.1:
  ang=math.atan2(b[1]-a[1],b[0]-a[0]);r=13
  points=[end,(end[0]-r*math.cos(ang-.5),end[1]-r*math.sin(ang-.5)),(end[0]-r*math.cos(ang+.5),end[1]-r*math.sin(ang+.5))]
  ImageDraw.Draw(im).polygon(points,fill=c)

class Bank:
 def __init__(self):self.caps={};self.images={};self.last={}
 def frame(self,path,t=0):
  path=str(path)
  if path not in self.caps:
   c=cv2.VideoCapture(path)
   if not c.isOpened():raise RuntimeError('Missing recording: '+path)
   self.caps[path]=(c,c.get(cv2.CAP_PROP_FPS),0)
  c,fps,idx=self.caps[path];target=max(0,int(t*fps))
  if path in self.last and target==idx-1:return self.last[path]
  if target<idx-1 or target>idx+40:c.set(cv2.CAP_PROP_POS_FRAMES,target);idx=target
  im=self.last.get(path)
  while idx<=target:
   ok,bgr=c.read()
   if not ok:break
   im=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB));idx+=1
  if im is None:raise RuntimeError('Unreadable video '+path)
  self.caps[path]=(c,fps,idx);self.last[path]=im
  return im
 def still(self,path):
  path=str(path)
  if path not in self.images:self.images[path]=Image.open(path).convert('RGB')
  return self.images[path]
BANK=Bank()

@functools.lru_cache(64)
def rounded_mask(size,r):
 m=Image.new('L',size,0);ImageDraw.Draw(m).rounded_rectangle((0,0,size[0]-1,size[1]-1),r,fill=255);return m

def photo(im,source,box,crop=None,r=16):
 x,y,x2,y2=map(int,box);size=(x2-x,y2-y)
 if crop:source=source.crop(crop)
 p=ImageOps.fit(source,size,Image.Resampling.LANCZOS)
 im.paste(p,(x,y),rounded_mask(size,r))

def demo_frame(t):return BANK.frame(DEMO,min(10.93,max(0,t)))
def robot_frame(t):return BANK.frame(ROBOT,min(227.9,max(0,t)))
def demo_crop(im):return im.crop((190,90,615,465))

def header(im,chapter,title,subtitle=None):
 txt(im,78,37,'TACTILE AGENT',24,INK,True)
 txt(im,1842,37,chapter.upper(),21,MUTED,anchor='ra')
 ImageDraw.Draw(im).line((78,82,1842,82),fill=LINE,width=1)
 txt(im,78,120,title,55,INK,True)
 if subtitle:txt(im,80,193,subtitle,27,MUTED,maxw=1760)

SUBTITLES=[]
def footer(im,t,scene):
 d=ImageDraw.Draw(im)
 d.rectangle((0,966,W,H),fill=BG)
 d.line((78,963,1842,963),fill=LINE,width=1)
 text=CAPTIONS[scene]
 if SUBTITLES:
  text=next((s['text'] for s in SUBTITLES if s['start']<=t<s['end']),'')
 rows=textwrap.wrap(text,width=108)
 if len(rows)>2: rows=textwrap.wrap(text,width=120)
 for i,row in enumerate(rows[:2]):txt(im,960,990+i*34,row,27,INK,anchor='ma')
 d.rectangle((0,1075,int(W*t/DURATION),1079),fill=CYAN)

def card_caption(im,x,y,title,sub,c=CYAN):
 txt(im,x,y,title,32,INK,True);txt(im,x,y+47,sub,23,c)

def hook(im,t):
 txt(im,80,45,'TACTILE AGENT',25,CYAN,True)
 txt(im,80,120,'From one demonstration',66,INK,True)
 txt(im,80,198,'to a tactile-supervised skill.',66,INK,True)
 pill(im,80,296,'PRESS-AND-TURN CAP',GOLD)
 photo(im,demo_frame(2.2+t*.7),(80,390,922,878),crop=(150,90,640,440))
 photo(im,robot_frame(219.7+t),(998,390,1840,878))
 pill(im,108,412,'HUMAN DEMONSTRATION',CYAN,20)
 pill(im,1026,412,'ROBOT EXECUTION · 1×',GREEN,20)
 arrow(im,(934,630),(986,630),GOLD,4,ease(t/1.5))
 txt(im,1850,303,'Intent  /  Geometry  /  Touch',25,MUTED,anchor='ra')

def demo(im,t):
 header(im,'01 / observe','One demonstration. A structured task.','Goal: remove a press-and-turn cap from an upright bottle.')
 st=.6+min(t,9.733)
 photo(im,demo_frame(st),(80,260,1240,910))
 pill(im,108,285,'HUMAN DEMONSTRATION · 1×',CYAN,20)
 phases=[('Approach',.6),('Grasp + press',2.133),('Twist / regrasp',2.8),('Release + lift',8.667),('Place aside',9.533)]
 active=max(i for i,p in enumerate(phases) if st>=p[1])
 for i,(name,start) in enumerate(phases):
  y=300+i*111;c=CYAN if i in [0,4] else GOLD
  if i<4:line(im,[(1320,y+31),(1320,y+108)],LINE,3)
  ImageDraw.Draw(im).ellipse((1305,y,1335,y+30),fill=c if i<=active else LINE)
  txt(im,1360,y-3,name,32,INK if i<=active else MUTED,i==active)
  if i==active:txt(im,1360,y+43,'Current observed action',21,c)
 txt(im,1298,895,'Original demonstration: 11 intervals',22,MUTED)

def graph(im,t):
 header(im,'02 / understand','The agent turns the demonstration into stages.','Recorded action clips form video nodes. Active excerpts loop at 1×; repeated actions form a task loop.')
 boxes=[]
 for i in range(7):
  if i<4:x=80+i*450;y=265
  else:x=305+(i-4)*450;y=610
  boxes.append((x,y,x+410,y+290))
 for i in range(3):arrow(im,(boxes[i][2]+8,405),(boxes[i+1][0]-8,405),LINE,3)
 line(im,[(1210,555),(1210,582),(510,582),(510,600)],PINK,3)
 txt(im,910,560,'release candidate',18,PINK,anchor='ma')
 for i in [4,5]:arrow(im,(boxes[i][2]+8,752),(boxes[i+1][0]-8,752),LINE,3)
 # Explicit loop: reset returns to twist.
 line(im,[(1660,265),(1660,240),(1210,240),(1210,255)],GOLD,3,ease((t-8)/1))
 if t>8:txt(im,1425,219,'repeat as needed',19,GOLD,anchor='ma')
 active=min(6,int(max(0,t-1.0)/2.8))
 for i,(title,badge,c,a,b) in enumerate(NODES):
  x,y,x2,y2=boxes[i];isactive=i==active
  panel(im,(x,y,x2,y2),WHITE,c if isactive else LINE,width=4 if isactive else 2)
  source=(a-1110)/15+(t%max(.1,(b-a)/15)) if isactive else ((a+b)/2-1110)/15
  photo(im,demo_frame(source),(x+10,y+10,x2-10,y+173),crop=(230,135,585,430),r=11)
  pill(im,x+20,y+21,str(i+1).zfill(2),c,18)
  txt(im,x+20,y+184,title,27,INK,True,maxw=375)
  pill(im,x+20,y+231,badge,c,17)
  if i in [3,5]:txt(im,x2-24,y+244,'+ TOUCH',17,PINK,True,anchor='ra')
 txt(im,80,929,'PLAN · agent motion',21,CYAN)
 txt(im,580,929,'RELATIVE · object-frame geometry',21,GOLD)
 txt(im,1210,929,'TOUCH · transition conditions',21,PINK)


def perception_files():
 paths=list(ASSETS.glob('*pose*overlay*.png'))+list(ASSETS.glob('*keypoint*.png'))
 return paths

def perception(im,t):
 header(im,'03 / perceive','Make the hand–object relation visible.','The same recorded demonstration is reprocessed with segmentation and hand-pose estimation.')
 evidence=ASSETS/'evidence.json'
 info=json.loads(evidence.read_text()) if evidence.exists() else {}
 frames=info.get('perception',[])
 pv=info.get('perception_video')
 if pv:
  source_t=min(6.8,max(0,t-1)*.5)
  imgs=[BANK.frame(ASSETS/pv[k],source_t) for k in ['rgb_crop','mask_crop','pose_crop']]
  frame=pv['frame_start']+int(source_t*15)
 elif frames:
  p=frames[min(len(frames)-1,int(t/5)%len(frames))]
  imgs=[BANK.still(ASSETS/p[k]) for k in ['rgb','mask_overlay','pose_overlay']]
  frame=p.get('frame_index','')
 else:
  imgs=[demo_crop(demo_frame(2.5))]*3;frame='offline assets pending'
 labels=[('Recorded RGB','The hand engages the cap',INK),('Hand + object masks','SAM 2.1 · offline reprocessing',GOLD),('Hand keypoints','RTMPose Hand5 · offline reprocessing',CYAN)]
 for i,(title,desc,c) in enumerate(labels):
  x=80+i*605
  panel(im,(x,264,x+550,860),WHITE)
  photo(im,imgs[i],(x+14,278,x+536,725))
  txt(im,x+24,754,title,32,INK,True)
  txt(im,x+24,807,desc,22,c,maxw=500)
  if i<2:arrow(im,(x+558,500),(x+592,500),GOLD,4,ease((t-i*1.2)/1.2))
 txt(im,80,905,f'Same source frame: {frame}',22,MUTED)
 txt(im,1840,905,'Offline perception replay · 0.5×',22,MUTED,anchor='ra')


def axes(im,x,y,size=60):
 arrow(im,(x,y),(x+size,y),RED,4)
 arrow(im,(x,y),(x,y-size),GREEN,4)
 arrow(im,(x,y),(x-size*.55,y+size*.55),CYAN,4)
 txt(im,x+size+9,y-12,'x',20,RED);txt(im,x-6,y-size-27,'z',20,GREEN)

def relative(im,t):
 header(im,'04 / transfer','Transfer the interaction in the object frame.','Preserve contact location and direction; adapt the relation to the robot gripper.')
 info=json.loads((ASSETS/'evidence.json').read_text()) if (ASSETS/'evidence.json').exists() else {}
 pp=info.get('perception',[])
 src=BANK.still(ASSETS/pp[0]['pose_crop']) if pp else demo_crop(demo_frame(2.5))
 photo(im,src,(80,280,660,775))
 photo(im,robot_frame(28),(1260,280,1840,775),crop=(130,30,540,450))
 pill(im,102,300,'OBSERVED HUMAN CONTACT',GOLD,18)
 pill(im,1282,300,'ROBOT-SPECIFIC GRASP',CYAN,18)
 panel(im,(725,332,1195,722),LIGHT[GOLD],None)
 txt(im,960,369,'Interaction frame',35,GOLD,True,anchor='ma')
 # Original conceptual bottle / cap frame; not an inferred full object pose.
 d=ImageDraw.Draw(im);d.rounded_rectangle((889,491,1031,650),radius=22,fill='#fff',outline=GOLD,width=3)
 d.rounded_rectangle((878,461,1042,495),radius=10,fill='#ead6b6',outline=GOLD,width=3)
 axes(im,960,476,62)
 txt(im,960,674,'Contact geometry',23,GOLD,anchor='ma')
 arrow(im,(672,532),(710,532),GOLD,4,ease(t/2))
 arrow(im,(1207,532),(1245,532),CYAN,4,ease((t-2)/2))
 txt(im,80,812,'Hand relative to the cap',28,INK,True)
 txt(im,1260,812,'Gripper relative to the cap',28,INK,True)
 panel(im,(710,794,1215,850),LIGHT[GOLD],None,r=12)
 txt(im,962,806,'Retarget to gripper geometry',23,GOLD,anchor='ma')
 txt(im,960,883,'T_base,tcp  =  T_base,object  ·  T_object,tcp',35,INK,True,anchor='ma',mono=True)
 txt(im,960,929,'Architecture diagram · use only observable pose components',20,MUTED,anchor='ma')


def planning(im,t):
 header(im,'05 / plan','The agent plans motion around the relation.','Free-space paths are robot-specific. Contact geometry remains anchored to the cap.')
 photo(im,robot_frame(6.7+min(t,8)*2.3),(80,270,1030,910))
 pill(im,105,295,'ROBOT APPROACH · 2.3×',CYAN,19)
 for i,(title,desc,c) in enumerate([
  ('Goal','Reach the cap pregrasp.',CYAN),
  ('Constraint','Preserve the selected contact frame.',GOLD),
  ('Trajectory','Plan a reachable robot motion.',CYAN),
  ('Transition','Advance when contact evidence arrives.',PINK)]):
  y=285+i*155
  panel(im,(1100,y,1840,y+126),LIGHT[c],None)
  txt(im,1128,y+20,title,24,c,True)
  txt(im,1128,y+62,desc,29,INK,maxw=680)


def tree(im,t):
 header(im,'06 / select touch','Select tactile primitives for this task.','A task-conditioned library: image geometry, force response, and torque response.')
 # Every branch describes possible channels; selection highlights the implemented bottle proxy.
 panel(im,(80,500,380,620),INK,None)
 txt(im,230,525,'Tactile primitive',29,WHITE,True,anchor='ma')
 txt(im,230,566,'library',29,WHITE,True,anchor='ma')
 branches=[(360,'Contact images','RGB / WARPED / DIFF',GOLD),(570,'Force response','Fx, Fy, Fz',PINK),(780,'Torque response','Mx, My, Mz',CYAN)]
 selected=t>5.5
 for y,title,channel,c in branches:
  branchc=c if y==570 and selected else LINE
  line(im,[(380,560),(440,560),(440,y),(490,y)],branchc,4,ease(t/1.6))
  panel(im,(490,y-60,865,y+60),LIGHT[c] if y==570 and selected else WHITE,c if y==570 and selected else LINE)
  txt(im,515,y-38,title,29,INK,True)
  txt(im,515,y+6,channel,24,c,mono=True)
 leaves=[
  (310,'Contact shape / location',GOLD),
  (410,'Slip / contact orientation',GOLD),
  (520,'Contact & press response',PINK),
  (620,'Retention & release proxy',PINK),
  (730,'Rotational resistance',CYAN),
  (830,'Load / twisting moment',CYAN)]
 for i,(y,s,c) in enumerate(leaves):
  by=branches[i//2][0];sel=selected and i in [2,3]
  line(im,[(865,by),(920,by),(920,y),(975,y)],c if sel else LINE,3,ease((t-1)/1.5))
  panel(im,(975,y-44,1510,y+44),LIGHT[c] if sel else WHITE,c if sel else LINE,r=13,width=3 if sel else 2)
  txt(im,1000,y-17,s,27,c if sel else INK,sel,maxw=485)
  if sel:line(im,[(1460,y),(1470,y+10),(1490,y-14)],c,4)
 # Task selector, revealed after the library.
 if t>4:
  panel(im,(1580,384,1840,658),LIGHT[PINK],PINK)
  txt(im,1710,407,'AGENT',22,PINK,True,anchor='ma')
  txt(im,1710,456,'Press-and-turn',25,INK,True,anchor='ma')
  txt(im,1710,494,'cap task',25,INK,True,anchor='ma')
  txt(im,1710,558,'Select evidence',21,PINK,anchor='ma')
  txt(im,1710,594,'for each stage',21,PINK,anchor='ma')
  arrow(im,(1570,520),(1520,520),PINK,4,ease((t-5)/1))
 txt(im,80,914,'Recorded bottle run: session-relative raw Fz proxies selected.',24,PINK,True)
 txt(im,1840,914,'Torque branch available; not calibrated or used as torque in Run16.',20,MUTED,anchor='ra')

CODE=[
 ('policy = select(task="press_and_turn_cap")',INK),
 ('released = False',INK),
 ('for cycle in bounded_regrasp_cycles:',INK),
 ('    require(contact_present(fresh_window()))',PINK),
 ('    baseline = fresh_prepress_window()',PINK),
 ('    require(press_until_response(baseline))',GOLD),
 ('    twist_segment(cap_axis, feed=thread_profile)',GOLD),
 ('    signal = fresh_window(relative_raw_Fz)',PINK),
 ('    require(contact_present(signal))',PINK),
 ('    if release_candidate(signal):',PINK),
 ('        released = stationary_confirm()',PINK),
 ('    if released: break',GREEN),
 ('    unload_reset_regrasp()',CYAN),
 ('if released: lift_along_bottle_axis(30*mm)',CYAN)]

def code(im,t):
 header(im,'07 / compile','Selected primitives become executable conditions.','The task policy connects observations, actions, transitions, and recovery.')
 left=[('contact_present','CONTACT → PRESS'),('press_response','PRESS → TWIST'),('contact_retained','CONTINUE / REGRASP'),('release_verified','VERIFY → LIFT')]
 for i,(a,b) in enumerate(left):
  y=286+i*143;active=int(t/4)%4==i
  panel(im,(80,y,635,y+114),LIGHT[PINK] if active else WHITE,PINK if active else LINE)
  txt(im,105,y+20,a,28,PINK,True,mono=True,maxw=500)
  txt(im,105,y+66,b,23,INK)
 arrow(im,(655,540),(735,540),PINK,4,ease(t/2))
 panel(im,(765,268,1840,920),WHITE,LINE,r=22)
 panel(im,(765,268,1840,332),INK,None,r=22)
 ImageDraw.Draw(im).rectangle((765,307,1840,332),fill=INK)
 txt(im,795,286,'cap_task_policy.py',24,WHITE,mono=True)
 txt(im,1810,287,'ILLUSTRATIVE PSEUDOCODE',19,'#c3d2d2',anchor='ra')
 active_line=min(len(CODE)-1,int(t/1.1))
 visible=min(len(CODE),1+int(t/.65))
 for i,(s,c) in enumerate(CODE):
  y=350+i*37
  if i>=visible:continue
  if i==active_line and s:panel(im,(782,y-3,1822,y+36),LIGHT.get(c,LIGHT[INK]),None,r=5)
  txt(im,802,y,str(i+1).rjust(2),21,MUTED,mono=True)
  txt(im,850,y,s,23,c,mono=True,maxw=955)
 txt(im,795,891,'Illustrative policy · helpers stop on failed contact or missing evidence.',18,MUTED)


def execution(im,t):
 header(im,'08 / execute','A stage machine carries the task forward.','Recorded Run16 · six 90° segments · five automatic wrist resets and regrasps')
 source_t=29+min(1,t/22)*(220-29)
 photo(im,robot_frame(source_t),(80,267,1160,916))
 pill(im,105,292,'ROBOT EXECUTION · 8.7×',CYAN,20)
 intervals=[(29.049,37.094),(66.791,74.694),(104.470,113.750),(145.909,152.930),(179.253,185.807),(212.406,219.340)]
 segment=max(0,sum(source_t>=a for a,b in intervals)-1)
 twisting=any(a<=source_t<=b for a,b in intervals)
 names=['PRESS','TWIST','UNLOAD','RESET','REGRASP']
 active=[1] if twisting else [2,3,4]
 for i,s in enumerate(names):
  y=300+i*99;c=GOLD if i in [0,1,4] else CYAN
  if i<4:arrow(im,(1290,y+55),(1290,y+88),LINE,3)
  panel(im,(1230,y,1840,y+69),LIGHT[c] if i in active else WHITE,c if i in active else LINE,r=12)
  txt(im,1255,y+18,s,29,c if i in active else INK,True)
  if i in [0,1,4]:pill(im,1640,y+13,'TOUCH',PINK,18)
 txt(im,1230,831,'Task-axis rotation',25,MUTED)
 for i in range(6):
  x=1230+i*100;panel(im,(x,874,x+80,918),LIGHT[GOLD] if i<=segment else WHITE,GOLD if i<=segment else LINE,r=8)
  txt(im,x+40,883,'90°',23,GOLD if i<=segment else MUTED,True,anchor='ma')
 txt(im,80,934,'Stages aligned to the recorded twist intervals; reset phases are grouped.',19,MUTED)


def release(im,t):
 header(im,'09 / verify','The lift waits for release evidence.','Measured action-log windows: resistance falls while contact stays present.')
 if t<11:
  x0,y0=110,330;cw,ch=1000,405
  values=[1.1020157608973933,.07734818,.11520066,.05672473664418365]
  d=ImageDraw.Draw(im)
  for val in [0,.4,.8,1.2]:
   y=y0+ch-val/1.2*ch;d.line((x0,y,x0+cw,y),fill=LINE,width=1);txt(im,x0-18,y-12,f'{val:.1f}',20,MUTED,anchor='ra')
  limit=.3857055163140876;y=y0+ch-limit/1.2*ch
  for x in range(x0,x0+cw,20):d.line((x,y,x+10,y),fill=PINK,width=2)
  txt(im,x0+cw-3,y-30,'Final release limit 0.386',22,PINK,anchor='ra')
  labels=['Observed peak','Fresh window 1','Fresh window 2','Stationary check']
  visible=min(4,1+int(t/2))
  for i,(v,l) in enumerate(zip(values,labels)):
   x=x0+95+i*270;yy=y0+ch-v/1.2*ch
   if i<visible:
    c=PINK if i==0 else GREEN;d.ellipse((x-10,yy-10,x+10,yy+10),fill=c)
    txt(im,x,yy-43,f'{v:.3f}',31,c,True,anchor='ma')
   txt(im,x,y0+ch+25,l,21,MUTED,anchor='ma')
  txt(im,110,284,'Session-relative raw Fz proxy',23,MUTED)
  txt(im,110,820,'Discrete logged windows · not a continuous force trace',22,MUTED)
  txt(im,110,860,'Relative raw units, not newtons or calibrated torque',22,MUTED)
 else:
  photo(im,robot_frame(220.68+min(6.8,(t-11))),(80,267,1160,916))
  pill(im,105,292,'CAP LIFT · 1×',GREEN,20)
 conditions=[('Resistance built first','Peak: 1.102',t>0),('Fresh low windows','0.077 / 0.115',t>4),('Stationary confirmation','0.057 < 0.386',t>6),('Contact retained','0.318 > 0.016',t>8)]
 for i,(a,b,ok) in enumerate(conditions):
  y=286+i*127;c=GREEN if ok else MUTED
  panel(im,(1230,y,1840,y+105),LIGHT[GREEN] if ok else WHITE,GREEN if ok else LINE,r=14)
  txt(im,1282,y+16,a,27,c,True,maxw=530)
  if ok:line(im,[(1249,y+29),(1258,y+38),(1272,y+16)],c,4)
  else:ImageDraw.Draw(im).ellipse((1249,y+23,1268,y+42),outline=LINE,width=2)
  txt(im,1300,y+60,b,24,MUTED,mono=True)
 if t>10:
  pill(im,1230,829,'RELEASE VERIFIED → LIFT 30 mm',GREEN,21)
 else:txt(im,1230,843,'Checking the transition conditions…',24,PINK)


def outro(im,t):
 txt(im,80,52,'TACTILE AGENT',25,CYAN,True)
 txt(im,80,135,'Understand intent.',65,INK,True)
 txt(im,80,216,'Preserve interaction. Supervise with touch.',61,INK,True)
 photo(im,robot_frame(226.5),(80,370,870,914))
 for i,(head,sub,c) in enumerate([
  ('01   Demonstration → stages','Action intent and repeated task structure',CYAN),
  ('02   Hand–object → gripper–object','Task-relative interaction constraints',GOLD),
  ('03   Tactile library → stage policy','Task-conditioned evidence and transitions',PINK)]):
  y=383+i*159
  panel(im,(945,y,1840,y+133),LIGHT[c],None)
  txt(im,973,y+22,head,31,c,True,maxw=835)
  txt(im,973,y+75,sub,26,INK,maxw=835)
 txt(im,946,902,'Real robot result: cap released and lifted.',25,GREEN,True)

RENDERERS={k:globals()[k] for _,_,k in SCENES}
def render_frame(t):
 start,end,key=next((a,b,k) for a,b,k in SCENES if a<=t<b)
 im=Image.new('RGB',(W,H),BG);RENDERERS[key](im,t-start);footer(im,t,key)
 # Short white dissolves between chapters; no flicker during video loops.
 alpha=min(ease((t-start)/.28),ease((end-t)/.28))
 if alpha<1:im=Image.blend(Image.new('RGB',(W,H),BG),im,alpha)
 return im

def main():
 global SUBTITLES
 p=argparse.ArgumentParser();p.add_argument('--preview',action='store_true');p.add_argument('--output',type=Path,default=WORK/'bottle_framework_film_EN_silent.mp4');p.add_argument('--fps',type=int,default=FPS);args=p.parse_args()
 candidates=[WORK/'audio/narration.json',WORK/'narration.json']
 for path in candidates:
  if path.exists():
   data=json.loads(path.read_text());SUBTITLES=data.get('subtitles',[])
   if not SUBTITLES:SUBTITLES=[s for scene in data.get('scenes',[]) for s in scene.get('subtitles',[])]
   break
 if args.preview:
  samples=[4,14,33,50,66,79,98,115,137,154,160,169]
  contact=Image.new('RGB',(1280,360*math.ceil(len(samples)/2)),BG)
  for i,t in enumerate(samples):
   im=render_frame(t);im.save(WORK/f'previews/scene-{t:03}.jpg',quality=92)
   thumb=im.resize((640,360));contact.paste(thumb,((i%2)*640,(i//2)*360))
  contact.save(WORK/'previews/storyboard.jpg',quality=93)
  print('Preview frames written',flush=True);return
 args.output.parent.mkdir(parents=True,exist_ok=True)
 cmd=['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(args.fps),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','20','-threads','6','-pix_fmt','yuv420p','-movflags','+faststart',str(args.output)]
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 try:
  for n in range(DURATION*args.fps):
   if n%(args.fps*10)==0:print(f'Rendering {n/args.fps:.0f}/{DURATION}s',flush=True)
   proc.stdin.write(render_frame(n/args.fps).tobytes())
 finally:proc.stdin.close()
 if proc.wait():raise RuntimeError('ffmpeg encoding failed')
 print(args.output,flush=True)
if __name__=='__main__':main()
