// Every executable inline <script> in the exported Web shell must be allowed by an
// exact SHA-256 hash in the CSP (scripts/web-security-headers.mjs INLINE_SCRIPT_HASHES).
// Usage after `npm run build:web`:  node scripts/check-inline-scripts.mjs dist
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {INLINE_SCRIPT_HASHES} from './web-security-headers.mjs';

const EXECUTABLE=/^(|text\/javascript|application\/javascript|module)$/i;

export function extractInlineScripts(html){
 const out=[];
 for(const m of String(html).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  const attrs=m[1];
  if(/\ssrc\s*=/i.test(' '+attrs))continue;
  const type=/\stype\s*=\s*["']?([^"'\s>]*)/i.exec(' '+attrs)?.[1]??'';
  if(!EXECUTABLE.test(type))continue; // JSON/data blocks are not executed and not subject to script-src
  out.push(m[2]);
 }
 return out;
}

export function cspScriptHash(text){
 return "'sha256-"+createHash('sha256').update(text,'utf8').digest('base64')+"'";
}

function htmlFiles(dir){
 return readdirSync(dir).flatMap(name=>{
  const path=join(dir,name);
  return statSync(path).isDirectory()?htmlFiles(path):name.endsWith('.html')?[path]:[];
 });
}

if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].split('/').pop())){
 const dir=process.argv[2]||'dist';
 const seen=new Map();
 const files=htmlFiles(dir);
 for(const file of files)for(const script of extractInlineScripts(readFileSync(file,'utf8'))){
  const hash=cspScriptHash(script);
  const entry=seen.get(hash)??{count:0,sample:JSON.stringify(script.slice(0,160)),length:script.length};
  entry.count++;seen.set(hash,entry);
 }
 let unknown=0;
 for(const [hash,{count,sample,length}] of seen){
  const ok=INLINE_SCRIPT_HASHES.includes(hash);
  if(!ok)unknown++;
  console.log((ok?'ALLOWED':'NOT ALLOWED')+' inline script '+hash+' in '+count+' page(s), '+length+' chars: '+sample);
 }
 const stale=INLINE_SCRIPT_HASHES.filter(h=>!seen.has(h));
 for(const h of stale)console.log('Allowed hash no longer present in any page (remove it): '+h);
 console.log('Scanned '+files.length+' HTML files: '+seen.size+' distinct inline scripts, '+unknown+' not allowed, '+stale.length+' stale');
 if(unknown>0||stale.length>0||files.length===0)process.exitCode=1;
}
