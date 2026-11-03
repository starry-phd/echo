import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {STARRY_ID_APP_ID,STARRY_ID_ENVIRONMENTS,resolveStarryIdEnvironment,starryIdApiUrl} from '../src/auth/starryId/env.ts';
import {StarryIdError,parseStarryIdError} from '../src/auth/starryId/errors.ts';
import {STARRY_MEMBER_FALLBACK_NAME,memberMayUseFeatures,parseStarryMe} from '../src/auth/starryId/member.ts';
import {compareAppVersions,evaluateAppAvailability,memberFeaturesAvailable,parseStarryAppConfig} from '../src/auth/starryId/appConfig.ts';
import {parseSignInResponse,parseTokenPair} from '../src/auth/starryId/tokens.ts';
import {createMemoryRefreshTokenStore,createSessionStorageRefreshTokenStore,STARRY_REFRESH_TOKEN_KEY} from '../src/auth/starryId/storage.ts';
import {createStarryIdSession} from '../src/auth/starryId/session.ts';
import {APPLE_RELAY_RETURN_URL,appleRelaySignInBody,buildAppleRelayStartUrl,parseAppleRelayReturn} from '../src/auth/starryId/appleRelay.ts';
import {centralMemberApiState,getCentralMemberProfile} from '../src/auth/centralMember.ts';

const fixture=name=>JSON.parse(readFileSync(new URL('./fixtures/starry-id/'+name,import.meta.url),'utf8'));
// Fixture tokens are human-readable placeholders; real tokens never contain spaces.
const withTokens=(body,access='eyJhbGciOiJFUzI1NiJ9.a.b',refresh='session1.secret1')=>({...body,access_token:access,refresh_token:refresh});
const prod=resolveStarryIdEnvironment('https://id.starry.phd');
const staging=resolveStarryIdEnvironment('https://starry-id-staging.starry-phd.workers.dev/');

test('only the two published Starry ID origins are accepted; tokens only go to relative /v1 paths',()=>{
 assert.equal(STARRY_ID_APP_ID,'echo');
 assert.deepEqual(prod,{name:'production',baseUrl:'https://id.starry.phd',issuer:'starry-id:production'});
 assert.equal(staging.issuer,'starry-id:staging');
 for(const bad of [undefined,null,'','http://id.starry.phd','https://id.starry.phd.evil.example','https://evil.example',
  'https://echo.starry.phd','https://ID.starry.phd'])assert.equal(resolveStarryIdEnvironment(bad),null,String(bad));
 assert.equal(starryIdApiUrl(prod,'/v1/me'),'https://id.starry.phd/v1/me');
 assert.equal(starryIdApiUrl(prod,'/v1/apps/echo/config'),'https://id.starry.phd/v1/apps/echo/config');
 for(const bad of ['https://evil.example/v1/me','//evil.example/v1/me','/v1/../admin','/account','v1/me','/v1/me?x=<'])
  assert.throws(()=>starryIdApiUrl(prod,bad),String(bad));
 assert.equal(Object.keys(STARRY_ID_ENVIRONMENTS).length,2);
});

test('error envelope from the fixtures maps to the documented app actions; garbage fails closed',()=>{
 const e=parseStarryIdError(401,fixture('error.json'));
 assert.ok(e instanceof StarryIdError);
 assert.equal(e.code,'UNAUTHORIZED');assert.equal(e.action,'refresh');assert.match(e.requestId,/^5f0c8a2e/);
 const table={REFRESH_REUSED:'sign-in',INVALID_REFRESH:'sign-in',INVALID_NONCE:'retry-sign-in',ACCOUNT_SUSPENDED:'suspended',
  ACCOUNT_PENDING_DELETION:'pending-deletion',APP_UNAVAILABLE:'maintenance',VERSION_CONFLICT:'reload-profile',
  IDENTITY_IN_USE:'merge-prompt',RATE_LIMITED:'retry-later',AUTH_NOT_CONFIGURED:'fail-closed'};
 for(const [code,action] of Object.entries(table))
  assert.equal(parseStarryIdError(400,{error:{code,message:'x',request_id:'r'}}).action,action,code);
 assert.equal(parseStarryIdError(429,{error:{code:'RATE_LIMITED',message:'',request_id:''}},'30').retryAfterSeconds,30);
 for(const body of [null,'<html>',{error:'x'},[],{error:{code:'lower'}}])
  assert.equal(parseStarryIdError(502,body).action,'fail-closed');
 assert.equal(parseStarryIdError(418,{error:{code:'NEW_FUTURE_CODE',message:'',request_id:''}}).action,'bad-request');
});

test('GET /v1/me fixture: tolerant of extra fields, keeps only what the app displays (no e-mail/phone/birthday)',()=>{
 const me=parseStarryMe(fixture('me.200.json'));
 assert.equal(me.userId,'0193a5b2-7c4d-7e8f-9a01-23456789abcd');
 assert.equal(me.displayName,'小星');assert.equal(me.hasDisplayName,true);
 assert.equal(me.profileVersion,2);assert.equal(me.status,'active');
 assert.deepEqual({...me.consent},{termsVersion:'2026-11-03',privacyVersion:'2026-11-03.2',required:false});
 assert.equal(Object.isFrozen(me),true);
 const kept=JSON.stringify(me);
 for(const pii of ['me@example.com','+886912345678','1990-02-28','大安區','me@gmail.com'])assert.ok(!kept.includes(pii),pii);
 assert.equal(memberMayUseFeatures(me),true);
 const future={...fixture('me.200.json'),brand_new_field:{x:1}};
 assert.equal(parseStarryMe(future).userId,me.userId);
});

test('/v1/me edge cases: null name falls back to 繁星會員, unsafe avatar dropped, e-mail never accepted as identity',()=>{
 const base=fixture('me.200.json');
 const noName=parseStarryMe({...base,profile:{...base.profile,display_name:null,avatar_url:'//evil.example/a.webp'}});
 assert.equal(noName.displayName,STARRY_MEMBER_FALLBACK_NAME);assert.equal(noName.hasDisplayName,false);
 assert.equal(noName.avatarPath,null);
 assert.equal(parseStarryMe({...base,profile:{...base.profile,avatar_url:'/v1/avatars/u/a.webp'}}).avatarPath,'/v1/avatars/u/a.webp');
 for(const bad of [{...base,user_id:'me@example.com'},{...base,user_id:''},{...base,profile:{...base.profile,version:0}},
  {...base,consent:{required:'no'}},null,[]])assert.throws(()=>parseStarryMe(bad));
 const pending=parseStarryMe({...base,status:'pending_deletion',deletion_purge_at:1794000000000});
 assert.equal(pending.status,'pending_deletion');assert.equal(memberMayUseFeatures(pending),false);
 assert.equal(parseStarryMe({...base,status:'some_future_state'}).status,'unknown');
 assert.equal(memberMayUseFeatures(parseStarryMe({...base,consent:{...base.consent,required:true}})),false);
});

test('app config gate: active/paused/killed/update-required, unreachable keeps public screens but closes member features',()=>{
 const config=parseStarryAppConfig(fixture('apps-config.200.json'));
 assert.deepEqual(evaluateAppAvailability(config,'0.1.0'),{kind:'active'});
 assert.equal(memberFeaturesAvailable(evaluateAppAvailability(config,'0.1.0')),true);
 assert.deepEqual(evaluateAppAvailability({...config,status:'paused'},'0.1.0'),{kind:'paused'});
 assert.deepEqual(evaluateAppAvailability({...config,status:'killed'},'0.1.0'),{kind:'killed'});
 assert.deepEqual(evaluateAppAvailability({...config,status:'renamed_in_future'},'0.1.0'),{kind:'paused'});
 assert.deepEqual(evaluateAppAvailability({...config,minVersion:'1.0.0'},'0.1.0'),{kind:'update-required',minVersion:'1.0.0'});
 assert.deepEqual(evaluateAppAvailability(null,'0.1.0'),{kind:'unavailable'});
 assert.equal(memberFeaturesAvailable({kind:'unavailable'}),false);
 assert.equal(compareAppVersions('0.10.0','0.9.9'),1);assert.equal(compareAppVersions('1.0.0','1.0.0'),0);
 assert.throws(()=>parseStarryAppConfig({...fixture('apps-config.200.json'),app_id:'account'}));
 assert.throws(()=>parseStarryAppConfig({...fixture('apps-config.200.json'),min_version:'1.0'}));
 assert.equal(JSON.parse(readFileSync(new URL('../app.json',import.meta.url),'utf8')).expo.version,'0.1.0');
});

test('sign-in and refresh fixtures parse; malformed or non-Bearer responses are rejected',()=>{
 const s=parseSignInResponse(withTokens(fixture('auth-sign-in.200.json')));
 assert.equal(s.user.userId,'0193a5b2-7c4d-7e8f-9a01-23456789abcd');assert.equal(s.consentRequired,true);
 assert.equal(s.tokens.expiresInSeconds,900);
 assert.equal(parseTokenPair(withTokens(fixture('auth-refresh.200.json'))).refreshToken,'session1.secret1');
 assert.throws(()=>parseTokenPair(fixture('auth-refresh.200.json')),/access_token/); // placeholder contains spaces
 assert.throws(()=>parseTokenPair({...withTokens(fixture('auth-refresh.200.json')),token_type:'MAC'}));
 assert.throws(()=>parseSignInResponse({...withTokens(fixture('auth-sign-in.200.json')),user:{user_id:'a@b.c',status:'active',is_new:false}}));
});

function fakeApi(handler){
 const calls=[];
 const fetch=async(url,init)=>{
  calls.push({url,...init,body:init.body?JSON.parse(init.body):undefined});
  const [status,body,headers={}]=await handler(url,init,calls.length);
  return {status,json:async()=>body,headers:{get:name=>headers[name]??null}};
 };
 return {fetch,calls};
}
const refreshed=n=>[200,withTokens(fixture('auth-refresh.200.json'),'eyJ.new'+n+'.x','session1.rotated'+n)];

test('session: concurrent 401s trigger exactly ONE refresh, the rotated token replaces the old one, then both retry',async()=>{
 const store=createMemoryRefreshTokenStore();
 let release;const gate=new Promise(r=>{release=r;});
 const api=fakeApi(async(url,init)=>{
  if(url.endsWith('/v1/auth/refresh')){await gate;return refreshed(1);}
  return init.headers.authorization==='Bearer eyJ.new1.x'?[200,fixture('me.200.json')]:[401,fixture('error.json')];
 });
 const session=createStarryIdSession({env:prod,store,fetch:api.fetch});
 await session.adoptTokens({accessToken:'eyJ.expired.x',expiresInSeconds:900,refreshToken:'session1.original'});
 const both=Promise.all([session.request('/v1/me'),session.request('/v1/me')]);
 await new Promise(r=>setTimeout(r,10));release();
 const [a,b]=await both;
 assert.equal(a.user_id,b.user_id);
 const refreshCalls=api.calls.filter(c=>c.url.endsWith('/v1/auth/refresh'));
 assert.equal(refreshCalls.length,1);
 assert.deepEqual(refreshCalls[0].body,{refresh_token:'session1.original'});
 assert.equal(await store.get(),'session1.rotated1');
 for(const c of api.calls){
  assert.ok(c.url.startsWith('https://id.starry.phd/v1/'));
  assert.equal(c.credentials,undefined);
 }
});

test('session: REFRESH_REUSED / INVALID_REFRESH revoke locally and sign out; network failure keeps the token and fails closed',async()=>{
 for(const code of ['REFRESH_REUSED','INVALID_REFRESH']){
  const store=createMemoryRefreshTokenStore('session1.stolen');
  const reasons=[];
  const api=fakeApi(async url=>url.endsWith('/v1/auth/refresh')?[401,{error:{code,message:'',request_id:''}}]:[401,fixture('error.json')]);
  const session=createStarryIdSession({env:prod,store,fetch:api.fetch,onSignedOut:r=>reasons.push(r)});
  await assert.rejects(session.request('/v1/me'),e=>e.code==='INVALID_REFRESH');
  assert.equal(await store.get(),null);assert.deepEqual(reasons,[code]);
  assert.equal(api.calls.some(c=>c.url.endsWith('/v1/me')),false,'no member call without a token');
 }
 const store=createMemoryRefreshTokenStore('session1.kept');
 const down=fakeApi(async()=>[503,'<html>']);
 const session=createStarryIdSession({env:prod,store,fetch:down.fetch});
 await assert.rejects(session.request('/v1/me'),e=>e.action==='fail-closed');
 assert.equal(await store.get(),'session1.kept');
});

test('session: non-auth errors pass through unchanged (no refresh loop), signed-out session never calls the API',async()=>{
 const api=fakeApi(async url=>url.endsWith('/v1/me/profile')?[409,fixture('me-profile.409.json')]:refreshed(9));
 const session=createStarryIdSession({env:prod,store:createMemoryRefreshTokenStore(),fetch:api.fetch});
 await session.adoptTokens({accessToken:'eyJ.ok.x',expiresInSeconds:900,refreshToken:'session1.ok'});
 await assert.rejects(session.request('/v1/me/profile',{method:'PATCH',body:{motto:'x'},headers:{'if-match':'"1"'}}),
  e=>e.code==='VERSION_CONFLICT'&&e.action==='reload-profile'&&e.body.error.code==='VERSION_CONFLICT');
 assert.equal(api.calls.filter(c=>c.url.endsWith('/v1/auth/refresh')).length,0);
 assert.equal(api.calls[0].headers['if-match'],'"1"');
 const empty=fakeApi(async()=>[200,{}]);
 const signedOut=createStarryIdSession({env:prod,store:createMemoryRefreshTokenStore(),fetch:empty.fetch});
 await assert.rejects(signedOut.request('/v1/me'),e=>e.code==='INVALID_REFRESH');
 assert.equal(empty.calls.length,0);
});

test('web token storage: sessionStorage only (never localStorage), storage failures degrade safely',async()=>{
 const map=new Map();
 const ss={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const store=createSessionStorageRefreshTokenStore(ss);
 await store.set('session1.a');assert.equal(map.get(STARRY_REFRESH_TOKEN_KEY),'session1.a');
 await store.clear();assert.equal(await store.get(),null);
 const broken={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');},removeItem(){throw new Error('denied');}};
 const fallback=createSessionStorageRefreshTokenStore(broken);
 await fallback.set('session1.b');assert.equal(await fallback.get(),'session1.b');
 await fallback.clear();assert.equal(await fallback.get(),null);
 for(const f of readdirSync(new URL('../src/auth/starryId/',import.meta.url))){
  const src=readFileSync(new URL('../src/auth/starryId/'+f,import.meta.url),'utf8')
   .replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');
  assert.doesNotMatch(src,/localStorage|AsyncStorage|credentials:\s*['"]include/,f);
 }
});

test('Android Apple relay: only the nonce hash leaves the app, state is verified, raw nonce goes to Starry ID',()=>{
 const raw=fixture('auth-nonce.200.json').nonce;
 const hash=createHash('sha256').update(raw).digest('hex');
 const state='st_'+'a'.repeat(29);
 const url=buildAppleRelayStartUrl(prod,hash,state);
 assert.equal(url,'https://id.starry.phd/auth/apple/start?app_id=echo&nonce='+hash
  +'&return=echostarry%3A%2F%2Fauth%2Fapple&state='+state);
 assert.ok(!url.includes(raw));
 assert.throws(()=>buildAppleRelayStartUrl(prod,raw,state),/SHA-256/);
 assert.throws(()=>buildAppleRelayStartUrl(prod,hash,'short'));
 assert.equal(buildAppleRelayStartUrl(staging,hash,state).startsWith('https://starry-id-staging.starry-phd.workers.dev/auth/apple/start?'),true);
 const ok=parseAppleRelayReturn(APPLE_RELAY_RETURN_URL+'?id_token=h.p.s&code=c1&state='+state,state);
 assert.deepEqual(ok,{kind:'success',idToken:'h.p.s',code:'c1'});
 assert.deepEqual(appleRelaySignInBody(prod,ok,raw),{app_id:'echo',id_token:'h.p.s',nonce:raw,
  authorization_code:'c1',redirect_uri:'https://id.starry.phd/auth/apple/callback'});
 assert.deepEqual(parseAppleRelayReturn(APPLE_RELAY_RETURN_URL+'?error=user_cancelled&state='+state,state),
  {kind:'error',error:'user_cancelled'});
 for(const bad of [APPLE_RELAY_RETURN_URL+'?id_token=h.p.s&state=other_state_value_123',
  'https://evil.example/auth/apple?id_token=h.p.s&state='+state,
  'echostarry://auth/applex?id_token=h.p.s&state='+state,
  APPLE_RELAY_RETURN_URL+'?id_token=h.p.s&state='+state+'&state='+state,
  APPLE_RELAY_RETURN_URL+'?id_token=notajwt&state='+state])
  assert.throws(()=>parseAppleRelayReturn(bad,state),bad);
 assert.equal(JSON.parse(readFileSync(new URL('../app.json',import.meta.url),'utf8')).expo.scheme,'echostarry');
});

test('superseded five-field DTO is gone; screens reach Starry ID only through the gated provider',async()=>{
 assert.equal(centralMemberApiState(),'not-configured');
 await assert.rejects(getCentralMemberProfile(),/尚未開放/);
 for(const dir of ['../app/','../src/ui/']){
  const walk=d=>readdirSync(new URL(d,import.meta.url),{withFileTypes:true}).flatMap(e=>
   e.isDirectory()?walk(d+e.name+'/'):[d+e.name]);
  for(const file of walk(dir)){
   const src=readFileSync(new URL(file,import.meta.url),'utf8');
   assert.doesNotMatch(src,/starryId\/session|createStarryIdSession/,file+' must use StarryIdProvider, not raw sessions');
  }
 }
 const ci=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
 assert.doesNotMatch(ci,/EXPO_PUBLIC_STARRY_ID_API_BASE_URL/);
});
