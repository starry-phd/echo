import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {base64UrlEncode} from '../src/auth/starryId/randomState.ts';
import {buildRelayStartUrl,parseRelayReturn} from '../src/auth/starryId/starryRelay.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const native=read('src/auth/starryId/nativeSignIn.native.tsx');
const stub=read('src/auth/starryId/nativeSignIn.tsx');

test('relay state remains cryptographically random URL-safe base64url',()=>{
 for(let i=0;i<40;i++){
  const bytes=randomBytes(1+(i%30));
  assert.equal(base64UrlEncode(new Uint8Array(bytes)),bytes.toString('base64url'));
 }
 assert.match(base64UrlEncode(new Uint8Array(randomBytes(24))),/^[A-Za-z0-9_-]{32}$/);
});

test('web bundle never imports native OAuth, secure-store or browser modules',async()=>{
 assert.doesNotMatch(stub.replace(/\/\*[\s\S]*?\*\//g,''),/from '(expo-secure-store|expo-apple-authentication|expo-web-browser|expo-crypto)'/);
 const m=await import('../src/auth/starryId/nativeSignIn.tsx');
 assert.equal(m.nativeRefreshTokenStore(),null);
 await assert.rejects(m.nativeRelaySignIn({name:'production',baseUrl:'https://id.starry.phd',issuer:'x'},'google','n'.repeat(20)));
});

test('iOS and Android use Starry browser relay with registered deep link and secure refresh storage',()=>{
 assert.match(native,/keychainAccessible:SecureStore\.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY/);
 assert.match(native,/SecureStore\.setItemAsync\(STARRY_REFRESH_TOKEN_KEY,token,SECURE_OPTIONS\)/);
 assert.match(native,/digestStringAsync\(Crypto\.CryptoDigestAlgorithm\.SHA256,rawNonce/);
 assert.match(native,/buildRelayStartUrl\(env,provider,nonceHash\.toLowerCase\(\),state,NATIVE_RELAY_RETURN_URL\)/);
 assert.match(native,/openAuthSessionAsync\(start,NATIVE_RELAY_RETURN_URL\)/);
 assert.match(native,/parseRelayReturn\(result\.url,NATIVE_RELAY_RETURN_URL,state\)/);
 assert.match(native,/state=base64UrlEncode\(Crypto\.getRandomBytes\(24\)\)/);
 assert.match(native,/NATIVE_RELAY_RETURN_URL='echostarry:\/\/auth\/apple'/);
 assert.doesNotMatch(native,/AppleAuthentication|@react-native-google-signin/);
 const base={baseUrl:'https://id.starry.phd'};
 const returnUrl='echostarry://auth/apple';
 assert.match(buildRelayStartUrl(base,'google','a'.repeat(64),'s'.repeat(20),returnUrl),/auth\/google\/start/);
 assert.match(buildRelayStartUrl(base,'apple','a'.repeat(64),'s'.repeat(20),returnUrl),/auth\/apple\/start/);
 assert.equal(parseRelayReturn(returnUrl+'?id_token=h.p.s&state='+'s'.repeat(20),returnUrl,'s'.repeat(20)).kind,'success');
});

test('mobile provider UI offers both Google and Apple without native SDKs',()=>{
 const panel=read('src/ui/echo/StarryMemberPanel.tsx');
 assert.match(panel,/await nativeRelaySignIn\(env,provider,nonce\)/);
 assert.match(panel,/nativeRelay\('google'\)/);
 assert.match(panel,/nativeRelay\('apple'\)/);
 assert.equal(JSON.parse(read('app.json')).expo.scheme,'echostarry');
 assert.equal(JSON.parse(read('app.json')).expo.ios.usesAppleSignIn,undefined);
 const deps=JSON.parse(read('package.json')).dependencies;
 for(const name of ['expo-secure-store','expo-web-browser','expo-crypto'])assert.match(deps[name],/^~58\./,name);
 assert.equal(deps['@react-native-google-signin/google-signin'],undefined);
});
