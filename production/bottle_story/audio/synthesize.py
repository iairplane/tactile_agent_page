"""Render neural narration and exact-timeline captions; requires edge-tts and ffmpeg."""
import asyncio, json, subprocess, re, wave
from pathlib import Path
import edge_tts

ROOT=Path(__file__).resolve().parent
SOURCE=json.loads((ROOT/'narration-source.json').read_text())
LEAD=0.25

def duration(path):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)]))

async def generate(scene,rate):
    raw=ROOT/(scene['id']+'.mp3')
    meta=[]
    communicate=edge_tts.Communicate(scene['text'],SOURCE['voice'],rate=f'{rate:+d}%',boundary='WordBoundary')
    with raw.open('wb') as out:
        async for item in communicate.stream():
            if item['type']=='audio': out.write(item['data'])
            elif item['type']=='WordBoundary': meta.append({k:item[k] for k in ['offset','duration','text']})
    (ROOT/(scene['id']+'.words.json')).write_text(json.dumps(meta,indent=2))
    return raw,meta,duration(raw)

def cues_from_words(meta,start,source_text,maxlen=78):
    # Word-boundary metadata omits punctuation. Recover it from the exact authored text.
    positions=[]; pos=0
    for word in meta:
        match=re.search(re.escape(word['text']),source_text[pos:],re.I)
        if not match:raise ValueError(f"Cannot align {word['text']!r}")
        positions.append(pos+match.start());pos+=match.end()
    meta=[dict(w,text=source_text[positions[i]:positions[i+1] if i+1<len(meta) else len(source_text)].strip()) for i,w in enumerate(meta)]
    cues=[]; batch=[]
    def flush():
        if not batch:return
        t=' '.join(w['text'] for w in batch).replace('- ', '-')
        cues.append({'start':round(start+LEAD+batch[0]['offset']/1e7,3),'end':round(start+LEAD+(batch[-1]['offset']+batch[-1]['duration'])/1e7+.10,3),'text':t})
        batch.clear()
    for word in meta:
        length=sum(len(w['text'])+1 for w in batch)+len(word['text'])
        if length>maxlen:flush()
        batch.append(word)
        # Preserve sentence/phrase pauses in readable groups.
        if re.search(r'[.!?;:]$',word['text']) :flush()
    flush()
    for a,b in zip(cues,cues[1:]):a['end']=min(a['end'],b['start']-.02)
    return cues

async def main():
    previous=json.loads((ROOT/'narration.json').read_text()) if (ROOT/'narration.json').exists() else {'scenes':[]}
    cached={s['id']:s for s in previous['scenes']}
    semaphore=asyncio.Semaphore(3)
    async def render(scene):
        async with semaphore:
            budget=scene['end']-scene['start']-LEAD-.3
            rate=3
            old=cached.get(scene['id'])
            if old and old['text']==scene['text']:
                raw=ROOT/old['raw_audio_file'];words=json.loads((ROOT/(scene['id']+'.words.json')).read_text());secs=duration(raw);rate=old['voice_rate_percent']
            else:
                raw,words,secs=await generate(scene,rate)
            if secs>budget:
                rate=max(rate+1,round((1+rate/100)*secs/budget*100-100)+2)
                raw,words,secs=await generate(scene,rate)
            if secs>budget+.1:raise RuntimeError(f'{scene["id"]} cannot fit: {secs:.2f}s vs{budget:.2f}s')
            dst=ROOT/(scene['id']+'.wav')
            subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af',f'adelay={int(LEAD*1000)}:all=1,apad','-t',str(scene['end']-scene['start']),'-ar','48000','-ac','1','-c:a','pcm_s16le',str(dst)],check=True)
            result=dict(scene,audio_file=dst.name,raw_audio_file=raw.name,voice_rate_percent=rate,speech_duration=round(secs,3),subtitles=cues_from_words(words,scene['start'],scene['text']))
            print(f'{scene["id"]}: speech {secs:.2f}s / {scene["end"]-scene["start"]}s, rate {rate:+d}%',flush=True)
            return result
    scenes=await asyncio.gather(*(render(s) for s in SOURCE['scenes']))
    data=dict(SOURCE,scenes=scenes)
    (ROOT/'narration.json').write_text(json.dumps(data,indent=2)+'\n')
    with wave.open(str(ROOT/'narration.wav'),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(48000)
        for scene in scenes:
            with wave.open(str(ROOT/scene['audio_file']),'rb') as src:out.writeframes(src.readframes(src.getnframes()))
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(ROOT/'narration.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=7','-ar','48000','-ac','1','-c:a','pcm_s16le',str(ROOT/'normalized.wav')],check=True)
    (ROOT/'normalized.wav').replace(ROOT/'narration.wav')
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(ROOT/'narration.wav'),'-c:a','aac','-b:a','160k',str(ROOT/'narration.m4a')],check=True)
    def stamp(sec,sep):
        ms=round(sec*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
        return f'{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}'
    cues=[c for s in scenes for c in s['subtitles']]
    for ext,sep,prefix in [('srt',',',''),('vtt','.','WEBVTT\n\n')]:
        txt=prefix+'\n\n'.join(f'{i+1}\n{stamp(c["start"],sep)} --> {stamp(c["end"],sep)}\n{c["text"]}' for i,c in enumerate(cues))+'\n'
        (ROOT/f'narration.{ext}').write_text(txt)
    print(f'FINAL: {duration(ROOT/"narration.wav"):.3f}s, {len(cues)} captions, {sum(len(s["text"].split()) for s in scenes)} words',flush=True)

if __name__=='__main__':asyncio.run(main())
