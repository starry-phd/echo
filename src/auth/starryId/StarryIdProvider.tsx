import {createContext,useCallback,useContext,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {Platform} from 'react-native';
import Constants from 'expo-constants';
import {resolveStarryIdEnvironment} from './env';
import type {StarryIdEnvironment} from './env';
import {acceptCurrentConsent,cancelAccountDeletion,fetchMe,requestAccountDeletion,requestNonce,signOut} from './memberApi';
import type {ProviderSignIn,PublicFetch} from './memberApi';
import {formatPurgeDate,stateFromError,stateFromMember} from './memberFlow';
import type {MemberViewState} from './memberFlow';
import {completeSignIn,loadMemberState} from './memberSession';
import {createStarryIdSession} from './session';
import type {StarryIdSession} from './session';
import {createMemoryRefreshTokenStore,createSessionStorageRefreshTokenStore} from './storage';
import type {RefreshTokenStore} from './storage';

/**
 * Member state for the whole app. DISABLED unless EXPO_PUBLIC_STARRY_ID_API_BASE_URL
 * is one of the two allow-listed Starry ID origins (CI and Production set none),
 * and even then nothing is fetched until the member panel calls ensureLoaded().
 */
const STARRY_ENV:StarryIdEnvironment|null=resolveStarryIdEnvironment(process.env.EXPO_PUBLIC_STARRY_ID_API_BASE_URL);

export type StarryIdContextValue={
 enabled:boolean;
 env:StarryIdEnvironment|null;
 state:MemberViewState;
 busy:boolean;
 ensureLoaded():void;
 getNonce():Promise<string>;
 signIn(input:ProviderSignIn):Promise<void>;
 acceptConsent():Promise<void>;
 signOut(everywhere?:boolean):Promise<void>;
 requestDeletion():Promise<void>;
 cancelDeletion():Promise<void>;
};

const disabled:StarryIdContextValue={
 enabled:false,env:null,state:{kind:'disabled'},busy:false,
 ensureLoaded(){},
 getNonce:()=>Promise.reject(new Error('Starry ID disabled')),
 signIn:async()=>{},acceptConsent:async()=>{},signOut:async()=>{},requestDeletion:async()=>{},cancelDeletion:async()=>{}
};
const StarryIdContext=createContext<StarryIdContextValue>(disabled);

function refreshTokenStore():RefreshTokenStore{
 // Native secure storage (expo-secure-store) arrives with native sign-in; until then memory only.
 if(Platform.OS!=='web')return createMemoryRefreshTokenStore();
 let storage:Storage|null=null;
 try{storage=typeof window!=='undefined'?window.sessionStorage:null;}catch{storage=null;}
 return createSessionStorageRefreshTokenStore(storage);
}

const browserFetch:PublicFetch=(url,init)=>fetch(url,{...init,credentials:'omit'});

export function StarryIdProvider({children}:{children:ReactNode}){
 if(!STARRY_ENV)return <StarryIdContext.Provider value={disabled}>{children}</StarryIdContext.Provider>;
 return <EnabledStarryIdProvider env={STARRY_ENV}>{children}</EnabledStarryIdProvider>;
}

function EnabledStarryIdProvider({env,children}:{env:StarryIdEnvironment;children:ReactNode}){
 const [state,setState]=useState<MemberViewState>({kind:'checking'});
 const [busy,setBusy]=useState(false);
 const loaded=useRef(false);
 const sessionRef=useRef<StarryIdSession|null>(null);
 if(!sessionRef.current){
  sessionRef.current=createStarryIdSession({env,store:refreshTokenStore(),fetch:browserFetch,
   onSignedOut:reason=>setState(reason==='ACCOUNT_SUSPENDED'?{kind:'suspended'}
    :reason==='REFRESH_REUSED'?{kind:'signed-out',notice:'為了安全，這個登入已失效，請重新登入。'}
    :{kind:'signed-out'})});
 }
 const session=sessionRef.current;
 const deps=useMemo(()=>({env,fetch:browserFetch,session,appVersion:Constants.expoConfig?.version??''}),[env,session]);

 const run=useCallback(async(task:()=>Promise<MemberViewState|void>)=>{
  setBusy(true);
  try{const next=await task();if(next)setState(next);}
  catch(error){setState(stateFromError(error));}
  finally{setBusy(false);}
 },[]);

 const value=useMemo<StarryIdContextValue>(()=>({
  enabled:true,env,state,busy,
  ensureLoaded(){
   if(loaded.current)return;
   loaded.current=true;
   void run(()=>loadMemberState(deps));
  },
  getNonce:()=>requestNonce(env,browserFetch),
  signIn:input=>run(()=>completeSignIn(deps,input)),
  acceptConsent:()=>run(async()=>{
   if(state.kind!=='consent-required')return;
   await acceptCurrentConsent(session,state.member);
   return stateFromMember(await fetchMe(session));
  }),
  signOut:(everywhere=false)=>run(async()=>{await signOut(session,everywhere);return {kind:'signed-out'};}),
  // Starry ID ends every session on deletion; withdrawing needs a fresh sign-in within 7 days.
  requestDeletion:()=>run(async()=>{
   const purgeAt=await requestAccountDeletion(session);
   return {kind:'signed-out',notice:'帳號已排定於 '+formatPurgeDate(purgeAt)+' 刪除，所有裝置都已登出。期限內重新登入即可撤回。'};
  }),
  cancelDeletion:()=>run(async()=>{await cancelAccountDeletion(session);return stateFromMember(await fetchMe(session));})
 }),[env,state,busy,deps,run,session]);

 return <StarryIdContext.Provider value={value}>{children}</StarryIdContext.Provider>;
}

export function useStarryId():StarryIdContextValue{
 return useContext(StarryIdContext);
}
