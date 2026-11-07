import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {StarryClient,StarryError,memoryStorage} from '../src/auth/starryId/vendor/starry-client.ts';
import {validateLoginOptions,verifyAssertion} from '../src/auth/starryId/passkeyContract.ts';
import {webRelayReturnUrl} from '../src/auth/starryId/webRelay.ts';

const BASE='https://id.starry.phd';
const STAGING='https://echo-api-staging.starry-phd.workers.dev';
const CALLBACK='echostarry://auth/apple';
const NONCE='fictional-nonce-123456789-for-tests';
const response=(access='fake-access',refresh='fake-refresh')=>({
 access_token:access,refresh_token:refresh,expires_in:900,
 user:{user_id:'example-user',status:'active',is_new:false,deletion_purge_at:null},
 consent_required:false
});
const send=(value,status=200)=>Response.json(value,{status});

test('official Web relay: only hashed nonce leaves Echo, same-origin callback, single-use state and raw nonce exchange',async()=>{
 const storage=memoryStorage(),requests=[];
 let url='';
 const client=new StarryClient({
  baseUrl:BASE,appId:'echo',storage,
  sha256Hex:async input=>createHash('sha256').update(input).digest('hex'),
  randomState:()=> 'test-state-for-echo-1234567890',
  navigate:target=>{url=target;},
  fetch:async (target,init)=>{
   const path=new URL(String(target)).pathname;
   requests.push({path,body:init.body?JSON.parse(init.body):null,headers:init.headers});
   if(path==='/v1/auth/nonce')return send({nonce:NONCE});
   if(path==='/v1/auth/google')return send(response());
   throw new Error('Unexpected endpoint '+path);
  }
 });
 assert.equal(webRelayReturnUrl(STAGING),STAGING+'/auth/done');
 assert.throws(()=>webRelayReturnUrl('https://malicious.example'),/Unregistered/);
 await client.beginRelayRedirect('google',{returnUrl:webRelayReturnUrl(STAGING)});
 const start=new URL(url);
 assert.equal(start.origin,BASE);
 assert.equal(start.pathname,'/auth/google/start');
 assert.equal(start.searchParams.get('app_id'),'echo');
 assert.equal(start.searchParams.get('nonce'),createHash('sha256').update(NONCE).digest('hex'));
 assert.equal(start.searchParams.get('return'),STAGING+'/auth/done');
 assert.equal(url.includes(NONCE),false,'raw nonce cannot leak to browser relay URL');
 const state=start.searchParams.get('state');
 const returned=STAGING+'/auth/done#id_token=mock.google.jwt&state='+encodeURIComponent(state);
 const result=await client.completeRelayRedirect(returned);
 assert.equal(result?.user.user_id,'example-user');
 assert.deepEqual(requests.at(-1).body,{app_id:'echo',id_token:'mock.google.jwt',nonce:NONCE});
 assert.equal(await storage.get('starry.relay.echo'),null,'pending state must be deleted after use');
 await assert.rejects(client.completeRelayRedirect(returned),e=>e instanceof StarryError&&e.code==='RELAY_STATE_MISMATCH');
 assert.equal(requests.filter(r=>r.path==='/v1/auth/google').length,1,'replay must not exchange token twice');
});

test('wrong relay state is denied without exchanging a token, and pending state is deleted',async()=>{
 let exchanged=0,redirect='';
 const storage=memoryStorage();
 const client=new StarryClient({
  baseUrl:BASE,appId:'echo',storage,
  sha256Hex:async text=>createHash('sha256').update(text).digest('hex'),
  randomState:()=> 'valid-state',
  navigate:url=>{redirect=url;},
  fetch:async(url)=>{
   if(String(url).endsWith('/v1/auth/nonce'))return send({nonce:NONCE});
   exchanged++;return send(response());
  }
 });
 await client.beginRelayRedirect('apple',{returnUrl:webRelayReturnUrl(STAGING)});
 assert.ok(redirect.includes('state=valid-state'));
 await assert.rejects(client.completeRelayRedirect(STAGING+'/auth/done#id_token=fake&code=code&state=WRONG'),
  e=>e instanceof StarryError&&e.code==='RELAY_STATE_MISMATCH');
 assert.equal(exchanged,0);
 assert.equal(await storage.get('starry.relay.echo'),null);
});

test('official native Apple relay preserves registered deep-link and sends code to central Apple callback only',async()=>{
 let seenUrl='',posted=null;
 const sdk=new StarryClient({
  baseUrl:BASE,appId:'echo',storage:memoryStorage(),
  sha256Hex:async s=>createHash('sha256').update(s).digest('hex'),
  randomState:()=> 'native-state-for-echo',
  openAuthSession:async (url,returnUrl)=>{
   seenUrl=url;
   assert.equal(returnUrl,CALLBACK);
   const state=new URL(url).searchParams.get('state');
   return CALLBACK+'?id_token=fake.apple.jwt&code=apple-code&state='+encodeURIComponent(state);
  },
  fetch:async (url,init)=>{
   if(String(url).endsWith('/v1/auth/nonce'))return send({nonce:NONCE});
   if(String(url).endsWith('/v1/auth/apple')){posted=JSON.parse(init.body);return send(response());}
   throw Error('Unexpected endpoint');
  }
 });
 const result=await sdk.signInWithRelay('apple',{returnUrl:CALLBACK});
 assert.equal(new URL(seenUrl).searchParams.get('return'),CALLBACK);
 assert.equal(new URL(seenUrl).searchParams.get('nonce'),createHash('sha256').update(NONCE).digest('hex'));
 assert.equal(result.user.user_id,'example-user');
 assert.deepEqual(posted,{
  app_id:'echo',id_token:'fake.apple.jwt',nonce:NONCE,
  authorization_code:'apple-code',redirect_uri:BASE+'/auth/apple/callback'
 });
});

test('cancelled native relay never exchanges an ID token',async()=>{
 let exchanges=0;
 const sdk=new StarryClient({
  baseUrl:BASE,appId:'echo',storage:memoryStorage(),
  sha256Hex:async()=> 'a'.repeat(64),randomState:()=> 'native-state',
  openAuthSession:async()=>null,
  fetch:async url=>{
   if(String(url).endsWith('/v1/auth/nonce'))return send({nonce:NONCE});
   exchanges++;return send(response());
  }
 });
 await assert.rejects(sdk.signInWithRelay('google',{returnUrl:CALLBACK}),
  error=>error instanceof StarryError&&error.cancelled&&error.code==='RELAY_CANCELLED');
 assert.equal(exchanges,0);
});

test('concurrent token restoration rotates refresh exactly once, then reuse is avoided',async()=>{
 const storage=memoryStorage();
 await storage.set('starry.refresh.echo','old-refresh');
 let refreshes=0;
 const sdk=new StarryClient({
  baseUrl:BASE,appId:'echo',storage,fetch:async(url,init)=>{
   if(String(url).endsWith('/v1/auth/refresh')){
    refreshes++;
    assert.equal(JSON.parse(init.body).refresh_token,'old-refresh');
    await Promise.resolve();
    return send({access_token:'new-access',refresh_token:'new-refresh',expires_in:900});
   }
   throw Error('Unexpected endpoint');
  }
 });
 const parallel=await Promise.all(Array.from({length:8},()=>sdk.getAccessToken()));
 assert.deepEqual(parallel,Array(8).fill('new-access'));
 assert.equal(refreshes,1);
 assert.equal(await storage.get('starry.refresh.echo'),'new-refresh');
 assert.equal(await sdk.getAccessToken(),'new-access');
 assert.equal(refreshes,1);
});

test('invalid refresh logs out locally; network failure retains safely stored token',async()=>{
 const invalidStorage=memoryStorage();
 await invalidStorage.set('starry.refresh.echo','invalid-refresh');
 const sdk=new StarryClient({
  baseUrl:BASE,appId:'echo',storage:invalidStorage,
  fetch:async()=>send({error:{code:'INVALID_REFRESH',message:'Invalid refresh'}},401)
 });
 const events=[];
 sdk.onAuthChange(event=>events.push(event));
 assert.equal(await sdk.getAccessToken(),null);
 assert.equal(await invalidStorage.get('starry.refresh.echo'),null);
 assert.deepEqual(events,['signed-out']);
 const offlineStorage=memoryStorage();
 await offlineStorage.set('starry.refresh.echo','offline-refresh');
 const offline=new StarryClient({baseUrl:BASE,appId:'echo',storage:offlineStorage,
  fetch:async()=>{throw new Error('Connection unavailable');}});
 await assert.rejects(offline.getAccessToken(),e=>e instanceof StarryError&&e.code==='NETWORK');
 assert.equal(await offlineStorage.get('starry.refresh.echo'),'offline-refresh');
});

test('Passkey cannot bypass the central relying-party check or create a login on cancelled assertion',async()=>{
 const good={challenge:'AQID',rpId:'id.starry.phd',timeout:120000,userVerification:'required',allowCredentials:[]};
 let signer=0,exchange=0;
 const sdk=new StarryClient({
  baseUrl:BASE,appId:'echo',storage:memoryStorage(),
  passkey:{get:async raw=>{const options=validateLoginOptions(raw);signer++;
    assert.equal(options.rpId,'id.starry.phd');
    return verifyAssertion({id:'AQID',clientDataJSON:'AQID',authenticatorData:'AQID',signature:'AQID'});},
   create:async()=>{throw new Error('not expected');}},
  fetch:async(url,init)=>{
   const path=new URL(String(url)).pathname;
   if(path==='/v1/auth/passkey/options')return send({publicKey:{...good,rpId:'echo.starry.phd'}});
   if(path==='/v1/auth/passkey'){exchange++;return send(response());}
   throw Error('Unexpected endpoint');
  }
 });
 await assert.rejects(sdk.signInWithPasskey(),e=>e instanceof StarryError&&e.code==='PASSKEY_FAILED');
 assert.equal(signer,0);
 assert.equal(exchange,0);
 const cancelled=new StarryClient({
  baseUrl:BASE,appId:'echo',storage:memoryStorage(),
  passkey:{get:async()=>{throw Object.assign(new Error('Cancelled'),{name:'NotAllowedError'});},
   create:async()=>{throw Error('not expected');}},
  fetch:async(url)=>{
   if(String(url).endsWith('/v1/auth/passkey/options'))return send({publicKey:good});
   exchange++;return send(response());
  }
 });
 await assert.rejects(cancelled.signInWithPasskey(),
  e=>e instanceof StarryError&&e.cancelled&&e.code==='PASSKEY_CANCELLED');
 assert.equal(exchange,0);
});
