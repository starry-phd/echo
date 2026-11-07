import {STARRY_ID_APP_ID,starryIdApiUrl} from './env';
import type {StarryIdEnvironment} from './env';
import {parseStarryIdError} from './errors';
import {parseStarryAppConfig} from './appConfig';
import type {StarryAppConfig} from './appConfig';
import {parseStarryMe} from './member';
import type {StarryMember} from './member';
import {parseSignInResponse} from './tokens';
import type {StarrySignIn} from './tokens';
import type {StarryIdSession} from './session';

/**
 * Starry ID calls used by the member panel (integration guide §1–4, §11.2).
 * Unauthenticated: app config, nonce, sign-in. Everything else goes through
 * the session (bearer + single-flight refresh). Never sends cookies.
 */
export type PublicFetch=(url:string,init:{method:string;headers:Record<string,string>;body?:string})=>Promise<{
 status:number;json():Promise<unknown>;headers:{get(name:string):string|null}}>;

async function publicCall(env:StarryIdEnvironment,fetch:PublicFetch,path:string,method:'GET'|'POST',body?:unknown){
 const res=await fetch(starryIdApiUrl(env,path),{
  method,
  headers:{accept:'application/json',...(body===undefined?{}:{'content-type':'application/json'})},
  ...(body===undefined?{}:{body:JSON.stringify(body)})
 });
 let json:unknown=null;
 try{json=await res.json();}catch{json=null;}
 if(res.status>=200&&res.status<300)return json;
 throw parseStarryIdError(res.status,json,res.headers.get('retry-after'));
}

/** null when Starry ID is unreachable or invalid: public screens keep working, member features close. */
export async function fetchAppConfig(env:StarryIdEnvironment,fetch:PublicFetch):Promise<StarryAppConfig|null>{
 try{return parseStarryAppConfig(await publicCall(env,fetch,'/v1/apps/'+STARRY_ID_APP_ID+'/config','GET'));}
 catch{return null;}
}

/** Single-use, app-bound, 10-minute nonce. */
export async function requestNonce(env:StarryIdEnvironment,fetch:PublicFetch):Promise<string>{
 const body=await publicCall(env,fetch,'/v1/auth/nonce','POST',{app_id:STARRY_ID_APP_ID});
 const nonce=typeof body==='object'&&body!==null?(body as {nonce?:unknown}).nonce:undefined;
 if(typeof nonce!=='string'||nonce.length<16||nonce.length>128||/\s/.test(nonce))throw new Error('Invalid Starry nonce');
 return nonce;
}

export type ProviderSignIn={
 provider:'google'|'apple';
 idToken:string;
 nonce:string;
 authorizationCode?:string|null;
 redirectUri?:string|null;
};

export function signInRequestBody(input:ProviderSignIn){
 if(typeof input.idToken!=='string'||input.idToken.length<1||input.idToken.length>8192)throw new Error('Invalid ID token');
 return {
  app_id:STARRY_ID_APP_ID,
  id_token:input.idToken,
  nonce:input.nonce,
  ...(input.provider==='apple'&&input.authorizationCode?{authorization_code:input.authorizationCode}:{}),
  ...(input.provider==='apple'&&input.redirectUri?{redirect_uri:input.redirectUri}:{})
 };
}

export async function signInWithProvider(env:StarryIdEnvironment,fetch:PublicFetch,input:ProviderSignIn):Promise<StarrySignIn>{
 return parseSignInResponse(await publicCall(env,fetch,'/v1/auth/'+input.provider,'POST',signInRequestBody(input)));
}

export async function fetchMe(session:StarryIdSession):Promise<StarryMember>{
 return parseStarryMe(await session.request('/v1/me'));
}

export async function acceptCurrentConsent(session:StarryIdSession,member:StarryMember):Promise<void>{
 await session.request('/v1/me/consents',{method:'POST',body:{
  terms_version:member.consent.termsVersion,privacy_version:member.consent.privacyVersion}});
}

/** Server logout is best effort; local tokens are always cleared. */
export async function signOut(session:StarryIdSession,everywhere=false):Promise<void>{
 try{await session.request(everywhere?'/v1/auth/logout-all':'/v1/auth/logout',{method:'POST'});}
 catch{/* already invalid or offline: still sign out locally */}
 finally{await session.signOutLocally();}
}

/** Immediate, irreversible Starry ID account deletion (no cancellation period).
 * UI must separately remind users that App Store / Google Play subscriptions persist.
 */
export async function requestAccountDeletion(session:StarryIdSession):Promise<void>{
 const body=await session.request('/v1/me/deletion',{method:'POST',body:{confirm:true}});
 if(typeof body!=='object'||body===null||(body as {status?:unknown}).status!=='deleted')
  throw new Error('Starry ID did not confirm permanent deletion');
 await session.signOutLocally();
}
