import {STARRY_ID_APP_ID} from './env';
import type {StarryIdEnvironment} from './env';

/**
 * Android "Sign in with Apple" through the Starry ID relay (integration guide §11.3):
 * 1. raw nonce from POST /v1/auth/nonce stays in app memory; only SHA-256(nonce) hex goes to Apple;
 * 2. open {base}/auth/apple/start?app_id=echo&nonce=<hash>&return=echostarry://auth/apple&state=<random>;
 * 3. Starry redirects to echostarry://auth/apple?id_token=…&code=…&state=… (or ?error=…&state=…);
 * 4. state must match before POST /v1/auth/apple with the RAW nonce and the relay redirect_uri.
 * String-only parsing: React Native's URL polyfill is incomplete, so no URL/URLSearchParams here.
 */
export const APPLE_RELAY_RETURN_URL='echostarry://auth/apple';

const HEX64=/^[0-9a-f]{64}$/;
const STATE=/^[A-Za-z0-9_-]{16,128}$/;

export function appleRelayRedirectUri(env:StarryIdEnvironment):string{
 return env.baseUrl+'/auth/apple/callback';
}

export function buildAppleRelayStartUrl(env:StarryIdEnvironment,nonceSha256Hex:string,state:string):string{
 if(!HEX64.test(nonceSha256Hex))throw new Error('Apple relay needs the lowercase SHA-256 hex of the nonce, never the raw nonce');
 if(!STATE.test(state))throw new Error('Apple relay state must be 16-128 URL-safe random characters');
 return env.baseUrl+'/auth/apple/start'
  +'?app_id='+encodeURIComponent(STARRY_ID_APP_ID)
  +'&nonce='+nonceSha256Hex
  +'&return='+encodeURIComponent(APPLE_RELAY_RETURN_URL)
  +'&state='+state;
}

export type AppleRelayResult=
 |{kind:'success';idToken:string;code:string|null}
 |{kind:'error';error:string};

function queryParams(query:string):Map<string,string>{
 const params=new Map<string,string>();
 for(const part of query.split('&')){
  if(!part)continue;
  const i=part.indexOf('=');
  const key=decodeURIComponent((i<0?part:part.slice(0,i)).replace(/\+/g,' '));
  const value=i<0?'':decodeURIComponent(part.slice(i+1).replace(/\+/g,' '));
  if(params.has(key))throw new Error('Duplicate Apple relay parameter: '+key);
  params.set(key,value);
 }
 return params;
}

/** Throws on a foreign return URL or a state mismatch (CSRF / injected callback). */
export function parseAppleRelayReturn(returnUrl:string,expectedState:string):AppleRelayResult{
 if(typeof returnUrl!=='string'||!returnUrl.startsWith(APPLE_RELAY_RETURN_URL+'?'))
  throw new Error('Unexpected Apple relay return URL');
 const params=queryParams(returnUrl.slice(APPLE_RELAY_RETURN_URL.length+1).split('#')[0]);
 if(!STATE.test(expectedState)||params.get('state')!==expectedState)throw new Error('Apple relay state mismatch');
 const error=params.get('error');
 if(error)return {kind:'error',error:error.slice(0,100)};
 const idToken=params.get('id_token');
 if(!idToken||/\s/.test(idToken)||idToken.split('.').length!==3)throw new Error('Apple relay returned no ID token');
 const code=params.get('code');
 return {kind:'success',idToken,code:code&&!/\s/.test(code)?code:null};
}

/** Body for POST /v1/auth/apple after the relay; carries the RAW nonce. */
export function appleRelaySignInBody(env:StarryIdEnvironment,result:{idToken:string;code:string|null},rawNonce:string,deviceLabel?:string){
 return {
  app_id:STARRY_ID_APP_ID,
  id_token:result.idToken,
  nonce:rawNonce,
  ...(result.code?{authorization_code:result.code,redirect_uri:appleRelayRedirectUri(env)}:{}),
  ...(deviceLabel?{device_label:deviceLabel.slice(0,60)}:{})
 };
}
