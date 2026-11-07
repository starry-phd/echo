import {STARRY_ID_APP_ID,starryIdApiUrl} from './env';
import type {StarryIdEnvironment} from './env';
import {StarryIdError,parseStarryIdError} from './errors';
import {parseTokenPair} from './tokens';
import type {StarryTokenPair} from './tokens';
import type {RefreshTokenStore} from './storage';

/**
 * Authenticated Starry ID calls with the rotation rules of integration guide §3:
 * - Bearer access token in memory only; refresh token in the injected store.
 * - 401 UNAUTHORIZED → ONE refresh (single-flight lock shared by all callers) → retry once.
 * - The new refresh token replaces the old one BEFORE anyone can use it again;
 *   INVALID_REFRESH / REFRESH_REUSED (whole session revoked) → signed out.
 * - Tokens are only ever sent to the allow-listed Starry ID origin, never with cookies.
 */
type FetchLike=(url:string,init:{method:string;headers:Record<string,string>;body?:string})=>Promise<{
 status:number;json():Promise<unknown>;headers:{get(name:string):string|null}}>;

export type StarryIdSession={
 adoptTokens(tokens:StarryTokenPair):Promise<void>;
 request(path:string,init?:{method?:string;body?:unknown;headers?:Record<string,string>}):Promise<unknown>;
 refresh():Promise<boolean>;
 signOutLocally():Promise<void>;
 hasAccessToken():boolean;
 /** For bearer auth to Echo's OWN backend; never expose token in the UI. */
 getAccessToken():Promise<string|null>;
};

const SIGNED_OUT_CODES=new Set(['INVALID_REFRESH','REFRESH_REUSED','ACCOUNT_SUSPENDED']);

export function createStarryIdSession(options:{
 env:StarryIdEnvironment;store:RefreshTokenStore;fetch:FetchLike;onSignedOut?:(reason:string)=>void;
}):StarryIdSession{
 const {env,store}=options;
 let accessToken:string|null=null;
 let inflight:Promise<boolean>|null=null;

 const call=async(path:string,method:string,body:unknown,headers:Record<string,string>)=>{
  const res=await options.fetch(starryIdApiUrl(env,path),{
   method,
   headers:{accept:'application/json',...(body===undefined?{}:{'content-type':'application/json'}),...headers},
   ...(body===undefined?{}:{body:JSON.stringify(body)})
  });
  let json:unknown=null;
  try{json=await res.json();}catch{json=null;}
  if(res.status>=200&&res.status<300)return json;
  throw parseStarryIdError(res.status,json,res.headers.get('retry-after'));
 };

 const signOutLocally=async(reason='signed-out')=>{
  accessToken=null;
  await store.clear();
  options.onSignedOut?.(reason);
 };

 const doRefresh=async():Promise<boolean>=>{
  const refreshToken=await store.get();
  if(!refreshToken){accessToken=null;return false;}
  try{
   const tokens=parseTokenPair(await call('/v1/auth/refresh','POST',{refresh_token:refreshToken},{}));
   await store.set(tokens.refreshToken); // rotation: replace before releasing the lock
   accessToken=tokens.accessToken;
   return true;
  }catch(error){
   if(error instanceof StarryIdError&&SIGNED_OUT_CODES.has(error.code)){await signOutLocally(error.code);return false;}
   throw error; // network / 5xx: keep the stored token, let the caller fail closed
  }
 };

 const refresh=()=>{
  if(!inflight)inflight=doRefresh().finally(()=>{inflight=null;});
  return inflight;
 };

 const request=async(path:string,init:{method?:string;body?:unknown;headers?:Record<string,string>}={})=>{
  const method=(init.method??'GET').toUpperCase();
  const send=()=>{
   if(!accessToken)throw new StarryIdError(401,'UNAUTHORIZED','No access token',null,null,null);
   return call(path,method,init.body,{...(init.headers??{}),authorization:'Bearer '+accessToken});
  };
  if(!accessToken&&!(await refresh()))throw new StarryIdError(401,'INVALID_REFRESH','Signed out',null,null,null);
  try{return await send();}
  catch(error){
   if(!(error instanceof StarryIdError)||error.code!=='UNAUTHORIZED')throw error;
   if(!(await refresh()))throw new StarryIdError(401,'INVALID_REFRESH','Signed out',null,null,null);
   return send();
  }
 };

 return {
  async adoptTokens(tokens){await store.set(tokens.refreshToken);accessToken=tokens.accessToken;},
  request,
  refresh,
  signOutLocally:()=>signOutLocally(),
  hasAccessToken:()=>accessToken!==null,
  getAccessToken:async()=>{
   if(!accessToken&&!(await refresh()))return null;
   return accessToken;
  }
 };
}

/** Body for `POST /v1/auth/nonce`; the nonce is bound to this app. */
export const STARRY_NONCE_REQUEST={app_id:STARRY_ID_APP_ID} as const;
