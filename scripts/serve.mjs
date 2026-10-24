import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8'};
const server=http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)||pathname.split('/').some(s=>s.startsWith('.')||s==='node_modules')){res.writeHead(403).end();return;}
 let stat;try{stat=fs.statSync(file);}catch{res.writeHead(404).end('Not found');return;}
 if(!stat.isFile()){res.writeHead(404).end();return;}
 const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
 let start=0,end=stat.size-1,status=200;
 if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
  if(!match[1]){start=Math.max(0,stat.size-Number(match[2]));}else{start=Number(match[1]);end=match[2]?Math.min(end,Number(match[2])):end;}
  if(!Number.isInteger(start)||start<0||start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
  status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
 }
 headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
 if(req.method==='HEAD'){res.end();return;}
 const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
});
server.listen(port,'127.0.0.1',()=>console.log(`Local preview: http://127.0.0.1:${port}`));
