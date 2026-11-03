// Rebuild screenshots printed by scripts/visual-check-production.mjs from a
// GitHub Actions job log:  node scripts/extract-visual-screenshots.mjs job.log out/
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

export function extractVisualScreenshots(log){
 const shots=new Map();
 for(const raw of log.split(/\r?\n/)){
  const at=raw.indexOf('VISUALSHOT|');
  if(at<0)continue;
  const [,name,index,total,data]=raw.slice(at).split('|');
  if(!/^[0-9A-Za-z_-]{1,80}$/.test(name??'')||!/^\d+$/.test(index??'')||!/^\d+$/.test(total??''))continue;
  const entry=shots.get(name)??{total:Number(total),parts:new Map()};
  if(entry.total!==Number(total))throw Error('Inconsistent chunk count for '+name);
  entry.parts.set(Number(index),(data??'').trim());
  shots.set(name,entry);
 }
 const out=new Map();
 for(const [name,{total,parts}] of shots){
  if(parts.size!==total)throw Error(name+': got '+parts.size+' of '+total+' chunks');
  let b64='';
  for(let i=1;i<=total;i++)b64+=parts.get(i);
  const bytes=Buffer.from(b64,'base64');
  if(bytes[0]!==0xff||bytes[1]!==0xd8)throw Error(name+' is not a JPEG');
  out.set(name,bytes);
 }
 return out;
}

if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].split('/').pop())){
 const [log,dir='visual-shots']=process.argv.slice(2);
 if(!log)throw Error('usage: extract-visual-screenshots.mjs <job.log> [outDir]');
 mkdirSync(dir,{recursive:true});
 for(const [name,bytes] of extractVisualScreenshots(readFileSync(log,'utf8'))){
  writeFileSync(dir+'/'+name+'.jpg',bytes);
  console.log(dir+'/'+name+'.jpg '+bytes.length+' bytes');
 }
}
