import type {StarryIdEnvironment} from './env';
import {buildRelayStartUrl,parseRelayReturn,relayRedirectUri,relaySignInBody} from './starryRelay';
import type {RelayResult} from './starryRelay';

/**
 * Android "Sign in with Apple" through the Starry ID relay (integration guide §11.3):
 * the registered deep link `echostarry://auth/apple`, result after `?`.
 * Thin wrappers over the generic relay in ./starryRelay.
 */
export const APPLE_RELAY_RETURN_URL='echostarry://auth/apple';
export type AppleRelayResult=RelayResult;

export function appleRelayRedirectUri(env:StarryIdEnvironment):string{
 return relayRedirectUri(env,'apple');
}
export function buildAppleRelayStartUrl(env:StarryIdEnvironment,nonceSha256Hex:string,state:string):string{
 return buildRelayStartUrl(env,'apple',nonceSha256Hex,state,APPLE_RELAY_RETURN_URL);
}
export function parseAppleRelayReturn(returnUrl:string,expectedState:string):AppleRelayResult{
 return parseRelayReturn(returnUrl,APPLE_RELAY_RETURN_URL,expectedState);
}
export function appleRelaySignInBody(env:StarryIdEnvironment,result:{idToken:string;code:string|null},rawNonce:string,deviceLabel?:string){
 return relaySignInBody(env,'apple',result,rawNonce,deviceLabel);
}
