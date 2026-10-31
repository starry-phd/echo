// Public-only, no credentials and no audio bytes.
// Emits aggregated statuses and headers, not guest titles, IDs or cover URLs.
const base='https://echo-starry.starry-phd.workers.dev';
const log=(label,x)=>console.log(label,JSON.stringify(x));
const info=r=>({status:r.status,cache:r.headers.get('cache-control'),type:r.headers.get('content-type')});
try{
 const response=await fetch(base+'/api/v1/previews',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 const listInfo=info(response);
 const payload=await response.json().catch(()=>({}));
 const tracks=Array.isArray(payload?.tracks)?payload.tracks:[];
 log('Public preview response', {info:listInfo,count:tracks.length,
  invalidPolicy:tracks.filter(x=>typeof x.coverUrl!=='string'||!x.coverUrl.includes('policy=2')).length,
  invalidDescription:tracks.filter(x=>x.description!==null).length,
  incorrectlyPlayable:tracks.filter(x=>x.playable!==false).length});
 const totals={attempted:0,good:0,badStatus:0,badType:0,badCache:0,badBody:0,failures:[]};
 for(let i=0;i<tracks.length;i++){
  const url=tracks[i].coverUrl;
  if(typeof url!=='string'||!url.startsWith('/api/v1/previews/'))continue;
  try{
   const cover=await fetch(base+url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
   const headers=info(cover);
   const buf=await cover.arrayBuffer();
   totals.attempted++;
   const ok=cover.status===200&&headers.type?.startsWith('image/')&&
     /(?:^|,)\s*no-store(?:\s*,|\s*$)/i.test(headers.cache||'')&&buf.byteLength>1000;
   if(ok)totals.good++;
   else{
    if(cover.status!==200)totals.badStatus++;
    if(!headers.type?.startsWith('image/'))totals.badType++;
    if(!/(?:^|,)\s*no-store(?:\s*,|\s*$)/i.test(headers.cache||''))totals.badCache++;
    if(buf.byteLength<=1000)totals.badBody++;
    totals.failures.push({index:i+1,headers,bytes:buf.byteLength});
   }
  }catch(e){totals.failures.push({index:i+1,error:String(e).slice(0,90)});}
 }
 log('Guest cover aggregate',totals);
 const unlisted=await fetch(base+'/api/v1/previews/not-a-whitelisted-track-20261030/cover?policy=2',
  {cache:'no-store',signal:AbortSignal.timeout(15000)});
 log('Unlisted cover',info(unlisted));
 const stream=await fetch(base+'/api/v1/tracks/not-a-whitelisted-track-20261030/stream',
  {cache:'no-store',signal:AbortSignal.timeout(15000)});
 log('Unlisted private stream',info(stream));
}catch(e){log('Public diagnostic error',{message:String(e).slice(0,180)});process.exitCode=1;}
