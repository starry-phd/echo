/**
 * iOS / Android sign-in bridge (starry-phd/id integration guide §2, §11.3).
 * - Refresh token: expo-secure-store (iOS Keychain / Android Keystore), this device only.
 * - iOS: native Sign in with Apple; the RAW nonce is passed (the SDK hashes it; Starry accepts both).
 * - Android: Starry ID relay — only SHA-256(nonce) leaves the app, state is verified on return.
 * Everything stays dormant until the build enables Starry ID (StarryIdProvider).
 */
import {Platform,Pressable,StyleSheet,Text} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {APPLE_RELAY_RETURN_URL,appleRelayRedirectUri,buildAppleRelayStartUrl,parseAppleRelayReturn} from './appleRelay';
import type {StarryIdEnvironment} from './env';
import {STARRY_REFRESH_TOKEN_KEY} from './storage';
import type {RefreshTokenStore} from './storage';
import {base64UrlEncode} from './randomState';

export type NativeAppleResult={idToken:string;code:string|null;redirectUri:string|null};
export type AppleSignInButtonProps={onPress:()=>void;disabled?:boolean;dark?:boolean};

const SECURE_OPTIONS={keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY};

export function nativeRefreshTokenStore():RefreshTokenStore{
 return {
  async get(){try{return await SecureStore.getItemAsync(STARRY_REFRESH_TOKEN_KEY,SECURE_OPTIONS);}catch{return null;}},
  async set(token){await SecureStore.setItemAsync(STARRY_REFRESH_TOKEN_KEY,token,SECURE_OPTIONS);},
  async clear(){try{await SecureStore.deleteItemAsync(STARRY_REFRESH_TOKEN_KEY,SECURE_OPTIONS);}catch{/* already gone */}}
 };
}

export async function nativeAppleAvailable():Promise<boolean>{
 if(Platform.OS==='ios'){try{return await AppleAuthentication.isAvailableAsync();}catch{return false;}}
 return Platform.OS==='android';
}

export async function nativeAppleSignIn(env:StarryIdEnvironment,rawNonce:string):Promise<NativeAppleResult>{
 if(Platform.OS==='ios'){
  const credential=await AppleAuthentication.signInAsync({
   requestedScopes:[AppleAuthentication.AppleAuthenticationScope.EMAIL],
   nonce:rawNonce
  });
  if(!credential.identityToken)throw new Error('Apple returned no ID token');
  return {idToken:credential.identityToken,code:credential.authorizationCode??null,redirectUri:null};
 }
 const nonceHash=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,rawNonce,{encoding:Crypto.CryptoEncoding.HEX});
 const state=base64UrlEncode(Crypto.getRandomBytes(24));
 const result=await WebBrowser.openAuthSessionAsync(buildAppleRelayStartUrl(env,nonceHash.toLowerCase(),state),APPLE_RELAY_RETURN_URL);
 if(result.type!=='success')throw new Error('Apple sign-in was cancelled');
 const relay=parseAppleRelayReturn(result.url,state);
 if(relay.kind==='error')throw new Error('Apple sign-in failed: '+relay.error);
 return {idToken:relay.idToken,code:relay.code,redirectUri:relay.code?appleRelayRedirectUri(env):null};
}

/** Apple's own button on iOS (Human Interface Guidelines); an equivalent black button on Android. */
export function NativeAppleSignInButton({onPress,disabled,dark}:AppleSignInButtonProps){
 if(Platform.OS==='ios')return <AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={dark?AppleAuthentication.AppleAuthenticationButtonStyle.WHITE:AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={22} style={styles.ios} onPress={()=>{if(!disabled)onPress();}}/>;
 return <Pressable accessibilityRole="button" accessibilityLabel="使用 Apple 帳號登入" disabled={disabled} onPress={onPress}
  style={[styles.android,disabled&&styles.disabled]}>
  <Text style={styles.androidLabel}>使用 Apple 帳號登入</Text>
 </Pressable>;
}

const styles=StyleSheet.create({
 ios:{width:240,height:44},
 android:{minHeight:44,borderRadius:22,backgroundColor:'#000',alignItems:'center',justifyContent:'center',paddingHorizontal:18,alignSelf:'flex-start'},
 androidLabel:{color:'#fff',fontWeight:'800',fontSize:15},
 disabled:{opacity:.5}
});
