import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handlePreviewRequest} from '../worker/echoPreview.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base='https://echo-api-staging.starry-phd.workers.dev';

test('staging preview uses its own Worker, workers.dev and no domains or databases',()=>{
 const conf=read('wrangler.echo-preview.toml');
 assert.match(conf,/name = "echo-api-staging"/);
 assert.match(conf,/workers_dev = true/);
 assert.doesNotMatch(conf,/custom_domain = true|routes =|\[\[d1_databases\]\]|\[\[r2_buckets\]\]/);
 assert.match(read('.gitleaks.toml'),/starry-battery-service-key/);
 assert.match(read('.gitleaks.toml'),/sbk_/);
});

test('staging page is honest about web callback allow-list and never requests an access token',async()=>{
 const res=await handlePreviewRequest(new Request(base+'/'),{});
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/echo-api-staging/);
 assert.match(html,/echo\.starry\.phd/);
 assert.match(html,/不能直接在這裡進行網頁登入/);
 assert.doesNotMatch(html,/type="password"/);
 assert.equal(res.headers.get('cache-control'),'no-store');
});

test('status endpoint checks live Starry ID app configuration without changing it',async()=>{
 const saved=globalThis.fetch;const hits=[];
 try{
  globalThis.fetch=async(input)=>{
   const url=String(input);
   hits.push(url);
   if(url.endsWith('/v1/apps/echo/config'))return Response.json({app_id:'echo',status:'active'});
   if(url.endsWith('/v1/health'))return Response.json({status:'ok'});
   throw new Error('Unexpected upstream URL');
  };
  const res=await handlePreviewRequest(new Request(base+'/api/status'),{});
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.app_status,'active');
  assert.equal(body.id_health,true);
  assert.equal(body.can_login_from_preview,false);
  assert.deepEqual(hits,['https://id.starry.phd/v1/apps/echo/config','https://id.starry.phd/v1/health']);
 }finally{globalThis.fetch=saved;}
});

test('Battery requires verified Starry Echo access token; no unauthorized reserve or deduction',async()=>{
 const readBalance=await handlePreviewRequest(new Request(base+'/api/battery/balance'),{});
 const smoke=await handlePreviewRequest(new Request(base+'/api/battery/smoke',{method:'POST'}),{});
 assert.equal(readBalance.status,401);
 assert.equal(smoke.status,401);
 assert.match(read('worker/echoPreview.ts'),/task_type:'echo\.ai',units:1/);
 assert.match(read('worker/echoPreview.ts'),/\/release/);
 assert.doesNotMatch(read('worker/echoPreview.ts'),/\/commit/);
 assert.match(read('worker/echoPreview.ts'),/STARRY_BATTERY_KEY/);
});
