/**
 * Web / default build of the native sign-in bridge. Metro picks
 * nativeSignIn.native.tsx on iOS and Android; the web bundle never imports
 * expo-secure-store, expo-apple-authentication, expo-web-browser or expo-crypto.
 */
import type {StarryIdEnvironment} from './env';
import type {RefreshTokenStore} from './storage';

export type NativeAppleResult={idToken:string;code:string|null;redirectUri:string|null};
export type AppleSignInButtonProps={onPress:()=>void;disabled?:boolean;dark?:boolean};

export const nativeRefreshTokenStore=():RefreshTokenStore|null=>null;
export const nativeAppleAvailable=async():Promise<boolean>=>false;
export const nativeAppleSignIn:(env:StarryIdEnvironment,rawNonce:string)=>Promise<NativeAppleResult>=async()=>{
 throw new Error('Native Sign in with Apple is not available on this platform');
};
export const NativeAppleSignInButton:(props:AppleSignInButtonProps)=>null=()=>null;
