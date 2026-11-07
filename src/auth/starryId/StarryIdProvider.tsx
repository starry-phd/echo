import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {Platform} from 'react-native';
import Constants from 'expo-constants';
import {resolveStarryIdEnvironment} from './env';
import type {StarryIdEnvironment} from './env';
import {acceptCurrentConsent,fetchAppConfig,fetchMe,requestAccountDeletion,requestNonce,signOut} from './memberApi';
import type {ProviderSignIn,PublicFetch} from './memberApi';
import {stateFromAvailability,stateFromError,stateFromMember} from './memberFlow';
import {evaluateAppAvailability} from './appConfig';
import type {MemberViewState} from './memberFlow';
import {completeSignIn,loadMemberState} from './memberSession';
import {createStarryIdSession} from './session';
import type {StarryIdSession} from './session';
import {createMemoryRefreshTokenStore,createSessionStorageRefreshTokenStore} from './storage';
import {nativeRefreshTokenStore} from './nativeSignIn';
import type {RefreshTokenStore} from './storage';
import type {components as StarryIdComponents} from '../../../packages/starry-id-sdk/src/generated';

export type StarryBatteryBalance=StarryIdComponents['schemas']['BatteryBalance'];
export type StarryQuantumBattery=StarryIdComponents['schemas']['QuantumBattery'];
export type StarryBatteryInfo={balance:StarryBatteryBalance;quantum:StarryQuantumBattery};

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
 getBatteryBalance():Promise<StarryBatteryInfo>;
};

const disabled:StarryIdContextValue={
 enabled:false,env:null,state:{kind:'disabled'},busy:false,
 ensureLoaded(){},
 getNonce:()=>Promise.reject(new Error('Starry ID disabled')),
 signIn:async()=>{},acceptConsent:async()=>{},signOut:async()=>{},requestDeletion:async()=>{},
 getBatteryBalance:async()=>{throw new Error('Starry ID disabled');}
};
const StarryIdContext=createContext<StarryIdContextValue>(disabled);

function refreshTokenStore():RefreshTokenStore{
 // Native: iOS Keychain / Android Keystore via expo-secure-store (nativeSignIn.native.tsx).
 if(Platform.OS!=='web')return nativeRefreshTokenStore()??createMemoryRefreshTokenStore();
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
 const version=Constants.expoConfig?.version??'';
 // Read the public status/min_version/config on launch. Any failure gates
 // member and Battery actions closed while public Echo screens still render.
 useEffect(()=>{
  let alive=true;
  void fetchAppConfig(env,browserFetch).then(config=>{
   if(!alive)return;
   const gate=stateFromAvailability(evaluateAppAvailability(config,version));
   if(gate)setState(gate);
  });
  return()=>{alive=false;};
 },[env,version]);
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
  getNonce:async()=>{
   const gate=stateFromAvailability(evaluateAppAvailability(await fetchAppConfig(env,browserFetch),version));
   if(gate)throw new Error('繁星會員目前無法登入或需要更新');
   return requestNonce(env,browserFetch);
  },
  signIn:input=>run(async()=>{
   const gate=stateFromAvailability(evaluateAppAvailability(await fetchAppConfig(env,browserFetch),version));
   return gate??await completeSignIn(deps,input);
  }),
  acceptConsent:()=>run(async()=>{
   if(state.kind!=='consent-required')return;
   await acceptCurrentConsent(session,state.member);
   return stateFromMember(await fetchMe(session));
  }),
  signOut:(everywhere=false)=>run(async()=>{await signOut(session,everywhere);return {kind:'signed-out'};}),
  requestDeletion:()=>run(async()=>{
   await requestAccountDeletion(session);
   return {kind:'signed-out',notice:'繁星會員帳號已立即永久刪除，無法復原。商店訂閱須自行取消。'};
  }),
  getBatteryBalance:async()=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   const result=await session.request('/v1/me/battery');
   const r=result as {balance?:Partial<StarryBatteryBalance>;quantum?:Partial<StarryQuantumBattery>}|null;
   const b=r?.balance,q=r?.quantum;
   if(!b||typeof b.period!=='string'||!['allowance','used','reserved','remaining','resets_at'].every(k=>Number.isSafeInteger(b[k as keyof StarryBatteryBalance])))
    throw new Error('Battery 免費餘額資料格式不正確');
   if(!q||q.app_id!=='echo'||!['balance','reserved','available'].every(k=>Number.isSafeInteger(q[k as keyof StarryQuantumBattery])))
    throw new Error('量子電池資料格式不正確');
   return {balance:b as StarryBatteryBalance,quantum:q as StarryQuantumBattery};
  }
 }),[env,state,busy,deps,run,session,version]);

 return <StarryIdContext.Provider value={value}>{children}</StarryIdContext.Provider>;
}

export function useStarryId():StarryIdContextValue{
 return useContext(StarryIdContext);
}
