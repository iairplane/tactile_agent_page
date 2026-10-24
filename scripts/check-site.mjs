import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const pages=['index.html','architecture.html','video-script.html'];
let checked=0;
for(const page of pages){
 const html=fs.readFileSync(page,'utf8');
 assert.match(html,/<html lang="en">/);
 assert.match(html,/<title>[^<]+<\/title>/);
 assert(!/[\u3400-\u9fff]/u.test(html), `${page}: authored page must be English`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,`${page}: duplicate IDs`);
 for(const match of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)){
  const url=match[1];
  if(/^(https?:|mailto:|data:|#)/.test(url))continue;
  const clean=url.split('#')[0].split('?')[0];
  assert(fs.existsSync(path.resolve(path.dirname(page),clean||'.')),`${page}: missing ${url}`); checked++;
 }
}
for(const name of ['cup','bottle']){assert.match(fs.readFileSync(`assets/${name}-captions.vtt`,'utf8'),/^WEBVTT/);}
const signal=JSON.parse(fs.readFileSync('assets/bottle-signal.json','utf8'));
assert.equal(signal.samples.length,25);assert(signal.samples.every(s=>Number.isFinite(s.value)&&Number.isFinite(s.time_s)));
const manifest=JSON.parse(fs.readFileSync('assets/media-manifest.json','utf8'));
assert.equal(manifest.language,'en');
for(const file of ['assets/bottle-signal.json','assets/media-manifest.json',...pages])assert(!fs.readFileSync(file,'utf8').includes('/home/vitai'),`${file}: local absolute path leaked`);
console.log(`Checked ${pages.length} English pages, ${checked} local references, media captions, and 25 recorded signal windows.`);
