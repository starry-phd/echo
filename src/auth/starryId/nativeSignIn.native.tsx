/**
 * Native Starry login uses the same web browser relay on iOS and Android.
 * No native Apple/Google SDK or platform-specific OAuth credentials.
 * Starry ID only allow-lists the registered echostarry://auth/apple callback.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {buildRelayStartUrl,parseRelayReturn,relayRedirectUri} from './starryRelay';
import type {RelayProvider} from './starryRelay';
import {STARRY_REFRESH_TOKEN_KEY} from './storage';
import type {RefreshTokenStore} from './storage';
import type {StarryIdEnvironment} from './env';
import {base64UrlEncode} from './randomState';

export const NATIVE_RELAY_RETURN_URL='echostarry://auth/apple';
const SECURE_OPTIONS={keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY};
export type NativeRelayResult={provider:RelayProvider;idToken:string;code:string|null;redirectUri:string|null};

export function nativeRefreshTokenStore():RefreshTokenStore{
 return {
  async get(){try{return await SecureStore.getItemAsync(STARRY_REFRESH_TOKEN_KEY,SECURE_OPTIONS);}catch{return null;}},
  async set(token){await SecureStore.setItemAsync(STARRY_REFRESH_TOKEN_KEY,token,SECURE_OPTIONS);},
  async clear(){try{await SecureStore.deleteItemAsync(STARRY_REFRESH_TOKEN_KEY,SECURE_OPTIONS);}catch{/* no-op */}}
 };
}

export async function nativeRelaySignIn(env:StarryIdEnvironment,provider:RelayProvider,rawNonce:string):Promise<NativeRelayResult>{
 const nonceHash=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,rawNonce,{encoding:Crypto.CryptoEncoding.HEX});
 const state=base64UrlEncode(Crypto.getRandomBytes(24));
 const start=buildRelayStartUrl(env,provider,nonceHash.toLowerCase(),state,NATIVE_RELAY_RETURN_URL);
 const result=await WebBrowser.openAuthSessionAsync(start,NATIVE_RELAY_RETURN_URL);
 if(result.type!=='success')throw new Error('登入已取消或未完成');
 const relay=parseRelayReturn(result.url,NATIVE_RELAY_RETURN_URL,state);
 if(relay.kind==='error')throw new Error('Starry 登入未完成：'+relay.error);
 return {
  provider,idToken:relay.idToken,code:relay.code,
  redirectUri:provider==='apple'&&relay.code?relayRedirectUri(env,'apple'):null
 };
}
