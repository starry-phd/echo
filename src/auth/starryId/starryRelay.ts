import {STARRY_ID_APP_ID} from './env';
import type {StarryIdEnvironment} from './env';

/**
 * Starry sign-in relay for Google and Apple (starry-phd/id integration guide §11.2, §11.3;
 * src/web/login-relay.ts there). Used by the web version (return to an https page on a
 * registered web origin, result after `#`) and by Android Apple (return to the registered
 * deep link, result after `?`).
 * 1. raw nonce from POST /v1/auth/nonce stays on the device; only SHA-256(nonce) hex travels;
 * 2. open {base}/auth/{provider}/start?app_id=echo&nonce=<hash>&return=<return>&state=<random>;
 * 3. Starry returns <return>?…  (deep link) or <return>#…  (web) with id_token [+ code] + state,
 *    or error + state;
 * 4. state must match before POST /v1/auth/{provider} with the RAW nonce
 *    (Apple adds authorization_code and redirect_uri = {base}/auth/apple/callback).
 * String-only parsing: React Native's URL polyfill is incomplete, so no URL/URLSearchParams here.
 */
export type RelayProvider='google'|'apple';
export type RelayResult=
 |{kind:'success';idToken:string;code:string|null}
 |{kind:'error';error:string};

const HEX64=/^[0-9a-f]{64}$/;
// Starry accepts [A-Za-z0-9._~-]{0,256}; this app always sends 16–128 URL-safe random characters.
const STATE=/^[A-Za-z0-9_-]{16,128}$/;

function provider(value:string):RelayProvider{
 if(value!=='google'&&value!=='apple')throw new Error('Unsupported relay provider');
 return value;
}

export function relayRedirectUri(env:StarryIdEnvironment,p:RelayProvider):string{
 return env.baseUrl+'/auth/'+provider(p)+'/callback';
}

export function buildRelayStartUrl(env:StarryIdEnvironment,p:RelayProvider,nonceSha256Hex:string,state:string,returnUrl:string):string{
 if(!HEX64.test(nonceSha256Hex))throw new Error('The relay needs the lowercase SHA-256 hex of the nonce, never the raw nonce');
 if(!STATE.test(state))throw new Error('Relay state must be 16-128 URL-safe random characters');
 if(!/^(echostarry:\/\/auth\/(apple|google)|https:\/\/[a-z0-9.-]+\/[A-Za-z0-9/_-]*)$/.test(returnUrl))
  throw new Error('Relay return must be the app deep link or an https page');
 return env.baseUrl+'/auth/'+provider(p)+'/start'
  +'?app_id='+encodeURIComponent(STARRY_ID_APP_ID)
  +'&nonce='+nonceSha256Hex
  +'&return='+encodeURIComponent(returnUrl)
  +'&state='+state;
}

function params(query:string):Map<string,string>{
 const out=new Map<string,string>();
 for(const part of query.split('&')){
  if(!part)continue;
  const i=part.indexOf('=');
  const key=decodeURIComponent((i<0?part:part.slice(0,i)).replace(/\+/g,' '));
  const value=i<0?'':decodeURIComponent(part.slice(i+1).replace(/\+/g,' '));
  if(out.has(key))throw new Error('Duplicate relay parameter: '+key);
  out.set(key,value);
 }
 return out;
}

/**
 * `returnUrl` is the exact return sent to /start; the result must come back on it
 * (`?` for the deep link, `#` for a web page). Throws on a foreign URL or a state mismatch.
 */
export function parseRelayReturn(url:string,returnUrl:string,expectedState:string):RelayResult{
 const separator=returnUrl.startsWith('https://')?'#':'?';
 if(typeof url!=='string'||!url.startsWith(returnUrl+separator))throw new Error('Unexpected relay return URL');
 let rest=url.slice(returnUrl.length+1);
 if(separator==='?')rest=rest.split('#')[0];
 const p=params(rest);
 if(!STATE.test(expectedState)||p.get('state')!==expectedState)throw new Error('Relay state mismatch');
 const error=p.get('error');
 if(error)return {kind:'error',error:error.slice(0,100)};
 const idToken=p.get('id_token');
 if(!idToken||/\s/.test(idToken)||idToken.split('.').length!==3)throw new Error('Relay returned no ID token');
 const code=p.get('code');
 return {kind:'success',idToken,code:code&&!/\s/.test(code)?code:null};
}

/** Body for POST /v1/auth/{provider} after the relay; carries the RAW nonce. */
export function relaySignInBody(env:StarryIdEnvironment,p:RelayProvider,result:{idToken:string;code:string|null},rawNonce:string,deviceLabel?:string){
 return {
  app_id:STARRY_ID_APP_ID,
  id_token:result.idToken,
  nonce:rawNonce,
  ...(provider(p)==='apple'&&result.code?{authorization_code:result.code,redirect_uri:relayRedirectUri(env,'apple')}:{}),
  ...(deviceLabel?{device_label:deviceLabel.slice(0,60)}:{})
 };
}
