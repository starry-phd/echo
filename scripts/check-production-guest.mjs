import {validateGuestList,validateCover,validateRefusal} from './production-guest-validation.mjs';

// After Wrangler publish, global Cloudflare edge propagation is not instantaneous.
// Re-read the live public endpoints with bounded retries; never loosen security checks.
const base=(process.env.ECHO_URL||'https://echo-starry.starry-phd.workers.dev').replace(/\/$/,'');
const allowed='https://echo-starry.starry-phd.workers.dev';
if(base!==allowed)throw Error('Unexpected Production origin');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fetchPublic=async(path)=>{
 const r=await fetch(base+path,{cache:'no-store',signal:AbortSignal.timeout(15000)});
 return r;
};
async function eventually(label,operation,attempts=10){
 let last;
 for(let n=1;n<=attempts;n++){
  try{return await operation();}
  catch(e){
   last=e;
   const detail=String(e instanceof Error?e.message:e).slice(0,140);
   console.log(label+' attempt '+n+'/'+attempts+': '+detail);
   if(n<attempts)await pause(Math.min(n*1500,4500));
  }
 }
 throw Error(label+' failed after '+attempts+' attempts: '+String(last instanceof Error?last.message:last));
}
const tracks=await eventually('public guest metadata',async()=>{
 const r=await fetchPublic('/api/v1/previews');
 return validateGuestList(r.status,r.headers,await r.json());
},10);
console.log('Validated public guest list: 28 metadata-only cards, policy=2 and no-store');
for(let index=0;index<tracks.length;index++){
 const path=tracks[index].coverUrl;
 await eventually('guest cover '+(index+1)+'/28',async()=>{
  const r=await fetchPublic(path);
  const data=await r.arrayBuffer();
  validateCover(r.status,r.headers,data.byteLength);
 },4);
}
console.log('Validated 28/28 curated cover images with no-store; no audio data read');
// A listed guest card must still be unplayable.
await eventually('listed private stream denied',async()=>{
 const r=await fetchPublic('/api/v1/tracks/'+encodeURIComponent(tracks[0].id)+'/stream');
 validateRefusal(r.status,r.headers,'listed guest private stream');
},5);
await eventually('unknown cover denied',async()=>{
 const r=await fetchPublic('/api/v1/previews/not-a-whitelisted-track-20261030/cover?policy=2');
 validateRefusal(r.status,r.headers,'unlisted cover');
},5);
console.log('Public-only Production smoke PASSED: private audio and unlisted cover both return 404/no-store');
