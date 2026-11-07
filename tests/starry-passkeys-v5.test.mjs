import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseStarryAppConfig,visibleStarryNotices,evaluateAppAvailability} from '../src/auth/starryId/appConfig.ts';
import {validateLoginOptions,validateCreationOptions,verifyAssertion,verifyAttestation,STARRY_PASSKEY_RP} from '../src/auth/starryId/passkeyContract.ts';
import {passkeyErrorMessage} from '../src/auth/starryId/passkeyErrors.ts';
import {getPasskeySignInOptions,signInWithPasskey,getPasskeyCreationOptions,registerPasskey,
 getMemberPasskeys,deleteMemberPasskey} from '../src/auth/starryId/memberApi.ts';
import {resolveStarryIdEnvironment} from '../src/auth/starryId/env.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env=resolveStarryIdEnvironment('https://id.starry.phd');
function publicApi(routes){
 const calls=[];
 const fetch=async(url,init)=>{
  const path=url.slice(env.baseUrl.length);
  const body=init.body?JSON.parse(init.body):undefined;
  calls.push({path,method:init.method,body});
  const [status,reply]=routes[init.method+' '+path]||[404,{}];
  return {status,json:async()=>reply,headers:{get:()=>null}};
 };
 return {fetch,calls};
}
function session(routes){
 const calls=[];
 return {calls,request:async(path,init={})=>{
  calls.push({path,method:init.method||'GET',body:init.body});
  if(!(path in routes))throw new Error('Unexpected member path '+path);
  return routes[path];
 }};
}
test('Passkey challenge is app-bound, Starry RP validated and never silently replaced by Echo origin',async()=>{
 const options={challenge:'YWJjZA',rpId:STARRY_PASSKEY_RP,userVerification:'required',timeout:120000,allowCredentials:[]};
 const api=publicApi({'POST /v1/auth/passkey/options':[200,{publicKey:options,expires_in:600}],
  'POST /v1/auth/passkey':[200,{token_type:'Bearer',access_token:'eyJ.access1.x',refresh_token:'session1.r1',expires_in:900,
   user:{user_id:'0193a5b2-7c4d-7e8f-9a01-23456789abcd',status:'active',is_new:false,deletion_purge_at:null},consent_required:false}]});
 assert.deepEqual(await getPasskeySignInOptions(env,api.fetch),options);
 assert.deepEqual(api.calls[0].body,{app_id:'echo'});
 const credential={id:'YWJj',clientDataJSON:'YWJj',authenticatorData:'YWJj',signature:'YWJj'};
 await signInWithPasskey(env,api.fetch,credential);
 assert.deepEqual(api.calls[1].body,{app_id:'echo',...credential});
 assert.equal(api.calls[1].path,'/v1/auth/passkey');
 assert.throws(()=>validateLoginOptions({...options,rpId:'echo.starry.phd'}),/Invalid/);
 assert.throws(()=>validateLoginOptions({...options,userVerification:'preferred'}),/Invalid/);
 assert.deepEqual(verifyAssertion(credential),credential);
 assert.throws(()=>verifyAssertion({...credential,signature:'no base64!'}));
});
test('Credential creation accepts only central RP and creation credential binary strings',async()=>{
 const o={rp:{name:'Starry',id:STARRY_PASSKEY_RP},user:{id:'YWJj',name:'user',displayName:'user'},
  challenge:'YWJj',pubKeyCredParams:[{type:'public-key',alg:-7}],excludeCredentials:[]};
 assert.deepEqual(validateCreationOptions(o),o);
 assert.throws(()=>validateCreationOptions({...o,rp:{name:'Starry',id:'echo.starry.phd'}}));
 assert.deepEqual(verifyAttestation({clientDataJSON:'YWJj',attestationObject:'YWJj'}),
  {clientDataJSON:'YWJj',attestationObject:'YWJj'});
 const api=session({'/v1/me/passkeys/options':{publicKey:o,expires_in:600},
  '/v1/me/passkeys':{passkeys:[{id:'YWJj',name:'Phone',created_at:1,last_used_at:null}]}});
 assert.deepEqual(await getPasskeyCreationOptions(api),o);
 assert.deepEqual(await getMemberPasskeys(api),[{id:'YWJj',name:'Phone',created_at:1,last_used_at:null}]);
 api.request=async(path,init)=>{api.calls.push({path,...init});return {ok:true}};
 await registerPasskey(api,{clientDataJSON:'YWJj',attestationObject:'YWJj'},'Phone');
 await deleteMemberPasskey(api,'YWJj');
 assert.deepEqual(api.calls.at(-2).body,{clientDataJSON:'YWJj',attestationObject:'YWJj',name:'Phone'});
 assert.equal(api.calls.at(-1).path,'/v1/me/passkeys/YWJj');
 assert.equal(api.calls.at(-1).method,'DELETE');
});
test('Cancellation is silent, missing credential falls back, duplicate and reauth errors are specific',()=>{
 for(const e of [{name:'NotAllowedError'},{name:'AbortError'},{error:'UserCancelled'}])
  assert.equal(passkeyErrorMessage(e),null);
 assert.match(passkeyErrorMessage({error:'NoCredentials'}),/Apple 或 Google/);
 assert.match(passkeyErrorMessage({name:'InvalidStateError'}),/已經有/);
 assert.match(passkeyErrorMessage({code:'REAUTH_REQUIRED'}),/10 分鐘/);
});
test('App notices are bounded plain strings with millisecond windows',()=>{
 const now=1794000000000;
 const cfg=parseStarryAppConfig({app_id:'echo',status:'active',min_version:'0.0.0',config:{test:'public'},
  notices:[
   {message:'<img src=x onerror=alert(1)>',starts_at:now-100,ends_at:now+100},
   {message:'Expired',starts_at:now-500,ends_at:now-100},
   {message:'Future',starts_at:now+1,ends_at:now+500},
   {message:'Invalid',starts_at:1,ends_at:0}
  ]});
 assert.equal(visibleStarryNotices(cfg,now).length,1);
 assert.equal(visibleStarryNotices(cfg,now)[0].message,'<img src=x onerror=alert(1)>');
 assert.deepEqual(cfg.publicSettings,{test:'public'});
 assert.equal(evaluateAppAvailability({...cfg,status:'paused'},'0.1.0').kind,'paused');
 assert.equal(evaluateAppAvailability({...cfg,status:'killed'},'0.1.0').kind,'killed');
 assert.equal(evaluateAppAvailability({...cfg,minVersion:'9.0.0'},'0.1.0').kind,'update-required');
});
test('Web platform uses navigator.credentials while native uses the dedicated module only in .native file',()=>{
 const app=JSON.parse(read('app.json')).expo;
 const pkg=JSON.parse(read('package.json'));
 assert.deepEqual(app.ios.associatedDomains,['webcredentials:id.starry.phd']);
 assert.equal(pkg.dependencies['react-native-passkey'],'3.6.2');
 const web=read('src/auth/starryId/passkeyPlatform.ts');
 const native=read('src/auth/starryId/passkeyPlatform.native.ts');
 assert.match(web,/navigator.credentials.get/);
 assert.match(web,/navigator.credentials.create/);
 assert.doesNotMatch(web,/from 'react-native-passkey'/);
 assert.match(native,/from 'react-native-passkey'/);
 assert.match(native,/Passkey.get/);
 assert.match(native,/Passkey.create/);
 const panel=read('src/ui/echo/StarryMemberPanel.tsx');
 for(const label of ['使用 Passkey 登入','新增 Passkey','我的 Passkey','確定移除這把 Passkey'])
  assert.ok(panel.includes(label),label);
 const provider=read('src/auth/starryId/StarryIdProvider.tsx');
 assert.match(provider,/AppState.addEventListener/);
 assert.match(provider,/visibilitychange/);
 assert.match(provider,/n.message/);
 assert.doesNotMatch(provider,/dangerouslySetInnerHTML|innerHTML/);
});
