import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {AppState,Platform,Pressable,Text,View} from 'react-native';
import Constants from 'expo-constants';
import {resolveStarryIdEnvironment} from './env';
import type {StarryIdEnvironment} from './env';
import {acceptCurrentConsent,fetchAppConfig,fetchMe,requestAccountDeletion,requestNonce,signOut,
 getPasskeySignInOptions,signInWithPasskey,getPasskeyCreationOptions,registerPasskey,getMemberPasskeys,deleteMemberPasskey} from './memberApi';
import type {ProviderSignIn,PublicFetch} from './memberApi';
import {stateAfterSignIn,stateFromAvailability,stateFromError,stateFromMember} from './memberFlow';
import {evaluateAppAvailability,nextStarryNoticeBoundary,visibleStarryNotices} from './appConfig';
import type {StarryAppConfig} from './appConfig';
import {passkeySupported,getPlatformPasskey,createPlatformPasskey} from './passkeyPlatform';
import type {PasskeyEntry} from './passkeyContract';
import type {MemberViewState} from './memberFlow';
import {completeSignIn,loadMemberState} from './memberSession';
import {createStarryIdSession} from './session';
import type {StarryIdSession} from './session';
import {createMemoryRefreshTokenStore,createSessionStorageRefreshTokenStore} from './storage';
import {nativeRefreshTokenStore} from './nativeSignIn';
import type {RefreshTokenStore} from './storage';
import type {components as StarryIdComponents} from '../../../packages/starry-id-sdk/src/generated';
import {ownerTaskPriceRequest} from './echoBackendSettings';
import type {EchoTaskPrice} from './echoBackendSettings';

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
 passkeyAvailable:boolean;
 state:MemberViewState;
 busy:boolean;
 ensureLoaded():void;
 getNonce():Promise<string>;
 signIn(input:ProviderSignIn):Promise<void>;
 signInPasskey():Promise<void>;
 listPasskeys():Promise<PasskeyEntry[]>;
 addPasskey(name?:string):Promise<void>;
 removePasskey(id:string):Promise<void>;
 acceptConsent():Promise<void>;
 signOut(everywhere?:boolean):Promise<void>;
 requestDeletion():Promise<void>;
 getBatteryBalance():Promise<StarryBatteryInfo>;
 getTaskPrices():Promise<EchoTaskPrice[]>;
 saveTaskPrice(price:EchoTaskPrice):Promise<EchoTaskPrice>;
};

const disabled:StarryIdContextValue={
 enabled:false,env:null,passkeyAvailable:false,state:{kind:'disabled'},busy:false,
 ensureLoaded(){},
 getNonce:()=>Promise.reject(new Error('Starry ID disabled')),
 signIn:async()=>{},signInPasskey:async()=>{},listPasskeys:async()=>[],addPasskey:async()=>{},removePasskey:async()=>{},
 acceptConsent:async()=>{},signOut:async()=>{},requestDeletion:async()=>{},
 getBatteryBalance:async()=>{throw new Error('Starry ID disabled');},
 getTaskPrices:async()=>{throw new Error('Starry ID disabled');},
 saveTaskPrice:async()=>{throw new Error('Starry ID disabled');}
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
 const [noticeConfig,setNoticeConfig]=useState<StarryAppConfig|null>(null);
 const [noticeNow,setNoticeNow]=useState(()=>Date.now());
 const [dismissed,setDismissed]=useState<readonly string[]>([]);
 const notices=visibleStarryNotices(noticeConfig,noticeNow);
 const wasBlocked=useRef(false);
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
 const deps=useMemo(()=>({env,fetch:browserFetch,session,appVersion:Constants.expoConfig?.version??''}),[env,session]);

 const run=useCallback(async(task:()=>Promise<MemberViewState|void>)=>{
  setBusy(true);
  try{const next=await task();if(next)setState(next);}
  catch(error){setState(stateFromError(error));}
  finally{setBusy(false);}
 },[]);

 // Check the central public gate at launch and whenever the App returns to foreground.
 // Coalesce rapid window focus/visibility events; never poll a paused App repeatedly.
 useEffect(()=>{
  let active=true,inflight=false,lastCheck=0;
  const refresh=async()=>{
   if(!active||inflight||Date.now()-lastCheck<4000)return;
   inflight=true;lastCheck=Date.now();
   try{
    const config=await fetchAppConfig(env,browserFetch);
    if(!active)return;
    setNoticeConfig(config);
    setNoticeNow(Date.now());
    const gate=stateFromAvailability(evaluateAppAvailability(config,version));
    if(gate){wasBlocked.current=true;setState(gate);}
    else if(wasBlocked.current){wasBlocked.current=false;void run(()=>loadMemberState(deps));}
   }finally{inflight=false;}
  };
  void refresh();
  const subscription=AppState.addEventListener('change',next=>{
   if(next==='active')void refresh();
  });
  const onFocus=()=>{void refresh();};
  const onVisible=()=>{if(typeof document!=='undefined'&&document.visibilityState==='visible')void refresh();};
  if(Platform.OS==='web'&&typeof window!=='undefined'){
   window.addEventListener('focus',onFocus);
   document.addEventListener('visibilitychange',onVisible);
  }
  return()=>{
   active=false;subscription.remove();
   if(Platform.OS==='web'&&typeof window!=='undefined'){
    window.removeEventListener('focus',onFocus);
    document.removeEventListener('visibilitychange',onVisible);
   }
  };
 },[env,version,deps,run]);

 // Notice transitions remain correct while the app stays open (without polling Starry ID).
 useEffect(()=>{
  const next=nextStarryNoticeBoundary(noticeConfig,noticeNow);
  if(next===null)return;
  const delay=Math.min(Math.max(1,next-Date.now()),2_147_483_647);
  const timer=setTimeout(()=>setNoticeNow(Date.now()),delay);
  return ()=>clearTimeout(timer);
 },[noticeConfig,noticeNow]);

 const value=useMemo<StarryIdContextValue>(()=>({
  enabled:true,env,passkeyAvailable:passkeySupported(),state,busy,
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
  signInPasskey:async()=>{
   if(busy)return;
   setBusy(true);
   try{
    const gate=stateFromAvailability(evaluateAppAvailability(await fetchAppConfig(env,browserFetch),version));
    if(gate){setState(gate);throw new Error('繁星會員目前無法登入或需要更新');}
    const options=await getPasskeySignInOptions(env,browserFetch);
    const credential=await getPlatformPasskey(options);
    const result=await signInWithPasskey(env,browserFetch,credential);
    await session.adoptTokens(result.tokens);
    const early=stateAfterSignIn(result);
    setState(early??stateFromMember(await fetchMe(session)));
   }finally{setBusy(false);}
  },
  listPasskeys:async()=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   return getMemberPasskeys(session);
  },
  addPasskey:async name=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   const options=await getPasskeyCreationOptions(session);
   const attestation=await createPlatformPasskey(options);
   await registerPasskey(session,attestation,name);
  },
  removePasskey:async id=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   await deleteMemberPasskey(session,id);
  },
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
  getTaskPrices:async()=>{
   if(state.kind!=='signed-in'||state.member.staffRole!=='owner')throw new Error('只有超級管理員可以查看設定');
   return ownerTaskPriceRequest(session,process.env.EXPO_PUBLIC_ECHO_API_BASE_URL||'','GET');
  },
  saveTaskPrice:async price=>{
   if(state.kind!=='signed-in'||state.member.staffRole!=='owner')throw new Error('只有超級管理員可以修改設定');
   const list=await ownerTaskPriceRequest(session,process.env.EXPO_PUBLIC_ECHO_API_BASE_URL||'','PATCH',price);
   if(list.length!==1)throw new Error('Echo task update was not acknowledged');
   return list[0];
  },
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

 return <StarryIdContext.Provider value={value}>
  <View style={{flex:1}}>
   {notices.filter(n=>!dismissed.includes(n.message+'|'+n.starts_at)).map(n=>
    <View key={n.message+'|'+n.starts_at} accessibilityRole="alert"
     style={{paddingVertical:10,paddingHorizontal:14,backgroundColor:'#fff3c6',flexDirection:'row',alignItems:'center'}}>
     <Text style={{color:'#503d00',flex:1}}>{n.message}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="關閉公告"
      onPress={()=>setDismissed(old=>[...old,n.message+'|'+n.starts_at])}
      style={{padding:8}}><Text style={{color:'#503d00'}}>關閉</Text></Pressable>
    </View>)}
   {children}
  </View>
 </StarryIdContext.Provider>;
}

export function useStarryId():StarryIdContextValue{
 return useContext(StarryIdContext);
}
