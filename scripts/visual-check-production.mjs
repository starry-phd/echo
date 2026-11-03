// Read-only visual acceptance of the live public site with real Chromium.
// Runs after each successful Production deploy (.github/workflows/visual-check.yml).
// Only GET page loads of public pages; no secrets, no member data, no audio.
// Screenshots are printed into the job log as base64 chunks so an AI without
// browser or artifact access can rebuild them with scripts/extract-visual-screenshots.mjs;
// they are also uploaded as a normal artifact for people.
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const PRODUCTION='https://echo-starry.starry-phd.workers.dev';
const base=(process.env.ECHO_VISUAL_BASE||PRODUCTION).replace(/\/$/,'');
if(base!==PRODUCTION&&!/^http:\/\/127\.0\.0\.1:\d{2,5}$/.test(base))throw Error('Unexpected visual-check origin');
const outDir=process.env.ECHO_VISUAL_OUT||'shots';
const CHUNK=6000;
const MOBILE={width:390,height:844};
const DESKTOP={width:1280,height:800};
// Appearance-only device preferences the app itself stores (no member data).
const PREFS={tutorialOff:'echostars_guest_safe_tutorial_never_remind_v1',palette:'sq_light_palette_v1',dark:'echo-ui-dark'};

mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch();
const report=[];
let uncaught=0;
let cspViolations=0;

async function publicPreviewSample(){
 try{
  const r=await fetch(base+'/api/v1/previews',{headers:{accept:'application/json'}});
  const tracks=(await r.json())?.tracks;
  if(!Array.isArray(tracks))return {id:null,speaker:null};
  const id=tracks[0]?.id;
  const single=tracks.map(t=>t?.speaker).find(s=>typeof s==='string'&&s.length>0&&s.length<=40&&!/[&、,，/]/.test(s));
  return {id:typeof id==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(id)?id:null,speaker:single??null};
 }catch{return {id:null,speaker:null};}
}

let shotFailures=0;
async function shot(name,options={}){
 try{await takeShot(name,options);}
 catch(error){
  shotFailures++;
  console.log('VISUAL '+name+' FAILED: '+String(error instanceof Error?error.message:error).split('\n')[0].slice(0,200));
 }
}

async function takeShot(name,{path='/',viewport=MOBILE,mobile=true,dark=false,firstVisit=false,action}={}){
 const context=await browser.newContext({viewport,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,
  colorScheme:dark?'dark':'light',locale:'zh-TW',timezoneId:'Asia/Taipei',reducedMotion:'reduce'});
 // Report every CSP violation (report-only or enforced) as a console line.
 await context.addInitScript(()=>{document.addEventListener('securitypolicyviolation',e=>{
  console.log('CSPVIOLATION '+e.effectiveDirective+' '+String(e.blockedURI).slice(0,120)+(e.disposition==='report'?' (report-only)':''));});});
 if(!firstVisit)await context.addInitScript(([keys,isDark])=>{
  try{localStorage.setItem(keys.tutorialOff,'1');localStorage.setItem(keys.palette,'rose');localStorage.setItem(keys.dark,isDark?'1':'0');}catch{}
 },[PREFS,dark]);
 try{await capture(name,context,{path,action});}
 finally{await context.close();}
}

async function capture(name,context,{path,action}){
 const page=await context.newPage();
 const errors=[],failed=[],external=new Set();
 page.on('pageerror',e=>{uncaught++;errors.push('uncaught: '+String(e.message).slice(0,200));});
 const csp=[];
 page.on('console',m=>{
  if(m.text().startsWith('CSPVIOLATION ')){csp.push(m.text().slice(13));cspViolations++;return;}
  if(m.type()==='error'&&!/Content Security Policy/.test(m.text()))errors.push('console: '+m.text().slice(0,200));
 });
 page.on('requestfailed',r=>failed.push('failed '+r.url().slice(0,140)));
 page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url().slice(0,140));});
 page.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&!u.protocol.startsWith('data'))external.add(u.origin);});
 const started=Date.now();
 const res=await page.goto(base+path,{waitUntil:'networkidle',timeout:45000});
 await page.waitForTimeout(1200);
 if(action)await action(page);
 const file=outDir+'/'+name+'.jpg';
 const jpg=await page.screenshot({type:'jpeg',quality:55});
 writeFileSync(file,jpg);
 const b64=jpg.toString('base64');
 const parts=Math.ceil(b64.length/CHUNK);
 for(let i=0;i<parts;i++)console.log('VISUALSHOT|'+name+'|'+(i+1)+'|'+parts+'|'+b64.slice(i*CHUNK,(i+1)*CHUNK));
 const entry={name,path,status:res?.status()??0,ms:Date.now()-started,bytes:jpg.length,errors,failed,csp,external:[...external]};
 report.push(entry);
 if(entry.status<200||entry.status>=400)throw Error(name+' page returned HTTP '+entry.status);
 console.log('VISUAL '+name+' '+path+' HTTP '+entry.status+' in '+entry.ms+'ms; errors='+errors.length
  +' failedRequests='+failed.length+' cspViolations='+csp.length+' thirdPartyOrigins='+(entry.external.join(',')||'none'));
 for(const line of [...errors,...failed,...csp.map(v=>'csp: '+v)])console.log('  - '+line);
}

const sample=await publicPreviewSample();
const previewId=sample.id;
await shot('01-home-mobile-first-visit',{firstVisit:true});
await shot('02-home-mobile-light');
await shot('03-home-mobile-dark',{dark:true});
await shot('04-menu-mobile-light',{action:async page=>{await page.click('#echo-tutorial-visitor-menu');await page.waitForTimeout(700);}});
if(previewId)await shot('05-preview-mobile-light',{path:'/preview/'+encodeURIComponent(previewId)});
else console.log('VISUAL 05-preview-mobile-light skipped: no public preview id');
await shot('06-profile-mobile-light',{path:'/profile'});
await shot('07-privacy-mobile-light',{path:'/privacy'});
await shot('08-home-desktop-light',{viewport:DESKTOP,mobile:false});
await shot('09-stats-mobile-light',{path:'/stats'});
await shot('10-favorites-mobile-light',{path:'/favorites'});
await shot('11-notifications-mobile-light',{path:'/notifications'});
if(sample.speaker)await shot('12-speaker-mobile-light',{path:'/speaker/'+encodeURIComponent(sample.speaker)});
else console.log('VISUAL 12-speaker-mobile-light skipped: no single public speaker name');
await browser.close();

writeFileSync(outDir+'/report.json',JSON.stringify(report,null,1));
const thirdParty=report.flatMap(r=>r.external);
console.log('Visual check: '+report.length+' screenshots, '+shotFailures+' failed, uncaught page errors='+uncaught+', CSP violations='+cspViolations
 +', third-party origins='+(thirdParty.length?[...new Set(thirdParty)].join(','):'none'));
// Failed pages, uncaught exceptions, CSP-blocked resources or any third-party request are regressions.
if(shotFailures>0||uncaught>0||cspViolations>0||thirdParty.length>0)process.exitCode=1;
