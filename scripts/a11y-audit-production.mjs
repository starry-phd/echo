// Read-only accessibility audit of the live public site with axe-core in real Chromium.
// Runs after each successful Production deploy (.github/workflows/visual-check.yml).
// GET page loads only; axe is injected into a separate context that bypasses the
// site's CSP for this test only (the CSP itself is verified by the screenshot step).
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import {IMPACTS,failsThreshold,summarizeViolations} from './a11y-summary.mjs';

const PRODUCTION='https://echo-starry.starry-phd.workers.dev';
const base=(process.env.ECHO_VISUAL_BASE||PRODUCTION).replace(/\/$/,'');
if(base!==PRODUCTION&&!/^http:\/\/127\.0\.0\.1:\d{2,5}$/.test(base))throw Error('Unexpected a11y-audit origin');
const axePath=process.env.ECHO_AXE_PATH||createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const axeSource=readFileSync(axePath,'utf8');
// Impacts at or above this level fail the job ('none' = report only).
const FAIL_ON=process.env.ECHO_A11Y_FAIL_ON||'none';
const PREFS={tutorialOff:'echostars_guest_safe_tutorial_never_remind_v1',palette:'sq_light_palette_v1',dark:'echo-ui-dark'};
const MOBILE={width:390,height:844};

async function samplePaths(){
 try{
  const tracks=(await (await fetch(base+'/api/v1/previews')).json())?.tracks;
  const id=tracks?.[0]?.id;
  const speaker=tracks?.map(t=>t?.speaker).find(s=>typeof s==='string'&&s&&s.length<=40&&!/[&、,，/]/.test(s));
  return {preview:typeof id==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(id)?'/preview/'+encodeURIComponent(id):null,
   speaker:speaker?'/speaker/'+encodeURIComponent(speaker):null};
 }catch{return {preview:null,speaker:null};}
}

{
 const browser=await chromium.launch();
 const samples=await samplePaths();
 const pages=[
  ['home-light','/',{}],['home-dark','/',{dark:true}],
  ['menu-open','/',{action:async p=>{await p.click('#echo-tutorial-visitor-menu');await p.waitForTimeout(700);}}],
  ...(samples.preview?[['preview',samples.preview,{}]]:[]),
  ['profile','/profile',{}],['privacy','/privacy',{}],['stats','/stats',{}],
  ['favorites','/favorites',{}],['notifications','/notifications',{}],
  ...(samples.speaker?[['speaker',samples.speaker,{}]]:[])
 ];
 const results=[];let failed=false;
 for(const [name,path,{dark=false,action}] of pages){
  const context=await browser.newContext({viewport:MOBILE,deviceScaleFactor:1,isMobile:true,hasTouch:true,
   locale:'zh-TW',reducedMotion:'reduce',colorScheme:dark?'dark':'light',bypassCSP:true});
  await context.addInitScript(([keys,isDark])=>{try{localStorage.setItem(keys.tutorialOff,'1');
   localStorage.setItem(keys.palette,'rose');localStorage.setItem(keys.dark,isDark?'1':'0');}catch{}},[PREFS,dark]);
  try{
   const page=await context.newPage();
   await page.goto(base+path,{waitUntil:'networkidle',timeout:45000});
   await page.waitForTimeout(1000);
   if(action)await action(page);
   await page.addScriptTag({content:axeSource});
   const raw=await page.evaluate(async()=>{
    const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},resultTypes:['violations']});
    return r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target}))}));
   });
   const summary=summarizeViolations(raw);
   results.push({name,path,violations:summary});
   console.log('A11Y '+name+' '+path+': '+summary.length+' rule(s) violated'
    +(summary.length?' — '+IMPACTS.slice().reverse().map(i=>i+'='+summary.filter(v=>v.impact===i).length).join(' '):''));
   for(const v of summary)console.log('  - ['+v.impact+'] '+v.id+' ×'+v.nodes+': '+v.help+' | '+v.targets.join(' ; '));
   if(failsThreshold(summary,FAIL_ON))failed=true;
  }catch(error){
   failed=true;
   console.log('A11Y '+name+' FAILED: '+String(error instanceof Error?error.message:error).split('\n')[0].slice(0,200));
  }finally{await context.close();}
 }
 await browser.close();
 writeFileSync(process.env.ECHO_A11Y_REPORT||'a11y-report.json',JSON.stringify(results,null,1));
 const byRule=new Map();
 for(const r of results)for(const v of r.violations)byRule.set(v.id+' ['+v.impact+']',(byRule.get(v.id+' ['+v.impact+']')??0)+v.nodes);
 console.log('A11y audit: '+results.length+' pages, '+byRule.size+' distinct rule violations'
  +(byRule.size?': '+[...byRule].map(([k,n])=>k+' ×'+n).join(', '):'')+'; fail-on='+FAIL_ON);
 if(failed)process.exitCode=1;
}
