#!/usr/bin/env python3
"""Prepare the public site's real experimental media; no hardware access.

Usage: python scripts/prepare_media.py --source ../tactile_agent
Requires FFmpeg/FFprobe and Pillow. All public provenance uses repo-relative paths.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
DARK = '#0c171c'
CUP = 'runs/live/cup_tactile_demo_20261023_08/rendered/cup_tactile_demo_run08_single_cup_visual_confirmed_final.mp4'
BOTTLE = 'runs/live/medicine_bottle_robot_video_20261023_01/robot_execution_front_full.mp4'
LOG = 'runs/live/medicine_bottle_execution_20261023_16_video_fast/action_log.json'
DELIVERY = 'outputs/framework_videos_20261023'


def run(*args):
    subprocess.run([str(a) for a in args], check=True)


def frame(path, second):
    with tempfile.TemporaryDirectory() as tmp:
        dest = Path(tmp) / 'frame.png'
        run('ffmpeg', '-loglevel', 'error', '-y', '-ss', str(second), '-i', path, '-frames:v', '1', dest)
        return Image.open(dest).convert('RGB').copy()


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def text(draw, xy, label, size, color='white', bold=False):
    draw.text(xy, label, font=font(size,bold), fill=color)


def save_jpg(im, name):
    im.convert('RGB').save(OUT/name, quality=91, optimize=True, subsampling=0)


def posters(source):
    cup = frame(source/CUP, 33.7)
    bottle = frame(source/BOTTLE, 226.2)
    # Reframe only; never synthesize or alter experimental contacts.
    cup_front = cup.crop((32,112,992,832))
    cup_front = cup_front.crop((180,0,920,720))
    bottle_front = bottle.crop((130,0,610,480))
    hero = Image.new('RGB',(1600,900),DARK)
    hero.paste(ImageOps.fit(cup_front,(797,900)),(0,0))
    hero.paste(ImageOps.fit(bottle_front,(797,900)),(803,0))
    layer=Image.new('RGBA',hero.size,(0,0,0,0)); d=ImageDraw.Draw(layer)
    d.rectangle((0,785,1600,900),fill=(8,20,25,225))
    text(d,(36,806),'ONE CUP',26,bold=True);text(d,(36,850),'Scripted retry · tactile recorded',19,'#c8d8d9')
    text(d,(839,806),'ONE CAP',26,bold=True);text(d,(839,850),'Online tactile stage gates',19,'#c8d8d9')
    hero=Image.alpha_composite(hero.convert('RGBA'),layer).convert('RGB')
    save_jpg(hero,'hero-poster.jpg')
    # Video cards: a large preserved RGB view plus the relevant evidence modality.
    cp=Image.new('RGB',(1280,720),DARK)
    cp.paste(ImageOps.fit(cup_front,(760,720)),(520,0))
    d=ImageDraw.Draw(cp)
    text(d,(44,42),'01 / NESTED CUPS',18,'#c2b48b',True)
    text(d,(44,103),'Pick the',47,bold=True); text(d,(44,159),'top cup.',47,bold=True)
    text(d,(44,241),'One demonstration.',23,'#c8d8d9')
    text(d,(44,276),'Contact geometry transferred.',21,'#c8d8d9')
    # Tactile pair, preserved frame pixels from the recorded composite.
    cp.paste(cup.crop((1040,112,1440,512)).resize((194,194)),(44,359))
    cp.paste(cup.crop((1480,112,1880,512)).resize((194,194)),(253,359))
    d=ImageDraw.Draw(cp)
    text(d,(44,577),'Tactile image evidence',20,bold=True)
    text(d,(44,611),'Recorded in shadow mode',18,'#c8d8d9')
    text(d,(44,668),'72.6 s  /  ENGLISH EXPLAINER',14,'#a5b9bb')
    save_jpg(cp,'cup-poster.jpg')
    bp=Image.new('RGB',(1280,720),DARK)
    bp.paste(ImageOps.fit(bottle_front,(760,720)),(520,0));d=ImageDraw.Draw(bp)
    text(d,(44,42),'02 / PRESS-AND-TURN CAP',18,'#c2b48b',True)
    text(d,(44,103),'Feel when',47,bold=True);text(d,(44,159),'to release.',47,bold=True)
    text(d,(44,243),'Press. Twist. Regrasp.',23,'#c8d8d9')
    text(d,(44,279),'Verify release. Lift.',23,'#c8d8d9')
    text(d,(44,367),'540°',68,'#9ccebf',True)
    text(d,(44,449),'Six twist segments',21,'#c8d8d9')
    text(d,(44,481),'Five automatic regrasps',21,'#c8d8d9')
    text(d,(44,577),'Online tactile stage gates',20,bold=True)
    text(d,(44,611),'Session-relative sensor signals',18,'#c8d8d9')
    text(d,(44,668),'66.0 s  /  ENGLISH EXPLAINER',14,'#a5b9bb')
    save_jpg(bp,'bottle-poster.jpg')
    og=Image.new('RGB',(1200,630),DARK)
    og.paste(ImageOps.fit(cup_front,(420,630)),(780,0))
    d=ImageDraw.Draw(og)
    text(d,(58,55),'ROBOT LEARNING × TACTILE SUPERVISION',15,'#b9b18e',True)
    text(d,(54,139),'Tactile Agent',68,bold=True)
    text(d,(58,259),'From one demonstration',32,'#d3e0e0')
    text(d,(58,308),'to contact-aware action.',32,'#d3e0e0')
    d.line((58,399,700,399),fill='#33474b',width=2)
    for y,t in [(438,'Understand intent'),(482,'Transfer contact geometry'),(526,'Let touch supervise execution')]:
        d.ellipse((58,y+7,67,y+16),fill='#9ccebf');text(d,(84,y),t,22,'#c8d8d9')
    save_jpg(og,'og-image.jpg')


def montage(source):
    # Two true parallel evidence views; each panel has its own stated speed.
    graph = (
        '[0:v]trim=start=2.5:end=35.5,setpts=(PTS-STARTPTS)/2,crop=640:720:300:112,'
        'scale=636:720:flags=lanczos,fps=30,setsar=1[left];'
        '[1:v]split=4[b0][b1][b2][b3];'
        '[b0]trim=start=26:end=38,setpts=(PTS-STARTPTS)/2[c0];'
        '[b1]trim=start=39:end=59,setpts=(PTS-STARTPTS)/4[c1];'
        '[b2]trim=start=212:end=218,setpts=(PTS-STARTPTS)/3[c2];'
        '[b3]trim=start=220:end=227,setpts=(PTS-STARTPTS)/2[c3];'
        '[c0][c1][c2][c3]concat=n=4:v=1:a=0,crop=426:480:140:0,'
        'scale=636:720:flags=lanczos,fps=30,setsar=1[right];'
        '[left]pad=644:720:0:0:color=0x0c171c[lp];'
        '[lp][right]hstack=inputs=2,'
        'drawbox=x=0:y=0:w=iw:h=54:color=0x0c171c@0.82:t=fill,'
        'drawbox=x=0:y=654:w=iw:h=66:color=0x0c171c@0.88:t=fill,'
        f"drawtext=fontfile={FONT_BOLD}:text='TOP CUP':x=26:y=17:fontsize=20:fontcolor=white,"
        f"drawtext=fontfile={FONT}:text='2x playback':x=477:y=18:fontsize=17:fontcolor=white,"
        f"drawtext=fontfile={FONT_BOLD}:text='SAFETY CAP':x=670:y=17:fontsize=20:fontcolor=white,"
        f"drawtext=fontfile={FONT}:text='2x playback':x=1120:y=18:fontsize=17:fontcolor=white:enable='lt(t,6)+gte(t,13)',"
        f"drawtext=fontfile={FONT}:text='4x playback':x=1120:y=18:fontsize=17:fontcolor=white:enable='gte(t,6)*lt(t,11)',"
        f"drawtext=fontfile={FONT}:text='3x playback':x=1120:y=18:fontsize=17:fontcolor=white:enable='gte(t,11)*lt(t,13)',"
        f"drawtext=fontfile={FONT}:text='Scripted retry / tactile shadow':x=26:y=678:fontsize=18:fontcolor=0xd1dfdf,"
        f"drawtext=fontfile={FONT}:text='Online tactile stage gates':x=670:y=678:fontsize=18:fontcolor=0xd1dfdf,"
        'fade=t=in:st=0:d=0.20,fade=t=out:st=16.25:d=0.25,format=yuv420p[out]'
    )
    run('ffmpeg','-loglevel','error','-y','-i',source/CUP,'-i',source/BOTTLE,
        '-filter_complex_threads','2','-filter_complex',graph,'-map','[out]','-an',
        '-t','16.5','-c:v','libx264','-preset','medium','-crf','23','-threads','4',
        '-movflags','+faststart',OUT/'hero-loop.mp4')


def captions_and_explainers(source):
    for stem,prefix in [('cup_task_framework_explainer_EN','cup'),('medicine_bottle_task_framework_explainer_EN','bottle')]:
        shutil.copy2(source/DELIVERY/(stem+'.mp4'),OUT/(prefix+'-explainer.mp4'))
        srt=(source/DELIVERY/(stem+'.srt')).read_text()
        vtt='WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt)
        (OUT/(prefix+'-captions.vtt')).write_text(vtt)


def signals(source):
    events=json.loads((source/LOG).read_text())['events']; t0=events[0]['monotonic_s']
    windows=[]; actions=[]; segment=1
    for e in events:
        op=e['operation']
        if op.startswith('twist_batch_'):
            nums=list(map(int,re.findall(r'\d+',op)))
            segment=(nums[0]-1)//9+1
        if op.startswith('wrist_reset_'):
            segment=int(op.rsplit('_',1)[-1])+1
        if op=='collect_force_window':
            windows.append({
                'event_index':e['index'],'time_s':round(e['monotonic_s']-t0,6),
                'phase':e['phase'],'segment':segment,'samples_per_finger':e['samples'],
                'value':e['combined_press_aligned_raw_fz_proxy_sensor_units'],
                'by_finger':e['press_aligned_raw_fz_proxy_sensor_units_by_side'],
                'release_phase':e['in_upfeed_release_phase'],
                'running_release_peak':e['upfeed_global_peak_resistance_proxy_sensor_units'],
                'release_limit':e['release_resistance_limit_sensor_units'],
            })
        if op.startswith(('twist_batch_','wrist_reset_')) or op in ['release_verify','lift_released_cap','regrasp_close']:
            actions.append({'event_index':e['index'],'time_s':round(e['monotonic_s']-t0,6),'operation':op,'state':e['state']})
    release=next(e for e in events if e['operation']=='release_verify')
    obj={
        'schema':'tactile-agent.web.signal.v1','source':LOG,
        'source_sha256':hashlib.sha256((source/LOG).read_bytes()).hexdigest(),
        'run':'Run16','signal':'Combined press-aligned raw SDK Fz proxy',
        'units':'session-relative raw sensor units; not N or calibrated torque',
        'time_axis':'Seconds since the first action-log event; not video timestamps',
        'series_semantics':'Discrete logged median windows; each segment establishes a fresh pre-press baseline. Do not interpolate through baseline resets as a continuous physical force.',
        'samples':windows,'events':actions,
        'release':{
            'event_index':release['index'],'time_s':round(release['monotonic_s']-t0,6),
            'peak':release['upfeed_global_peak_resistance_proxy_sensor_units'],
            'threshold':release['maximum_release_proxy_sensor_units'],
            'peak_fraction':release['release_peak_fraction'],
            'final_windows':[w['value'] for w in windows[-3:]],
            'contact_presence':release['after_presence_sensor_units'],
            'contact_minimum':release['minimum_presence_sensor_units'],
            'predicate':release['predicate'],'result':release['state']
        }
    }
    (OUT/'bottle-signal.json').write_text(json.dumps(obj,indent=2)+'\n')


def manifest(source):
    files=[]
    for p in sorted(OUT.iterdir()):
        if p.is_file() and p.name!='media-manifest.json':
            files.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    obj={
        'schema':'tactile-agent.web.media.v1','created':'2026-10-24','language':'en',
        'provenance_root':'tactile_agent (source experiment repository)',
        'sources':{'cup_robot':CUP,'bottle_robot':BOTTLE,'bottle_action_log':LOG,'explainers':DELIVERY},
        'source_sha256':{name:hashlib.sha256((source/path).read_bytes()).hexdigest() for name,path in [('cup_robot',CUP),('bottle_robot',BOTTLE),('bottle_action_log',LOG)]},
        'hero':{
            'file':'hero-loop.mp4','duration_s':16.5,'resolution':[1280,720],
            'silent':True,'fps':30,'presentation':'Two-panel evidence montage with in-frame playback speed labels and a brief edge fade. Different experimental runs are shown side by side, not synchronized.',
            'cup_segments':[{'source_s':[2.5,35.5],'speed':2}],
            'bottle_segments':[{'source_s':[26,38],'speed':2},{'source_s':[39,59],'speed':4},{'source_s':[212,218],'speed':3},{'source_s':[220,227],'speed':2}],
            'cup_crop':'Front RGB panel of the surviving composite; original raw capture was removed for space. Diagnostic overlays were excluded by cropping.',
            'bottle_crop':'Clean front RGB footage; framing crop only.'
        },
        'posters':{'cup_source_s':33.7,'bottle_source_s':226.2,'hero_source_s':{'cup':33.7,'bottle':226.2},'source_resolution':{'cup_front_rgb_panel':[960,720],'bottle_front_rgb':[640,480]},'note':'Posters are presentation canvases containing reframed real footage; canvas resolution does not imply higher sensor resolution.'},
        'evidence_boundaries':{
            'cup':'Run08 retry was scripted and tactile imagery recorded in shadow mode. One-cup outcome was confirmed by front RGB/operator review. Execution ends at LIFT/HOLD.',
            'bottle':'Run16 uses online relative raw SDK Fz proxy gates, not calibrated force or task-frame torque. 540 degrees across six twist segments, five automatic wrist resets/regrasps; execution ends at 30 mm LIFT_CAP. No synchronized tactile RGB recording in Run16.',
            'general':'No synthetic experiment imagery or invented signal samples. Edited excerpts are not real-time demonstrations; speed changes are disclosed.'
        },
        'files':files,'total_bytes':sum(f['bytes'] for f in files)
    }
    (OUT/'media-manifest.json').write_text(json.dumps(obj,indent=2)+'\n')


def main():
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=ROOT.parent/'tactile_agent');p.add_argument('--skip-video',action='store_true');args=p.parse_args()
    OUT.mkdir(exist_ok=True)
    captions_and_explainers(args.source)
    posters(args.source)
    signals(args.source)
    if not args.skip_video: montage(args.source)
    manifest(args.source)
    print(json.dumps({'assets':str(OUT),'bytes':sum(p.stat().st_size for p in OUT.iterdir() if p.is_file())}))


if __name__=='__main__': main()
