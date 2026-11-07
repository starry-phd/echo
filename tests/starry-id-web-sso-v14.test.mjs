import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {StarryClient,memoryStorage} from '../src/auth/starryId/vendor/starry-client.ts';
import {webRelayReturnUrl} from '../src/auth/starryId/webRelay.ts';

const ORIGIN='https://echo-api-staging.starry-phd.workers.dev';
const RETURN=webRelayReturnUrl(ORIGIN);
const BASE='https://id.starry.phd';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hash=text=>createHash('sha256').update(text).digest('hex');
const jwt=sub=>'x.'+Buffer.from(JSON.stringify({sub})).toString('base64url')+'.x';
const session=sub=>({
 user:{user_id:sub,status:'active',is_new:false,deletion_purge_at:null},
 access_token:jwt(sub),refresh_token:'refresh-for-'+sub,expires_in:900,consent_required:false
});
const json=(v,status=200)=>Response.json(v,{status});

test('2026-11-07.14 official Web SDK is used verbatim; callback and configured web origins are strict',()=>{
 const sdk=read('src/auth/starryId/vendor/starry-client.ts');
 const openapi=JSON.parse(read('openapi/starry-id.v1.json'));
 for(const name of ['shareWebSignIn','syncWebSignIn','completeWebSsoCheck','signOutWebEverywhere'])
  assert.ok(sdk.includes(name),name);
 for(const path of ['/v1/auth/sso/web-code','/v1/auth/sso/web-exchange'])
  assert.ok(openapi.paths[path],path);
 assert.equal(RETURN,ORIGIN+'/auth/done');
 assert.throws(()=>webRelayReturnUrl('https://malicious.example'));
 const provider=read('src/auth/starryId/StarryIdProvider.tsx');
 assert.match(provider,/sdk\.shareWebSignIn\(\{returnUrl\}\)/);
 assert.match(provider,/webNavigationRef\.current=true/);
 assert.match(provider,/return shareWebSession\(\)/);
 assert.match(provider,/sdk\.syncWebSignIn\(\{returnUrl\}\)/);
 assert.match(provider,/window\.location\.pathname===WEB_RELAY_RETURN_PATH/);
 assert.match(provider,/sdk\.completeWebSsoCheck\(href\)/);
 assert.match(provider,/sdk\.signOutWebEverywhere\(\{returnUrl\}\)/);
 const callback=read('app/auth/done.tsx');
 assert.match(callback,/isWebSso\?starry\.completeWebSso\(href\):starry\.completeWebRelay\(href\)/);
 assert.match(callback,/if\(!isWebSso&&redirecting===true\)return/);
});

test('browser login adopts central HttpOnly-cookie SSO using a one-time code and approved callback',async()=>{
 const storage=memoryStorage(),calls=[];let destination='';
 const client=new StarryClient({
  baseUrl:BASE,appId:'echo',storage,navigate:url=>{destination=url;},
  fetch:async(target,init)=>{
   const path=new URL(String(target)).pathname,body=init?.body?JSON.parse(init.body):{};
   calls.push({path,body});
   if(path==='/v1/auth/google')return json(session('member-one'));
   if(path==='/v1/auth/sso/start')return json({sso_token:'temporary-device-token'});
   if(path==='/v1/auth/sso/web-code')return json({code:'one-time-web-code'});
   throw Error('Unexpected request '+path);
  }
 });
 await client.signInWithIdToken('google',{idToken:'dummy.jwt',nonce:'raw-nonce'});
 await client.shareWebSignIn({returnUrl:RETURN});
 const next=new URL(destination);
 assert.equal(next.origin,BASE);
 assert.equal(next.pathname,'/auth/sso/adopt');
 assert.equal(next.searchParams.get('app_id'),'echo');
 assert.equal(next.searchParams.get('return'),RETURN);
 assert.equal(next.searchParams.get('c'),'one-time-web-code');
 assert.equal(destination.includes('temporary-device-token'),false,'SSO token must not go into URL');
 assert.equal(await storage.get('starry.ssoweb.echo'),'1');
 assert.equal(await client.completeWebSsoCheck(RETURN+'#sso_adopted=1&state='),true);
 assert.equal(calls.filter(c=>c.path==='/v1/auth/sso/start').length,1);
});

test('browser checks with hashed nonce, throttles repeated checks and exchanges one-time code',async()=>{
 const storage=memoryStorage(),calls=[];let destination='';
 const client=new StarryClient({
  baseUrl:BASE,appId:'echo',storage,navigate:url=>{destination=url;},
  now:()=>1_000_000,randomState:()=> 'random-state-for-echo',
  sha256Hex:async value=>hash(value),
  fetch:async(url,init)=>{
   const path=new URL(String(url)).pathname,body=init?.body?JSON.parse(init.body):{};
   calls.push({path,body});
   if(path==='/v1/auth/nonce')return json({nonce:'internal-raw-nonce'});
   if(path==='/v1/auth/sso/web-exchange')return json(session('member-from-elsewhere'));
   throw Error('Unexpected request '+path);
  }
 });
 assert.equal(await client.syncWebSignIn({returnUrl:RETURN}),true);
 const check=new URL(destination);
 assert.equal(check.pathname,'/auth/sso/check');
 assert.equal(check.origin,BASE);
 assert.equal(check.searchParams.get('return'),RETURN);
 assert.equal(check.searchParams.get('nonce'),hash('internal-raw-nonce'));
 assert.equal(destination.includes('internal-raw-nonce'),false);
 assert.equal(await client.syncWebSignIn({returnUrl:RETURN}),false,'5-minute SDK throttle');
 assert.equal(calls.filter(c=>c.path==='/v1/auth/nonce').length,1);
 const fragment='#sso_code=single-use-code&sso_user=member-from-elsewhere&state='+encodeURIComponent(check.searchParams.get('state'));
 assert.equal(await client.completeWebSsoCheck(RETURN+fragment),true);
 assert.equal((await storage.get('starry.refresh.echo')),'refresh-for-member-from-elsewhere');
 assert.deepEqual(calls.filter(c=>c.path==='/v1/auth/sso/web-exchange').map(c=>c.body),
  [{app_id:'echo',code:'single-use-code',nonce:'internal-raw-nonce'}]);
 assert.equal(await storage.get('starry.ssocheck.echo'),null,'pending nonce must be single-use');
 assert.equal(await client.completeWebSsoCheck(RETURN+fragment),true,'a replay never replaces a valid session');
 assert.equal(calls.filter(c=>c.path==='/v1/auth/sso/web-exchange').length,1);
});

test('wrong browser SSO state never exchanges a code; no browser session signs out an already linked web App',async()=>{
 const storage=memoryStorage();let requests=0;
 const client=new StarryClient({
  baseUrl:BASE,appId:'echo',storage,now:()=>1_000_000,
  randomState:()=> 'expected-state',sha256Hex:async input=>hash(input),
  navigate:()=>{},
  fetch:async url=>{
   if(String(url).endsWith('/v1/auth/nonce'))return json({nonce:'private-nonce'});
   requests++;throw Error('Unexpected token exchange');
  }
 });
 await client.syncWebSignIn({returnUrl:RETURN});
 assert.equal(await client.completeWebSsoCheck(RETURN+'#sso_code=code&sso_user=other&state=bad-state'),false);
 assert.equal(requests,0);
 await storage.set('starry.refresh.echo','a-token');
 await storage.set('starry.ssoweb.echo','1');
 assert.equal(await client.completeWebSsoCheck(RETURN+'#sso_none=1&state=expected-state'),false);
 assert.equal(await storage.get('starry.refresh.echo'),null);
 assert.equal(await storage.get('starry.ssoweb.echo'),null);
});

test('browser-wide logout deletes the local session and goes through central cookie revocation',async()=>{
 const storage=memoryStorage();let destination='';
 const client=new StarryClient({
  baseUrl:BASE,appId:'echo',storage,navigate:url=>{destination=url;},
  fetch:async()=>new Response(null,{status:204})
 });
 await storage.set('starry.refresh.echo','old-refresh');
 await storage.set('starry.ssoweb.echo','1');
 await client.signOutWebEverywhere({returnUrl:RETURN});
 const logout=new URL(destination);
 assert.equal(logout.origin,BASE);
 assert.equal(logout.pathname,'/auth/sso/logout');
 assert.equal(logout.searchParams.get('return'),RETURN);
 assert.equal(logout.searchParams.get('app_id'),'echo');
 assert.equal(await storage.get('starry.refresh.echo'),null);
 assert.equal(await storage.get('starry.ssoweb.echo'),null);
 assert.equal(await client.completeWebSsoCheck(RETURN+'#sso_none=1&state='),false);
});
