import {evaluateAppAvailability} from './appConfig';
import type {StarryIdEnvironment} from './env';
import {fetchAppConfig,fetchMe,signInWithProvider} from './memberApi';
import type {ProviderSignIn,PublicFetch} from './memberApi';
import {stateAfterSignIn,stateFromAvailability,stateFromError,stateFromMember} from './memberFlow';
import type {MemberViewState} from './memberFlow';
import type {StarryIdSession} from './session';

export type MemberDeps={env:StarryIdEnvironment;fetch:PublicFetch;session:StarryIdSession;appVersion:string};

/**
 * Called only when the member panel is opened with Starry ID enabled:
 * app gate first, then a stored refresh token (no network call if none), then /v1/me.
 */
export async function loadMemberState(deps:MemberDeps):Promise<MemberViewState>{
 const gate=stateFromAvailability(evaluateAppAvailability(await fetchAppConfig(deps.env,deps.fetch),deps.appVersion));
 if(gate)return gate;
 try{
  if(!deps.session.hasAccessToken()&&!(await deps.session.refresh()))return {kind:'signed-out'};
  return stateFromMember(await fetchMe(deps.session));
 }catch(error){return stateFromError(error);}
}

/** POST /v1/auth/{provider} → adopt tokens → pending deletion / suspension / consent / signed in. */
export async function completeSignIn(deps:MemberDeps,input:ProviderSignIn):Promise<MemberViewState>{
 try{
  const signIn=await signInWithProvider(deps.env,deps.fetch,input);
  await deps.session.adoptTokens(signIn.tokens);
  const early=stateAfterSignIn(signIn);
  if(early)return early;
  return stateFromMember(await fetchMe(deps.session));
 }catch(error){return stateFromError(error);}
}
