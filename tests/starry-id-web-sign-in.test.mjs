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
import {APPLE_JS_SRC,APPLE_WEB_REDIRECT_URI,GOOGLE_GIS_SRC,STARRY_APPLE_WEB_SERVICES_ID,STARRY_GOOGLE_WEB_CLIENT_ID,
 appleWebSignInSupported,loadScriptOnce} from '../src/auth/starryId/webSignIn.ts';

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

test('web sign-in uses the Starry Web Client, Apple Services ID and exact registered redirect only',()=>{
 assert.equal(STARRY_GOOGLE_WEB_CLIENT_ID,'529568041037-j9gd4baq8k239qv7an2f53rh3srbgtnm.apps.googleusercontent.com');
 assert.equal(STARRY_APPLE_WEB_SERVICES_ID,'phd.starry.id.web');
 assert.equal(APPLE_WEB_REDIRECT_URI,'https://echo-starry.starry-phd.workers.dev/');
 assert.equal(appleWebSignInSupported('https://echo-starry.starry-phd.workers.dev'),true);
 for(const o of ['http://localhost:8081','https://echo.starry.phd',null])assert.equal(appleWebSignInSupported(o),false);
 assert.equal(GOOGLE_GIS_SRC,'https://accounts.google.com/gsi/client');
 assert.match(APPLE_JS_SRC,/^https:\/\/appleid\.cdn-apple\.com\/appleauth\/static\/jsapi\/appleid\/1\/[a-z]{2}_[A-Z]{2}\/appleid\.auth\.js$/);
});

test('only the two login scripts can ever be injected, and never outside a browser',async()=>{
 await assert.rejects(loadScriptOnce('https://evil.example/x.js'),/allow-listed/);
 await assert.rejects(loadScriptOnce(GOOGLE_GIS_SRC),/browser/);
});

test('sign-in body: app_id echo, RAW nonce, Apple code + redirect_uri only for Apple',()=>{
 assert.deepEqual(signInRequestBody({provider:'google',idToken:'h.p.s',nonce:'n'.repeat(20),authorizationCode:'c',redirectUri:'r'}),
  {app_id:'echo',id_token:'h.p.s',nonce:'n'.repeat(20)});
 assert.deepEqual(signInRequestBody({provider:'apple',idToken:'h.p.s',nonce:'n'.repeat(20),authorizationCode:'c1',redirectUri:APPLE_WEB_REDIRECT_URI}),
  {app_id:'echo',id_token:'h.p.s',nonce:'n'.repeat(20),authorization_code:'c1',redirect_uri:APPLE_WEB_REDIRECT_URI});
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

test('dark launch: production builds have no Starry ID URL, so the provider is disabled and the site unchanged',()=>{
 for(const file of ['.github/workflows/ci.yml','.github/workflows/deploy-worker.yml','eas.json'])
  assert.doesNotMatch(read(file),/EXPO_PUBLIC_STARRY_ID_API_BASE_URL/,file);
 const provider=read('src/auth/starryId/StarryIdProvider.tsx');
 assert.match(provider,/resolveStarryIdEnvironment\(process\.env\.EXPO_PUBLIC_STARRY_ID_API_BASE_URL\)/);
 assert.match(provider,/if\(!STARRY_ENV\)return <StarryIdContext\.Provider value=\{disabled\}>/);
 assert.match(provider,/credentials:'omit'/);
 assert.match(provider,/ensureLoaded\(\)\{\n\s+if\(loaded\.current\)return;/);
 const panel=read('src/ui/echo/StarryMemberPanel.tsx');
 assert.match(panel,/case 'disabled':return null;/);
 assert.match(panel,/if\(!signedOut\|\|Platform\.OS!=='web'/);
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
