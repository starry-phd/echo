import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handlePreviewRequest,isPreviewPublicRoute} from '../worker/echoPreview.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base='https://echo-api-staging.starry-phd.workers.dev';

test('staging preview uses its own Worker, workers.dev and no domains or databases',()=>{
 const conf=read('wrangler.echo-preview.toml');
 assert.match(conf,/name = "echo-api-staging"/);
 assert.match(conf,/workers_dev = true/);
 assert.doesNotMatch(conf,/custom_domain = true|routes =|\[\[d1_databases\]\]|\[\[r2_buckets\]\]/);
 assert.match(conf,/\[assets\][\s\S]*directory = "\.\/dist"/);
 assert.match(conf,/run_worker_first = \["\/api\/\*", "\/integration"\]/);
 assert.match(conf,/binding = "ECHO_PUBLIC_SERVICE"/);
 assert.match(conf,/service = "echo-starry"/);
 assert.match(read('.gitleaks.toml'),/starry-battery-service-key/);
 assert.match(read('.gitleaks.toml'),/sbk_/);
});

test('staging page is honest about web callback allow-list and never requests an access token',async()=>{
 const res=await handlePreviewRequest(new Request(base+'/integration'),{});
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/echo-api-staging/);
 assert.match(html,/原網域 302 轉址保持不變/);
 assert.match(html,/Starry ID 已登記正式網站及本測試網域/);
 assert.match(html,/href="\/profile"/);
 assert.doesNotMatch(html,/type="password"/);
 assert.equal(res.headers.get('cache-control'),'no-store');
});

test('the real Expo Web homepage and routes are served from the preview assets, not the diagnostic page',async()=>{
 const hits=[];
 const res=await handlePreviewRequest(new Request(base+'/'),{ASSETS:{fetch:async request=>{
  hits.push(request.url);return new Response('<!doctype html><html><title>繁星回聲 Echo</title><script src="/_expo/static/js/index.js"></script></html>',{
   headers:{'content-type':'text/html'}
  });
 }}});
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/繁星回聲 Echo/);
 assert.match(html,/_expo\/static/);
 assert.doesNotMatch(html,/串接驗證/);
 assert.deepEqual(hits,[base+'/']);
});

test('only publicly approved GET/HEAD endpoints are forwarded, with all member credentials removed',async()=>{
 for(const route of ['/api/v1/health','/api/v1/previews','/api/v1/previews/123/cover','/api/v1/catalog','/api/v1/speakers'])
  assert.equal(isPreviewPublicRoute(route,'GET'),true,route);
 for(const route of ['/api/v1/tracks/1/stream','/api/v1/members/me','/api/v1/admin','/api/battery/smoke','/api/v1/previews/1/cover/other'])
  assert.equal(isPreviewPublicRoute(route,'GET'),false,route);
 assert.equal(isPreviewPublicRoute('/api/v1/previews','POST'),false);
 const hits=[];
 const env={ECHO_PUBLIC_SERVICE:{fetch:async request=>{
  hits.push(request);
  return Response.json({tracks:[{id:'public-1'}]});
 }}};
 const request=new Request(base+'/api/v1/previews?q=test',{headers:{
  Authorization:'Bearer no',Cookie:'session=secret','x-starry-app-key':'secret','Accept':'application/json'
 }});
 const result=await handlePreviewRequest(request,env);
 assert.equal(result.status,200);
 assert.equal((await result.json()).tracks.length,1);
 assert.equal(hits.length,1);
 assert.equal(hits[0].url,'https://echo.starry.phd/api/v1/previews?q=test');
 assert.equal(hits[0].headers.get('authorization'),null);
 assert.equal(hits[0].headers.get('cookie'),null);
 assert.equal(hits[0].headers.get('x-starry-app-key'),null);
 const denied=await handlePreviewRequest(new Request(base+'/api/v1/tracks/private-1/stream'),env);
 assert.equal(denied.status,404);
});

test('status endpoint checks live Starry ID app configuration without changing it',async()=>{
 const saved=globalThis.fetch;const hits=[];
 try{
  globalThis.fetch=async(input)=>{
   const url=input instanceof Request?input.url:String(input);
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
  assert.equal(body.can_login_from_preview,true);
  assert.equal(body.callback_registered,base);
  assert.deepEqual(hits,['https://id.starry.phd/v1/apps/echo/config','https://id.starry.phd/v1/health']);
 }finally{globalThis.fetch=saved;}
});

test('Battery requires verified Starry Echo access token; no unauthorized reserve or deduction',async()=>{
 const readBalance=await handlePreviewRequest(new Request(base+'/api/battery/balance'),{});
 const smoke=await handlePreviewRequest(new Request(base+'/api/battery/smoke',{method:'POST'}),{});
 assert.equal(readBalance.status,401);
 assert.equal(smoke.status,401);
 assert.match(read('worker/echoPreview.ts'),/taskType:'echo\.preview-check',taskLabel:'測試預留後釋放',units:1/);
 assert.match(read('worker/echoPreview.ts'),/\/release/);
 assert.doesNotMatch(read('worker/echoPreview.ts'),/\/commit/);
 assert.match(read('worker/echoPreview.ts'),/STARRY_BATTERY_KEY/);
});
