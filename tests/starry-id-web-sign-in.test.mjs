import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveStarryIdEnvironment} from '../src/auth/starryId/env.ts';
import {StarryIdError} from '../src/auth/starryId/errors.ts';
import {fetchAppConfig,requestNonce,signInRequestBody,signOut,requestAccountDeletion,cancelAccountDeletion,acceptCurrentConsent,fetchMe}
 from '../src/auth/starryId/memberApi.ts';
import {formatPurgeDate,stateAfterSignIn,stateFromAvailability,stateFromError,stateFromMember} from '../src/auth/starryId/memberFlow.ts';
import {completeSignIn,loadMemberState} from '../src/auth/starryId/memberSession.ts';
import {createStarryIdSession} from '../src/auth/starryId/session.ts';
import {createMemoryRefreshTokenStore} from '../src/auth/starryId/storage.ts';
import {parseStarryMe} from '../src/auth/starryId/member.ts';
import {createHash,randomBytes} from 'node:crypto';
import {WEB_RELAY_PENDING_KEY,WEB_RELAY_RETURN_URL,STAGING_WEB_ORIGIN,consumeWebRelay,prepareWebRelay,sha256Hex,webRelaySupported,webRelayReturnUrl} from '../src/auth/starryId/webRelay.ts';
import {buildRelayStartUrl,parseRelayReturn,relayRedirectUri,relaySignInBody} from '../src/auth/starryId/starryRelay.ts';
const APPLE_CALLBACK='https://id.starry.phd/auth/apple/callback';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const fixture=name=>JSON.parse(read('tests/fixtures/starry-id/'+name));
const tokens=(body,n=1)=>({...body,access_token:'eyJ.access'+n+'.x',refresh_token:'session1.r'+n});
const env=resolveStarryIdEnvironment('https://id.starry.phd');

function fakeApi(routes){
 const calls=[];
 const fetch=async(url,init)=>{
  const path=url.replace(env.baseUrl,'');
  calls.push({path,method:init.method,headers:init.headers,body:init.body?JSON.parse(init.body):undefined});
  const route=routes[init.method+' '+path];
  const [status,body]=typeof route==='function'?route(init):route??[404,{error:{code:'NOT_FOUND',message:'',request_id:''}}];
  return {status,json:async()=>body,headers:{get:()=>null}};
 };
 return {fetch,calls};
}
const deps=(api,store=createMemoryRefreshTokenStore())=>({env,fetch:api.fetch,appVersion:'0.1.0',
 session:createStarryIdSession({env,store,fetch:api.fetch})});

function memoryStorage(){const m=new Map();return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const subtle={digest:async(_alg,data)=>createHash('sha256').update(Buffer.from(data)).digest().buffer};

test('web relay: only the registered origin, only the nonce hash in the redirect, result after # and single use',async()=>{
 assert.equal(WEB_RELAY_RETURN_URL,'https://echo.starry.phd/auth/done');
 assert.equal(webRelaySupported('https://echo.starry.phd'),true);
 assert.equal(webRelaySupported(STAGING_WEB_ORIGIN),true);
 assert.equal(webRelayReturnUrl(STAGING_WEB_ORIGIN),STAGING_WEB_ORIGIN+'/auth/done');
 assert.throws(()=>webRelayReturnUrl('https://untrusted.starry-phd.workers.dev'));
 for(const o of ['http://localhost:8081','https://echo-starry.starry-phd.workers.dev',null])assert.equal(webRelaySupported(o),false);
 const raw=fixture('auth-nonce.200.json').nonce;
 assert.equal(await sha256Hex(raw,subtle),createHash('sha256').update(raw).digest('hex'));
 const storage=memoryStorage();let now=1_000_000;
 const url=await prepareWebRelay(env,'google',raw,{storage,subtle,randomBytes:n=>new Uint8Array(randomBytes(n)),now:()=>now});
 const hash=createHash('sha256').update(raw).digest('hex');
 const pending=JSON.parse(storage.m.get(WEB_RELAY_PENDING_KEY));
 assert.equal(url,'https://id.starry.phd/auth/google/start?app_id=echo&nonce='+hash
  +'&return=https%3A%2F%2Fecho.starry.phd%2Fauth%2Fdone&state='+pending.state);
 assert.ok(!url.includes(raw),'raw nonce never leaves the browser');
 assert.match(pending.state,/^[A-Za-z0-9_-]{32}$/);
 now+=60_000;
 const ok=consumeWebRelay(env,WEB_RELAY_RETURN_URL+'#id_token=h.p.s&state='+pending.state,{storage,now:()=>now});
 assert.deepEqual(ok,{kind:'success',provider:'google',nonce:raw,idToken:'h.p.s',code:null,redirectUri:null});
 assert.equal(storage.m.has(WEB_RELAY_PENDING_KEY),false,'pending entry is single use');
 assert.equal(consumeWebRelay(env,WEB_RELAY_RETURN_URL+'#id_token=h.p.s&state='+pending.state,{storage,now:()=>now}).kind,'invalid','replay refused');
});

test('preview site: Google and Apple relay return only to the authorized staging domain',async()=>{
 const raw=fixture('auth-nonce.200.json').nonce;
 const hash=createHash('sha256').update(raw).digest('hex');
 for(const provider of ['google','apple']){
  const storage=memoryStorage(),now=3_000_000;
  const dep={storage,subtle,randomBytes:n=>new Uint8Array(randomBytes(n)),now:()=>now,origin:STAGING_WEB_ORIGIN};
  const url=await prepareWebRelay(env,provider,raw,dep);
  const pending=JSON.parse(storage.getItem(WEB_RELAY_PENDING_KEY));
  assert.equal(pending.returnUrl,STAGING_WEB_ORIGIN+'/auth/done');
  assert.equal(url,'https://id.starry.phd/auth/'+provider+'/start?app_id=echo&nonce='+hash
   +'&return='+encodeURIComponent(STAGING_WEB_ORIGIN+'/auth/done')+'&state='+pending.state);
  const returned=pending.returnUrl+'#id_token=h.p.s&state='+pending.state+(provider==='apple'?'&code=apple-code':'');
  const done=consumeWebRelay(env,returned,dep);
  assert.equal(done.kind,'success');
  assert.equal(done.provider,provider);
  assert.equal(storage.getItem(WEB_RELAY_PENDING_KEY),null,'nonce and state are single use');
 }
});

test('preview cannot accept login from another registered origin or arbitrary workers.dev host',async()=>{
 const storage=memoryStorage(),now=3_000_000;
 const dep={storage,subtle,randomBytes:n=>new Uint8Array(randomBytes(n)),now:()=>now,origin:STAGING_WEB_ORIGIN};
 await prepareWebRelay(env,'google','a'.repeat(22),dep);
 const pending=JSON.parse(storage.getItem(WEB_RELAY_PENDING_KEY));
 assert.equal(consumeWebRelay(env,WEB_RELAY_RETURN_URL+'#id_token=h.p.s&state='+pending.state,dep).kind,'invalid');
 assert.equal(storage.getItem(WEB_RELAY_PENDING_KEY),null);
 await assert.rejects(prepareWebRelay(env,'google','a'.repeat(22),{...dep,origin:'https://evil.starry-phd.workers.dev'}));
});

test('web relay: Apple adds code + relay redirect_uri; wrong state, query form, stale or foreign returns are refused',async()=>{
 const storage=memoryStorage();let now=5_000_000;
 const dep={storage,subtle,randomBytes:n=>new Uint8Array(randomBytes(n)),now:()=>now};
 await prepareWebRelay(env,'apple','n'.repeat(20),dep);
 let st=JSON.parse(storage.m.get(WEB_RELAY_PENDING_KEY)).state;
 assert.deepEqual(consumeWebRelay(env,WEB_RELAY_RETURN_URL+'#id_token=h.p.s&code=c1&state='+st,dep),
  {kind:'success',provider:'apple',nonce:'n'.repeat(20),idToken:'h.p.s',code:'c1',redirectUri:APPLE_CALLBACK});
 const cases=[[s=>WEB_RELAY_RETURN_URL+'#id_token=h.p.s&state=wrong_state_value_123456','invalid'],
  [s=>WEB_RELAY_RETURN_URL+'?id_token=h.p.s&state='+s,'invalid'],
  [s=>'https://evil.example/auth/done#id_token=h.p.s&state='+s,'invalid'],
  [s=>WEB_RELAY_RETURN_URL+'#error=user_cancelled&state='+s,'cancelled']];
 for(const [make,kind] of cases){
  await prepareWebRelay(env,'apple','n'.repeat(20),dep);
  st=JSON.parse(storage.m.get(WEB_RELAY_PENDING_KEY)).state;
  assert.equal(consumeWebRelay(env,make(st),dep).kind,kind,make(st));
 }
 await prepareWebRelay(env,'google','n'.repeat(20),dep);
 st=JSON.parse(storage.m.get(WEB_RELAY_PENDING_KEY)).state;
 now+=11*60_000;
 assert.equal(consumeWebRelay(env,WEB_RELAY_RETURN_URL+'#id_token=h.p.s&state='+st,dep).kind,'invalid','older than 10 minutes');
 assert.equal(consumeWebRelay(env,WEB_RELAY_RETURN_URL+'#id_token=h.p.s&state='+st,{storage:memoryStorage(),now:()=>now}).kind,'invalid');
});

test('generic relay: deep links use ?, web pages use #; providers and returns are allow-listed',()=>{
 const h='a'.repeat(64),st='s'.repeat(20);
 assert.equal(buildRelayStartUrl(env,'apple',h,st,'echostarry://auth/apple'),
  'https://id.starry.phd/auth/apple/start?app_id=echo&nonce='+h+'&return=echostarry%3A%2F%2Fauth%2Fapple&state='+st);
 assert.throws(()=>buildRelayStartUrl(env,'facebook',h,st,'echostarry://auth/apple'));
 assert.throws(()=>buildRelayStartUrl(env,'google',h,st,'http://insecure.example/x'));
 assert.throws(()=>buildRelayStartUrl(env,'google',h,st,'javascript:alert(1)'));
 assert.deepEqual(parseRelayReturn('echostarry://auth/apple?id_token=h.p.s&code=c&state='+st,'echostarry://auth/apple',st),
  {kind:'success',idToken:'h.p.s',code:'c'});
 assert.throws(()=>parseRelayReturn('echostarry://auth/apple#id_token=h.p.s&state='+st,'echostarry://auth/apple',st));
 assert.equal(relayRedirectUri(env,'apple'),APPLE_CALLBACK);
 assert.deepEqual(relaySignInBody(env,'google',{idToken:'h.p.s',code:'ignored'},'n'.repeat(20)),{app_id:'echo',id_token:'h.p.s',nonce:'n'.repeat(20)});
});

test('sign-in body: app_id echo, RAW nonce, Apple code + redirect_uri only for Apple',()=>{
 assert.deepEqual(signInRequestBody({provider:'google',idToken:'h.p.s',nonce:'n'.repeat(20),authorizationCode:'c',redirectUri:'r'}),
  {app_id:'echo',id_token:'h.p.s',nonce:'n'.repeat(20)});
 assert.deepEqual(signInRequestBody({provider:'apple',idToken:'h.p.s',nonce:'n'.repeat(20),authorizationCode:'c1',redirectUri:APPLE_CALLBACK}),
  {app_id:'echo',id_token:'h.p.s',nonce:'n'.repeat(20),authorization_code:'c1',redirect_uri:APPLE_CALLBACK});
 assert.throws(()=>signInRequestBody({provider:'google',idToken:'',nonce:'n'.repeat(20)}));
});

test('nonce and app config: fixtures parse; unreachable config closes member features only',async()=>{
 const api=fakeApi({'POST /v1/auth/nonce':[200,fixture('auth-nonce.200.json')],'GET /v1/apps/echo/config':[200,fixture('apps-config.200.json')]});
 assert.equal(await requestNonce(env,api.fetch),fixture('auth-nonce.200.json').nonce);
 assert.deepEqual(api.calls[0].body,{app_id:'echo'});
 assert.equal((await fetchAppConfig(env,api.fetch)).status,'active');
 assert.equal(await fetchAppConfig(env,fakeApi({}).fetch),null);
 const down=async()=>{throw new TypeError('Failed to fetch');};
 assert.equal(await fetchAppConfig(env,down),null);
 await assert.rejects(requestNonce(env,fakeApi({'POST /v1/auth/nonce':[200,{nonce:'short'}]}).fetch));
});

test('opening the panel with no stored login makes ONE config call and no member call',async()=>{
 const api=fakeApi({'GET /v1/apps/echo/config':[200,fixture('apps-config.200.json')]});
 assert.deepEqual(await loadMemberState(deps(api)),{kind:'signed-out'});
 assert.deepEqual(api.calls.map(c=>c.path),['/v1/apps/echo/config']);
 const paused=fakeApi({'GET /v1/apps/echo/config':[200,{...fixture('apps-config.200.json'),status:'paused'}]});
 assert.deepEqual(await loadMemberState(deps(paused)),{kind:'maintenance'});
 const offline=fakeApi({});
 assert.deepEqual(await loadMemberState(deps(offline,createMemoryRefreshTokenStore('session1.x'))),{kind:'unavailable'});
 assert.equal(offline.calls.some(c=>c.path==='/v1/auth/refresh'),false,'no token traffic when the app gate is closed');
});

test('returning visitor: stored refresh token → rotated → /v1/me → signed in',async()=>{
 const store=createMemoryRefreshTokenStore('session1.old');
 const api=fakeApi({'GET /v1/apps/echo/config':[200,fixture('apps-config.200.json')],
  'POST /v1/auth/refresh':[200,tokens(fixture('auth-refresh.200.json'),2)],
  'GET /v1/me':init=>init.headers.authorization==='Bearer eyJ.access2.x'?[200,fixture('me.200.json')]:[401,fixture('error.json')]});
 const state=await loadMemberState(deps(api,store));
 assert.equal(state.kind,'signed-in');assert.equal(state.member.displayName,'小星');
 assert.equal(await store.get(),'session1.r2');
});

test('sign-in outcomes: consent required, pending deletion, suspended, invalid token',async()=>{
 const me=fixture('me.200.json');
 const consent=fakeApi({'POST /v1/auth/google':[200,tokens(fixture('auth-sign-in.200.json'))],
  'GET /v1/me':[200,{...me,consent:{...me.consent,required:true}}]});
 const s1=await completeSignIn(deps(consent),{provider:'google',idToken:'h.p.s',nonce:'n'.repeat(20)});
 assert.equal(s1.kind,'consent-required');
 assert.deepEqual(consent.calls[0].body,{app_id:'echo',id_token:'h.p.s',nonce:'n'.repeat(20)});
 const pendingBody=tokens(fixture('auth-sign-in.200.json'));pendingBody.user={...pendingBody.user,status:'pending_deletion',deletion_purge_at:1794294800000};
 const pending=fakeApi({'POST /v1/auth/apple':[200,pendingBody]});
 assert.deepEqual(await completeSignIn(deps(pending),{provider:'apple',idToken:'h.p.s',nonce:'n'.repeat(20)}),
  {kind:'pending-deletion',purgeAt:1794294800000});
 assert.equal(pending.calls.length,1,'pending deletion must not call /v1/me');
 const bad=fakeApi({'POST /v1/auth/google':[401,{error:{code:'INVALID_NONCE',message:'',request_id:''}}]});
 const s3=await completeSignIn(deps(bad),{provider:'google',idToken:'h.p.s',nonce:'n'.repeat(20)});
 assert.equal(s3.kind,'signed-out');assert.match(s3.notice,/再試一次/);
 assert.deepEqual(stateFromError(new StarryIdError(403,'ACCOUNT_SUSPENDED','',null,null,null)),{kind:'suspended'});
});

test('consent, sign out, sign out everywhere, delete and withdraw call the documented endpoints',async()=>{
 const me=parseStarryMe(fixture('me.200.json'));
 const api=fakeApi({'POST /v1/me/consents':[204,null],'POST /v1/auth/logout':[204,null],'POST /v1/auth/logout-all':[401,fixture('error.json')],
  'POST /v1/auth/refresh':[401,{error:{code:'INVALID_REFRESH',message:'',request_id:''}}],
  'POST /v1/me/deletion':[202,fixture('me-deletion.202.json')],'DELETE /v1/me/deletion':[200,{status:'active'}],'GET /v1/me':[200,fixture('me.200.json')]});
 const store=createMemoryRefreshTokenStore();
 const session=createStarryIdSession({env,store,fetch:api.fetch});
 const adopt=()=>session.adoptTokens({accessToken:'eyJ.a.x',expiresInSeconds:900,refreshToken:'session1.r'});
 await adopt();await acceptCurrentConsent(session,me);
 assert.deepEqual(api.calls.at(-1).body,{terms_version:'2026-11-03',privacy_version:'2026-11-03.2'});
 await signOut(session);assert.equal(await store.get(),null);assert.equal(session.hasAccessToken(),false);
 await adopt();await signOut(session,true); // server refuses → still signed out locally
 assert.equal(await store.get(),null);
 await adopt();assert.equal(await requestAccountDeletion(session),1794294800000);
 assert.deepEqual(api.calls.find(c=>c.path==='/v1/me/deletion'&&c.method==='POST').body,{confirm:true});
 assert.equal(await store.get(),null,'deletion ends every session');
 await adopt();await cancelAccountDeletion(session);assert.equal((await fetchMe(session)).status,'active');
 for(const c of api.calls.filter(c=>c.path!=='/v1/auth/refresh'))assert.match(c.headers.authorization??'',/^Bearer /);
});

test('member view helpers and Taiwan-date deletion notice',()=>{
 assert.equal(stateFromAvailability({kind:'active'}),null);
 assert.deepEqual(stateFromAvailability({kind:'killed'}),{kind:'maintenance'});
 assert.deepEqual(stateFromAvailability({kind:'update-required',minVersion:'1.0.0'}),{kind:'update-required',minVersion:'1.0.0'});
 assert.equal(stateFromMember(parseStarryMe(fixture('me.200.json'))).kind,'signed-in');
 assert.equal(stateAfterSignIn({user:{status:'active'}}),null);
 assert.equal(formatPurgeDate(Date.UTC(2026,10,9,20,0)),'2026/11/10');
 assert.equal(formatPurgeDate(null),'7 天後');
 assert.deepEqual(stateFromError(new Error('x')),{kind:'unavailable'});
});

test('dark launch: public production remains disabled while isolated internal preview can test login',()=>{
 for(const file of ['.github/workflows/ci.yml','.github/workflows/deploy-worker.yml'])
  assert.doesNotMatch(read(file),/EXPO_PUBLIC_STARRY_ID_API_BASE_URL/,file);
 const eas=JSON.parse(read('eas.json'));
 assert.equal(eas.build.preview.env.EXPO_PUBLIC_STARRY_ID_API_BASE_URL,'https://id.starry.phd');
 assert.equal(eas.build.production.env?.EXPO_PUBLIC_STARRY_ID_API_BASE_URL,undefined);
 const provider=read('src/auth/starryId/StarryIdProvider.tsx');
 assert.match(provider,/resolveStarryIdEnvironment\(process\.env\.EXPO_PUBLIC_STARRY_ID_API_BASE_URL\)/);
 assert.match(provider,/if\(!STARRY_ENV\)return <StarryIdContext\.Provider value=\{disabled\}>/);
 assert.match(provider,/credentials:'omit'/);
 assert.match(provider,/ensureLoaded\(\)\{\n\s+if\(loaded\.current\)return;/);
 const panel=read('src/ui/echo/StarryMemberPanel.tsx');
 assert.match(panel,/case 'disabled':return null;/);
 assert.match(panel,/webRelaySupported\(window\.location\.origin\)/);
 assert.match(panel,/window\.location\.assign\(url\)/);
 assert.doesNotMatch(panel,/accounts\.google\.com|appleid\.cdn-apple\.com|renderGoogleButton/);
 const done=read('app/auth/done.tsx');
 assert.match(done,/window\.history\.replaceState\(null,'',window\.location\.pathname\)/);
 assert.ok(done.indexOf('replaceState')<done.indexOf('consumeWebRelay(starry.env'),'the # result is wiped before use');
 assert.match(done,/if\(!starry\.enabled\|\|!starry\.env\)/);
 assert.match(read('app/_layout.tsx'),/<Stack\.Screen name="auth\/done" \/>/);
 const profile=read('app/profile.tsx');
 assert.match(profile,/state==='not-configured'\?<View[\s\S]*:<StarryMemberPanel\/>/);
 assert.match(read('app/_layout.tsx'),/<StarryIdProvider><LegacyThemeProvider>[\s\S]*<\/LegacyThemeProvider><\/StarryIdProvider>/);
});

test('turning on sign-in switches the privacy page to the member-login version automatically',async()=>{
 const {privacyPolicyFor,PRIVACY_POLICY_SECTIONS,PRIVACY_POLICY_MEMBER_SECTIONS}=await import('../src/legal/privacyPolicy.ts');
 assert.equal(privacyPolicyFor(false).sections,PRIVACY_POLICY_SECTIONS);
 assert.equal(privacyPolicyFor(true).sections,PRIVACY_POLICY_MEMBER_SECTIONS);
 const page=read('app/privacy.tsx');
 assert.match(page,/const policy=privacyPolicyFor\(centralMemberApiState\(\)!=='not-configured'\);/);
 const guest=PRIVACY_POLICY_SECTIONS.flatMap(s=>s.paragraphs).join('\n');
 const member=PRIVACY_POLICY_MEMBER_SECTIONS.flatMap(s=>[s.heading,...s.paragraphs]).join('\n');
 assert.match(guest,/目前版本不需要註冊或登入/);
 assert.doesNotMatch(member,/目前版本不需要註冊或登入/);
 for(const must of ['Starry ID','https://id.starry.phd/privacy','https://id.starry.phd/terms','https://id.starry.phd/account/delete',
  'Google 或 Apple','sessionStorage','安全儲存區','7 天內重新登入即可撤回','不會自動取消','不讀取、不保存你的 Email','13 歲以下','English summary'])
  assert.ok(member.includes(must),must);
});
