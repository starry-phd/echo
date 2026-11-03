import {readFileSync} from 'node:fs';
import {ECHO_ACCOUNT_ID,ECHO_WORKER,CUSTOM_HOSTNAME,classifyCustomDomain,
 latestDeployment,parseUploadedVersionId,validateLiveDeployment} from './cloudflare-production-validation.mjs';

// Read-only Cloudflare API evidence after `wrangler deploy`. Only GET requests;
// no upload, rollback, routing, DNS or secret change. Never prints the token.
const token=process.env.CLOUDFLARE_API_TOKEN;
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const logPath=process.env.WRANGLER_DEPLOY_LOG||'/tmp/echo-wrangler-deploy.log';
if(!token)throw Error('Missing CLOUDFLARE_API_TOKEN');
if(account!==ECHO_ACCOUNT_ID)throw Error('Unexpected Cloudflare account');
const uploaded=parseUploadedVersionId(readFileSync(logPath,'utf8'));
console.log('Uploaded Worker version from this run: '+uploaded);

const api='https://api.cloudflare.com/client/v4/accounts/'+ECHO_ACCOUNT_ID;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(path){
 const r=await fetch(api+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
 let payload=null;
 try{payload=await r.json();}catch{payload=null;}
 return {status:r.status,payload};
}
async function eventually(label,operation,attempts=6){
 let last;
 for(let n=1;n<=attempts;n++){
  try{return await operation();}
  catch(e){
   last=e;
   console.log(label+' attempt '+n+'/'+attempts+': '+String(e instanceof Error?e.message:e).slice(0,160));
   if(n<attempts)await pause(n*2000);
  }
 }
 throw Error(label+' failed after '+attempts+' attempts: '+String(last instanceof Error?last.message:last));
}

const live=await eventually('Cloudflare latest+exact deployment',async()=>{
 const list=await get('/workers/scripts/'+ECHO_WORKER+'/deployments');
 const latest=latestDeployment(list.status,list.payload);
 const exact=await get('/workers/scripts/'+ECHO_WORKER+'/deployments/'+encodeURIComponent(latest.id));
 return validateLiveDeployment(latest,exact.status,exact.payload,uploaded);
});
console.log('Cloudflare latest == exact deployment '+live.deploymentId+': version '+live.versionId+
 ' at 100% traffic, created '+live.createdOn+' (account '+ECHO_ACCOUNT_ID+', Worker '+ECHO_WORKER+')');

const custom=await eventually('Cloudflare custom domain',async()=>{
 const domain=await get('/workers/domains?hostname='+encodeURIComponent(CUSTOM_HOSTNAME));
 return classifyCustomDomain(domain.status,domain.payload);
},3);
if(custom.state==='verified')console.log('Cloudflare custom domain '+CUSTOM_HOSTNAME+' bound to '+ECHO_WORKER);
else console.log('::warning::Cloudflare custom domain '+CUSTOM_HOSTNAME+' UNVERIFIED: '+custom.reason);
