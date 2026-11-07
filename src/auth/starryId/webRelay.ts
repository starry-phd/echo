import type {StarryIdEnvironment} from './env';
import {buildRelayStartUrl,parseRelayReturn,relayRedirectUri} from './starryRelay';
import type {RelayProvider,RelayResult} from './starryRelay';
import {base64UrlEncode} from './randomState';

/**
 * Web sign-in through the Starry relay (starry-phd/id integration guide §11.2, updated
 * 2026-11-03): a full-page redirect to Starry ID, no Google/Apple scripts on this site and no
 * site registration with Apple or Google. The raw nonce and state survive the redirect in
 * sessionStorage only (single use, 10 minutes); the result comes back after `#`, which never
 * reaches any server, and is wiped from the address bar immediately.
 */
export const APP_WEB_ORIGIN='https://echo.starry.phd';
export const STAGING_WEB_ORIGIN='https://echo-api-staging.starry-phd.workers.dev';
export const ALLOWED_WEB_ORIGINS=[APP_WEB_ORIGIN,STAGING_WEB_ORIGIN] as const;
export const WEB_RELAY_RETURN_PATH='/auth/done';
export const WEB_RELAY_RETURN_URL=APP_WEB_ORIGIN+WEB_RELAY_RETURN_PATH;
export const WEB_RELAY_PENDING_KEY='starry-id-relay-pending-v1';
const MAX_AGE_MS=10*60_000;

type Pending={provider:RelayProvider;nonce:string;state:string;startedAt:number;returnUrl?:string};
type StorageLike={getItem(k:string):string|null;setItem(k:string,v:string):void;removeItem(k:string):void};

/** Only the origin registered in Starry ID `web_origins` can receive the result. */
export function webRelaySupported(origin:string|null|undefined):boolean{
 return typeof origin==='string'&&ALLOWED_WEB_ORIGINS.some(value=>origin===value);
}

/** A login started on a given registered origin must return to that same origin. */
export function webRelayReturnUrl(origin:string):string{
 if(!webRelaySupported(origin))throw new Error('Unregistered Starry ID web origin');
 return origin+WEB_RELAY_RETURN_PATH;
}

/** Structural subset of SubtleCrypto (window.crypto.subtle satisfies it). */
export type Sha256Digest={digest(algorithm:string,data:Uint8Array<ArrayBuffer>):Promise<ArrayBuffer>};

export async function sha256Hex(text:string,subtle:Sha256Digest):Promise<string>{
 const bytes=new Uint8Array(await subtle.digest('SHA-256',new TextEncoder().encode(text)));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}

/** Prepares the redirect; the caller navigates to the returned URL. */
export async function prepareWebRelay(env:StarryIdEnvironment,provider:RelayProvider,rawNonce:string,deps:{
 storage:StorageLike;subtle:Sha256Digest;randomBytes:(n:number)=>Uint8Array;now:()=>number;origin?:string;
}):Promise<string>{
 const origin=deps.origin??(typeof window!=='undefined'?window.location.origin:APP_WEB_ORIGIN);
 const returnUrl=webRelayReturnUrl(origin);
 const state=base64UrlEncode(deps.randomBytes(24));
 const pending:Pending={provider,nonce:rawNonce,state,startedAt:deps.now(),returnUrl};
 deps.storage.setItem(WEB_RELAY_PENDING_KEY,JSON.stringify(pending));
 return buildRelayStartUrl(env,provider,await sha256Hex(rawNonce,deps.subtle),state,returnUrl);
}

export type WebRelayOutcome=
 |{kind:'success';provider:RelayProvider;nonce:string;idToken:string;code:string|null;redirectUri:string|null}
 |{kind:'cancelled';error:string}
 |{kind:'invalid';reason:string};

/** Reads and clears the pending entry (single use) and checks the returned fragment. */
export function consumeWebRelay(env:StarryIdEnvironment,href:string,deps:{storage:StorageLike;now:()=>number}):WebRelayOutcome{
 let pending:Pending|null=null;
 try{pending=JSON.parse(deps.storage.getItem(WEB_RELAY_PENDING_KEY)??'null') as Pending|null;}catch{pending=null;}
 deps.storage.removeItem(WEB_RELAY_PENDING_KEY);
 if(!pending||(pending.provider!=='google'&&pending.provider!=='apple')||typeof pending.nonce!=='string'||typeof pending.state!=='string')
  return {kind:'invalid',reason:'沒有進行中的登入，請重新登入。'};
 if(!(deps.now()-pending.startedAt>=0&&deps.now()-pending.startedAt<=MAX_AGE_MS))
  return {kind:'invalid',reason:'登入逾時，請重新登入。'};
 let result:RelayResult;
 const returnUrl=pending.returnUrl??WEB_RELAY_RETURN_URL;
 try{
  const expectedOrigin=new URL(returnUrl).origin;
  if(returnUrl!==webRelayReturnUrl(expectedOrigin))throw new Error('Invalid login origin');
  result=parseRelayReturn(href,returnUrl,pending.state);
 }
 catch{return {kind:'invalid',reason:'登入結果無法驗證，請重新登入。'};}
 if(result.kind==='error')return {kind:'cancelled',error:result.error};
 return {kind:'success',provider:pending.provider,nonce:pending.nonce,idToken:result.idToken,code:result.code,
  redirectUri:pending.provider==='apple'&&result.code?relayRedirectUri(env,'apple'):null};
}
