/** The web bundle never imports native OAuth, secure-store, or browser modules. */
import type {StarryIdEnvironment} from './env';
import type {RelayProvider} from './starryRelay';
import type {RefreshTokenStore} from './storage';
export type NativeRelayResult={provider:RelayProvider;idToken:string;code:string|null;redirectUri:string|null};
export const NATIVE_RELAY_RETURN_URL='echostarry://auth/apple';
export const nativeRefreshTokenStore=():RefreshTokenStore|null=>null;
export const nativeRelaySignIn:(env:StarryIdEnvironment,provider:RelayProvider,nonce:string)=>Promise<NativeRelayResult>=async()=>{
 throw new Error('Native sign-in is unavailable on the web');
};
