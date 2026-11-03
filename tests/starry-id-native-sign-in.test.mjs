import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {base64UrlEncode} from '../src/auth/starryId/randomState.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const native=read('src/auth/starryId/nativeSignIn.native.tsx');
const stub=read('src/auth/starryId/nativeSignIn.tsx');

test('state encoder matches RFC 4648 base64url without padding and fits the relay state rule',()=>{
 for(let i=0;i<50;i++){
  const bytes=randomBytes(1+(i%30));
  assert.equal(base64UrlEncode(new Uint8Array(bytes)),bytes.toString('base64url'));
 }
 assert.match(base64UrlEncode(new Uint8Array(randomBytes(24))),/^[A-Za-z0-9_-]{32}$/);
});

test('web bundle stub never imports native modules and refuses native sign-in',async()=>{
 assert.doesNotMatch(stub.replace(/\/\*[\s\S]*?\*\//g,''),/from '(expo-secure-store|expo-apple-authentication|expo-web-browser|expo-crypto)'/);
 const m=await import('../src/auth/starryId/nativeSignIn.tsx');
 assert.equal(m.nativeRefreshTokenStore(),null);
 assert.equal(await m.nativeAppleAvailable(),false);
 await assert.rejects(m.nativeAppleSignIn({name:'production',baseUrl:'https://id.starry.phd',issuer:'x'},'n'.repeat(20)));
 assert.equal(m.NativeAppleSignInButton({onPress(){}}),null);
});

test('native: Keychain/Keystore this-device-only storage, raw nonce to iOS, only the hash to the Android relay',()=>{
 assert.match(native,/keychainAccessible:SecureStore\.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY/);
 assert.match(native,/SecureStore\.setItemAsync\(STARRY_REFRESH_TOKEN_KEY,token,SECURE_OPTIONS\)/);
 assert.match(native,/AppleAuthentication\.signInAsync\(\{\s*requestedScopes:\[AppleAuthentication\.AppleAuthenticationScope\.EMAIL\],\s*nonce:rawNonce/);
 assert.match(native,/digestStringAsync\(Crypto\.CryptoDigestAlgorithm\.SHA256,rawNonce/);
 assert.match(native,/buildAppleRelayStartUrl\(env,nonceHash\.toLowerCase\(\),state\)/);
 assert.match(native,/parseAppleRelayReturn\(result\.url,state\)/);
 assert.match(native,/state=base64UrlEncode\(Crypto\.getRandomBytes\(24\)\)/);
 assert.doesNotMatch(native,/buildAppleRelayStartUrl\([^)]*rawNonce/);
 assert.match(native,/AppleAuthentication\.AppleAuthenticationButton/);
});

test('wiring: provider uses native secure storage, panel shows Apple on native, app and deps configured',()=>{
 assert.match(read('src/auth/starryId/StarryIdProvider.tsx'),/if\(Platform\.OS!=='web'\)return nativeRefreshTokenStore\(\)\?\?createMemoryRefreshTokenStore\(\);/);
 const panel=read('src/ui/echo/StarryMemberPanel.tsx');
 assert.match(panel,/nativeApple&&<NativeAppleSignInButton/);
 assert.match(panel,/await nativeAppleSignIn\(env,nonce\)/);
 assert.equal(JSON.parse(read('app.json')).expo.ios.usesAppleSignIn,true);
 const deps=JSON.parse(read('package.json')).dependencies;
 for(const name of ['expo-secure-store','expo-apple-authentication','expo-web-browser','expo-crypto'])assert.match(deps[name],/^~58\./,name);
 assert.equal(deps['@react-native-google-signin/google-signin'],undefined,'native Google waits for the iOS/Android OAuth clients');
});
