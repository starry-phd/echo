import {STARRY_ID_APP_ID,starryIdApiUrl} from './env';
import {validateLoginOptions,validateCreationOptions} from './passkeyContract';
import type {CredentialAssertion,CredentialAttestation,LoginOptions,PasskeyEntry} from './passkeyContract';
import type {components as StarryComponents} from '../../../packages/starry-id-sdk/src/generated';
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

/** Starry ID WebAuthn: all challenges and RP IDs come exclusively from Starry ID. */
export async function getPasskeySignInOptions(env:StarryIdEnvironment,fetch:PublicFetch):Promise<LoginOptions>{
 const result=await publicCall(env,fetch,'/v1/auth/passkey/options','POST',{app_id:STARRY_ID_APP_ID});
 const options=result as Partial<StarryComponents['schemas']['PasskeyRequestOptions']>|null;
 return validateLoginOptions(options?.publicKey);
}
export async function signInWithPasskey(env:StarryIdEnvironment,fetch:PublicFetch,credential:CredentialAssertion):Promise<StarrySignIn>{
 return parseSignInResponse(await publicCall(env,fetch,'/v1/auth/passkey','POST',{
  app_id:STARRY_ID_APP_ID,id:credential.id,clientDataJSON:credential.clientDataJSON,
  authenticatorData:credential.authenticatorData,signature:credential.signature
 }));
}
export async function getPasskeyCreationOptions(session:StarryIdSession):Promise<Record<string,unknown>>{
 const result=await session.request('/v1/me/passkeys/options',{method:'POST'});
 const response=result as Partial<StarryComponents['schemas']['PasskeyCreationOptions']>|null;
 return validateCreationOptions(response?.publicKey);
}
export async function registerPasskey(session:StarryIdSession,attestation:CredentialAttestation,name?:string):Promise<void>{
 const result=await session.request('/v1/me/passkeys',{method:'POST',body:{
  ...attestation,...(name?{name:name.slice(0,80)}:{})
 }});
 if((result as {ok?:unknown}|null)?.ok!==true)throw new Error('Starry ID did not confirm Passkey creation');
}
export async function getMemberPasskeys(session:StarryIdSession):Promise<PasskeyEntry[]>{
 const result=await session.request('/v1/me/passkeys');
 const items=(result as {passkeys?:unknown}|null)?.passkeys;
 if(!Array.isArray(items))throw new Error('Invalid Starry ID Passkey list');
 return items.filter((p):p is PasskeyEntry=>{
  if(!p||typeof p!=='object')return false;
  const v=p as Partial<PasskeyEntry>;
  return typeof v.id==='string'&&typeof v.name==='string'&&
   Number.isSafeInteger(v.created_at)&&(v.last_used_at===null||Number.isSafeInteger(v.last_used_at));
 }).slice(0,10);
}
export async function deleteMemberPasskey(session:StarryIdSession,id:string):Promise<void>{
 if(typeof id!=='string'||!id||id.length>1024)throw new Error('Invalid Passkey ID');
 await session.request('/v1/me/passkeys/'+encodeURIComponent(id),{method:'DELETE'});
}
