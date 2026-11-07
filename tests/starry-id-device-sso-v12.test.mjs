import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {StarryClient,memoryStorage} from '../src/auth/starryId/vendor/starry-client.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const json=(x,s=200)=>Response.json(x,{status:s});
const bearer=sub=>'a.'+Buffer.from(JSON.stringify({sub})).toString('base64url')+'.s';
const signInResponse=(sub,refresh)=>({
 user:{user_id:sub,status:'active',is_new:false,deletion_purge_at:null},
 access_token:bearer(sub),refresh_token:refresh,expires_in:900,consent_required:false
});
test('v2026-11-07.12 official Starry Client is copied verbatim and has device SSO methods',()=>{
 const client=read('src/auth/starryId/vendor/starry-client.ts');
 for(const marker of ['sharedStorage?: StarryStorage','async syncDeviceSignIn(): Promise<boolean>',
  '/v1/auth/sso/start','/v1/auth/sso/exchange','/v1/auth/sso/status','/v1/auth/sso/logout'])
  assert.ok(client.includes(marker),marker);
 const openapi=JSON.parse(read('openapi/starry-id.v1.json'));
 for(const path of ['/v1/auth/sso/start','/v1/auth/sso/exchange','/v1/auth/sso/status','/v1/auth/sso/logout'])
  assert.ok(openapi.paths[path],path);
});
test('one central session is exchanged between Apps with isolated Refresh Tokens',async()=>{
 const shared=memoryStorage(),echoStorage=memoryStorage(),noteStorage=memoryStorage(),calls=[];
 let active=true;
 const fakeFetch=async(url,opts)=>{
  const path=new URL(String(url)).pathname,body=opts?.body?JSON.parse(opts.body):{};
  calls.push({path,body});
  if(path==='/v1/auth/google')return json(signInResponse('member-A','echo.refresh'));
  if(path==='/v1/auth/sso/start')return json({sso_token:['device','shared','token'].join('-')});
  if(path==='/v1/auth/sso/status')return json({active,user_id:active?'member-A':null});
  if(path==='/v1/auth/sso/exchange')return json(signInResponse('member-A','recordnote.refresh'));
  if(path==='/v1/auth/logout'||path==='/v1/auth/sso/logout')return new Response(null,{status:204});
  throw Error('Unexpected '+path);
 };
 const mk=(appId,storage)=>new StarryClient({baseUrl:'https://id.starry.phd',appId,storage,sharedStorage:shared,fetch:fakeFetch});
 const echo=mk('echo',echoStorage),note=mk('recordnote',noteStorage);
 await echo.signInWithIdToken('google',{idToken:'fake.jwt',nonce:'nonce'});
 assert.equal(await shared.get('starry.sso'),['device','shared','token'].join('-'));
 assert.equal(await echoStorage.get('starry.refresh.echo'),'echo.refresh');
 assert.equal(await note.restore(),true);
 assert.equal(await noteStorage.get('starry.refresh.recordnote'),'recordnote.refresh');
 assert.equal(calls.filter(c=>c.path==='/v1/auth/sso/exchange').length,1);
 assert.deepEqual(calls.find(c=>c.path==='/v1/auth/sso/exchange').body,
  {app_id:'recordnote',sso_token:['device','shared','token'].join('-')});
 active=false;
 assert.equal(await note.syncDeviceSignIn(),false);
 assert.equal(await noteStorage.get('starry.refresh.recordnote'),null);
 assert.equal(await shared.get('starry.sso'),null);
});
test('Echo only enables actual native shared storage, not per-App Android preferences or a Web fallback',async()=>{
 const app=JSON.parse(read('app.json')).expo;
 assert.ok(app.ios.entitlements['keychain-access-groups'].includes('$(AppIdentifierPrefix)phd.starry.sso'));
 const native=read('src/auth/starryId/deviceSharedStorage.native.ts');
 assert.match(native,/accessGroup:IOS_SSO_ACCESS_GROUP/);
 assert.match(native,/SecureStore\.WHEN_UNLOCKED_THIS_DEVICE_ONLY/);
 assert.match(native,/if\(Platform\.OS!=='ios'\)return null/);
 assert.doesNotMatch(native,/AsyncStorage|localStorage|SharedPreferences/);
 const web=await import('../src/auth/starryId/deviceSharedStorage.ts');
 assert.equal(web.createStarryDeviceSharedStorage(),null);
 const provider=read('src/auth/starryId/StarryIdProvider.tsx');
 assert.match(provider,/sharedStorage:sharedStorageRef\.current/);
 assert.match(provider,/await sdk\.syncDeviceSignIn\(\)/);
 assert.match(provider,/await sdk\.restore\(\)/);
 const panel=read('src/ui/echo/StarryMemberPanel.tsx');
 assert.match(panel,/starry\.deviceSsoAvailable\?'登出所有繁星 App'/);
 assert.match(panel,/Platform\.OS==='web'\?'登出此網頁':'登出此 App'/);
});
