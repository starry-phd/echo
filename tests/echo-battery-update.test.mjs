import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {Starry,StarryError} from '../worker/vendor/starry-sdk.ts';
import {echoBatteryError,echoBatterySettings,executePricedEchoTask} from '../worker/echoBatterySettings.ts';
import {verifyEchoAccessToken} from '../worker/starryIdentity.ts';

const origin='https://echo-api-staging.starry-phd.workers.dev';
const bearer='Bearer placeholder';
const req=(method='GET',path='/api/v1/battery/task-settings',data)=>new Request(origin+path,{
 method,headers:{authorization:bearer,'content-type':'application/json'},
 ...(data?{body:JSON.stringify(data)}:{})
});
const rows=[{task_type:'echo.ai',task_label:'AI 任務',units:3,updated_at:1,updated_by_user_id:'member-id'}];
function fakeDb(){
 const calls=[];
 return {calls,prepare(sql){
  calls.push(sql);
  return {bind(...args){calls.push(args);return this;},
   async all(){return {results:rows}},
   async first(){return rows[0]},
   async run(){calls.push('RUN');return {success:true};}
  };
 }};
}
const access={
 verifyToken:async()=> 'signed-token',
 starry:()=>({me:async()=>({user_id:'member-id',staff_role:'owner',status:'active',consent:{required:false}}),
  withBattery:async(_token,_price,run)=>run({reservation_id:'mock',quantum_amount:0})})
};

test('task-price settings are editable ONLY by a fresh Starry owner and persist to Echo D1',async()=>{
 const db=fakeDb(),env={DB:db};
 const get=await echoBatterySettings(req(),env,access);
 assert.equal(get.status,200);
 assert.equal((await get.json()).tasks[0].units,3);
 const save=await echoBatterySettings(req('PATCH',undefined,{task_type:'echo.ai',task_label:'文字處理',units:9}),env,access);
 assert.equal(save.status,200);
 const j=await save.json();
 assert.equal(j.task.units,9);
 assert.ok(db.calls.includes('RUN'));
 assert.ok(db.calls.some(x=>Array.isArray(x)&&x.includes('member-id')),'D1 tracks server-verified owner id');
});

test('no admin privilege from UI or email: backend independently checks JWT and staff_role',async()=>{
 const db=fakeDb(),env={DB:db};
 for(const role of [null,'admin','support']){
  const deps={...access,starry:()=>({...access.starry(),me:async()=>({user_id:'member-id',staff_role:role,status:'active',consent:{required:false}})})};
  const res=await echoBatterySettings(req('PATCH',undefined,{task_type:'echo.ai',task_label:'AI',units:99}),env,deps);
  assert.equal(res.status,403,role);
 }
 assert.equal((await echoBatterySettings(req('PATCH',undefined,{task_type:'echo.ai',task_label:'AI',units:1}),env,
  {...access,verifyToken:async()=>null})).status,401);
 assert.equal((await echoBatterySettings(req('PATCH',undefined,{task_type:'echo.ai',task_label:'AI',units:1}),env,
  {...access,starry:()=>({...access.starry(),me:async()=>{throw new Error('unreachable')}})})).status,503);
 assert.equal(db.calls.length,0,'no DB mutation/read before role verification');
});

test('task types, units and labels are validated server-side, not trusted from client',async()=>{
 const db=fakeDb(),env={DB:db};
 for(const input of [
  {task_type:'other.ai',task_label:'AI',units:1},
  {task_type:'echo.ai',task_label:'AI',units:0},
  {task_type:'echo.ai',task_label:'AI',units:101},
  {task_type:'echo.ai',task_label:'AI',units:1.5},
  {task_type:'echo.ai',task_label:'',units:1},
  {task_type:'echo.ai',task_label:'x'.repeat(41),units:1}
 ]){
  const res=await echoBatterySettings(req('PATCH',undefined,input),env,access);
  assert.equal(res.status,400,JSON.stringify(input));
 }
 assert.equal(db.calls.length,0);
});

test('actual priced tasks take units from Echo D1 and cannot run if Starry reserve fails',async()=>{
 const db=fakeDb(),env={DB:db,STARRY_BATTERY_KEY:'configured-by-worker-secret'};
 let calls=0,inputs=[];
 const happy={...access,starry:()=>({...access.starry(),withBattery:async(token,price,run)=>{
  inputs.push({token,price});return run({reservation_id:'mock-reservation',quantum_amount:2});
 }})};
 assert.equal(await executePricedEchoTask(req('POST'),env,'echo.ai',async()=>{calls++;return 123},happy),123);
 assert.equal(calls,1);
 assert.deepEqual(inputs[0].price,{taskType:'echo.ai',taskLabel:'AI 任務',units:3});
 for(const [status,code] of [[409,'BATTERY_APP_CAP'],[503,'SERVICE_UNAVAILABLE']]){
  const denied={...access,starry:()=>({...access.starry(),withBattery:async()=>{throw new StarryError(status,code,'blocked',{})}})};
  await assert.rejects(executePricedEchoTask(req('POST'),env,'echo.ai',async()=>{calls++;return 99},denied),
   e=>e instanceof StarryError&&e.code===code);
  assert.equal(calls,1,'AI work must not run when reserve fails');
  const mapped=echoBatteryError(new StarryError(status,code,'blocked',{}));
  assert.equal(mapped.status,status);
  assert.match(mapped.message,/稍後再試/);
 }
 const offline={...access,starry:()=>({...access.starry(),me:async()=>{throw new Error('network outage')}})};
 await assert.rejects(executePricedEchoTask(req('POST'),env,'echo.ai',async()=>{calls++;return 99},offline));
 assert.equal(calls,1,'No AI work when Starry ID is unreachable');
});

test('official single-file SDK honors Quantum Battery fields; reserve, commit, release use backend key only',async()=>{
 const calls=[];
 const sdk=new Starry({baseUrl:'https://id.starry.phd',serviceKey:'mock-service-secret',fetch:async(url,init)=>{
  calls.push({url,init});
  if(String(url).endsWith('/v1/battery/reservations')){
   return Response.json({reservation_id:'r1',status:'reserved',task_type:'echo.ai',units:3,amount:3,quantum_amount:2,
    quantum_charged:null,created_at:0,expires_at:30000,replayed:false,charged:null},{status:201});
  }
  if(String(url).endsWith('/commit'))return Response.json({reservation_id:'r1',status:'committed',quantum_charged:2});
  if(String(url).endsWith('/release'))return Response.json({reservation_id:'r1',status:'released',quantum_charged:0});
  throw new Error('Unknown SDK endpoint');
 }});
 const done=await sdk.withBattery('member-token',{taskType:'echo.ai',taskLabel:'AI 任務',units:3},
   async reservation=>{assert.equal(reservation.quantum_amount,2);return 'ok';});
 assert.equal(done,'ok');
 assert.equal(calls.length,2);
 assert.ok(calls[0].init.headers['x-starry-app-key']);
 assert.equal(calls[0].init.headers.authorization,'Bearer member-token');
 assert.equal(JSON.parse(calls[0].init.body).task_label,'AI 任務');
 assert.equal(calls[0].init.headers['x-starry-app-key'],'mock-service-secret');
 assert.ok(!calls[1].init.headers.authorization,'commit only needs backend service key');
 assert.equal(calls[1].url.endsWith('/commit'),true);
 calls.length=0;
 await assert.rejects(sdk.withBattery('member-token',{taskType:'echo.ai',units:3},
  async()=>{throw new Error('AI task failed')}),/AI task failed/);
 assert.equal(calls.length,2);
 assert.equal(calls[1].url.endsWith('/release'),true);
});

test('JWT verifier caches JWKS and fetches new kid on a rotation without accepting invalid audiences',async()=>{
 const old=await generateKeyPair('ES256'),fresh=await generateKeyPair('ES256');
 const a={...(await exportJWK(old.publicKey)),kid:'key-old',alg:'ES256',use:'sig'};
 const b={...(await exportJWK(fresh.publicKey)),kid:'key-new',alg:'ES256',use:'sig'};
 let available=[a],fetchCount=0;
 const service={fetch:async()=>{fetchCount++;return Response.json({keys:available})}};
 const env={STARRY_ID_SERVICE:service};
 async function signed(key,kid,appId='echo'){
  return new SignJWT({app_id:appId}).setProtectedHeader({alg:'ES256',kid})
   .setIssuer('starry-id:production').setAudience('starry').setSubject('uuid-member')
   .setIssuedAt().setExpirationTime('15m').sign(key.privateKey);
 }
 const tokenOld=await signed(old,'key-old');
 assert.equal(await verifyEchoAccessToken(new Request(origin,{headers:{Authorization:'Bearer '+tokenOld}}),env),tokenOld);
 assert.equal(fetchCount,1);
 assert.equal(await verifyEchoAccessToken(new Request(origin,{headers:{Authorization:'Bearer '+tokenOld}}),env),tokenOld);
 assert.equal(fetchCount,1,'cached JWKS should not fetch on every request');
 available=[a,b];
 await new Promise(resolve=>setTimeout(resolve,1_100)); // bounded JWKS refetch cooldown
 const tokenNew=await signed(fresh,'key-new');
 assert.equal(await verifyEchoAccessToken(new Request(origin,{headers:{Authorization:'Bearer '+tokenNew}}),env),tokenNew);
 assert.ok(fetchCount>=2,'unfamiliar kid triggers a refresh');
 const otherApp=await signed(fresh,'key-new','recordnote');
 assert.equal(await verifyEchoAccessToken(new Request(origin,{headers:{Authorization:'Bearer '+otherApp}}),env),null);
 assert.equal(await verifyEchoAccessToken(new Request(origin),env),null);
});
