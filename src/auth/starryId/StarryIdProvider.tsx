import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {AppState,Platform,Pressable,Text,View} from 'react-native';
import Constants from 'expo-constants';
import {resolveStarryIdEnvironment} from './env';
import type {StarryIdEnvironment} from './env';
import {fetchMe} from './memberApi';
import {webRelayReturnUrl,webRelaySupported,WEB_RELAY_RETURN_PATH} from './webRelay';
import {StarryClient,StarryError} from './vendor/starry-client';
import type {Provider} from './vendor/starry-client';
import {createEchoSdkStorage} from './sdkStorage';
import {createStarryDeviceSharedStorage} from './deviceSharedStorage';
import type {ProviderSignIn} from './memberApi';
import {stateFromAvailability,stateFromError,stateFromMember} from './memberFlow';
import {evaluateAppAvailability,nextStarryNoticeBoundary,parseStarryAppConfig,visibleStarryNotices} from './appConfig';
import type {StarryAppConfig} from './appConfig';
import {passkeySupported,getPlatformPasskey,createPlatformPasskey} from './passkeyPlatform';
import {validateLoginOptions} from './passkeyContract';
import type {PasskeyEntry} from './passkeyContract';
import type {MemberViewState} from './memberFlow';
import type {StarryIdSession} from './session';
import {nativeSdkOpenAuthSession,nativeSdkSha256Hex,nativeSdkRandomState,NATIVE_RELAY_RETURN_URL} from './nativeSignIn';
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
 deviceSsoAvailable:boolean;
 state:MemberViewState;
 busy:boolean;
 ensureLoaded():void;
 refreshMember():Promise<void>;
 getFreshMemberNo():Promise<string|null>;
 getNonce():Promise<string>;
 signIn(input:ProviderSignIn):Promise<void>;
 signInRelay(provider:Provider):Promise<void>;
 beginWebRelay(provider:Provider):Promise<void>;
 completeWebRelay(href:string):Promise<boolean>;
 completeWebSso(href:string):Promise<boolean|null>;
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
 enabled:false,env:null,passkeyAvailable:false,deviceSsoAvailable:false,state:{kind:'disabled'},busy:false,
 ensureLoaded(){},refreshMember:async()=>{},getFreshMemberNo:async()=>null,
 getNonce:()=>Promise.reject(new Error('Starry ID disabled')),
 signIn:async()=>{},signInRelay:async()=>{},beginWebRelay:async()=>{},completeWebRelay:async()=>false,completeWebSso:async()=>null,
 signInPasskey:async()=>{},listPasskeys:async()=>[],addPasskey:async()=>{},removePasskey:async()=>{},
 acceptConsent:async()=>{},signOut:async()=>{},requestDeletion:async()=>{},
 getBatteryBalance:async()=>{throw new Error('Starry ID disabled');},
 getTaskPrices:async()=>{throw new Error('Starry ID disabled');},
 saveTaskPrice:async()=>{throw new Error('Starry ID disabled');}
};
const StarryIdContext=createContext<StarryIdContextValue>(disabled);

const sdkFetch:typeof fetch=(input,init)=>fetch(input,{...init,credentials:'omit'});

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
 const sdkRef=useRef<StarryClient|null>(null);
 const webNavigationRef=useRef(false);
 // Shared token storage only where the OS provides a cross-App security boundary.
 // Android must not fake device-wide SSO with an app-private SecureStore.
 const sharedStorageRef=useRef<ReturnType<typeof createStarryDeviceSharedStorage>|undefined>(undefined);
 if(sharedStorageRef.current===undefined)sharedStorageRef.current=createStarryDeviceSharedStorage();
 if(!sdkRef.current){
  sdkRef.current=new StarryClient({
   baseUrl:env.baseUrl,appId:'echo',storage:createEchoSdkStorage(),fetch:sdkFetch,
   ...(Platform.OS==='web'&&typeof window!=='undefined'?{
    navigate:(target:string)=>{window.location.assign(target);webNavigationRef.current=true;}
   }:{}),
   ...(sharedStorageRef.current?{sharedStorage:sharedStorageRef.current}:{}),
   ...(Platform.OS==='web'?{}:{
    sha256Hex:nativeSdkSha256Hex,randomState:nativeSdkRandomState,
    openAuthSession:nativeSdkOpenAuthSession
   }),
   passkey:{
    get:raw=>getPlatformPasskey(validateLoginOptions(raw)),
    create:raw=>createPlatformPasskey(raw)
   }
  });
 }
 const sdk=sdkRef.current;
 const webSsoReturnUrl=useCallback(()=>{
  if(Platform.OS!=='web'||typeof window==='undefined'||!webRelaySupported(window.location.origin))return null;
  return webRelayReturnUrl(window.location.origin);
 },[]);
 const shareWebSession=useCallback(async():Promise<boolean>=>{
  const returnUrl=webSsoReturnUrl();
  if(!returnUrl)return false;
  webNavigationRef.current=false;
  await sdk.shareWebSignIn({returnUrl});
  return webNavigationRef.current;
 },[sdk,webSsoReturnUrl]);
 // A short adapter preserves existing Echo screens without a second token owner.
 const session=useMemo<StarryIdSession>(()=>({
  adoptTokens:async()=>{throw new Error('Use Starry Client for sign-in');},
  request:(path,init={})=>sdk.request(init.method??'GET',path,init.body),
  refresh:async()=>Boolean(await sdk.refresh()),
  signOutLocally:async()=>{await sdk.signOut();},
  hasAccessToken:()=>sdk.signedIn,
  getAccessToken:()=>sdk.getAccessToken()
 }),[sdk]);
 const version=Constants.expoConfig?.version??'';
 const fetchSdkConfig=useCallback(async():Promise<StarryAppConfig|null>=>{
  try{return parseStarryAppConfig(await sdk.getConfig());}catch{return null;}
 },[sdk]);
 const availability=useCallback(async()=>{
  return stateFromAvailability(evaluateAppAvailability(await fetchSdkConfig(),version));
 },[fetchSdkConfig,version]);
 const loadMember=useCallback(async():Promise<MemberViewState>=>{
  const gate=await availability();
  if(gate)return gate;
  try{
   if(!(await sdk.restore()))return {kind:'signed-out'};
   return stateFromMember(await fetchMe(session));
  }catch(error){return stateFromError(error);}
 },[availability,session,sdk]);

 const run=useCallback(async(task:()=>Promise<MemberViewState|void>)=>{
  setBusy(true);
  try{const next=await task();if(next)setState(next);}
  catch(error){
   if(error instanceof StarryError){
    if(error.code==='ACCOUNT_SUSPENDED')setState({kind:'suspended'});
    else if(error.status===401)setState({kind:'signed-out',notice:'登入驗證未完成，請再試一次。'});
    else if(error.status===429)setState({kind:'signed-out',notice:'操作太頻繁，請稍後再試。'});
    else setState({kind:'unavailable'});
   }else setState(stateFromError(error));
  }
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
    const config=await fetchSdkConfig();
    if(!active)return;
    setNoticeConfig(config);
    setNoticeNow(Date.now());
    const gate=stateFromAvailability(evaluateAppAvailability(config,version));
    if(gate){wasBlocked.current=true;setState(gate);}
    else{
     if(Platform.OS==='web'&&typeof window!=='undefined'){
      // OAuth/SSO callback fragments must be consumed before any new redirect.
      const isCallback=window.location.pathname===WEB_RELAY_RETURN_PATH;
      const returnUrl=webSsoReturnUrl();
      if(!isCallback&&returnUrl){
       try{if(await sdk.syncWebSignIn({returnUrl}))return;}
       catch{/* Offline or unsupported browser: keep the current local state. */}
      }
     }else{
      // iOS uses the common Keychain group; Android safely stays app-local.
      try{await sdk.syncDeviceSignIn();}catch{/* Offline does not log members out. */}
     }
     if(wasBlocked.current)wasBlocked.current=false;
     if(loaded.current)void run(loadMember);
    }
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
 },[version,fetchSdkConfig,loadMember,run,sdk,webSsoReturnUrl]);

 // Notice transitions remain correct while the app stays open (without polling Starry ID).
 useEffect(()=>{
  const next=nextStarryNoticeBoundary(noticeConfig,noticeNow);
  if(next===null)return;
  const delay=Math.min(Math.max(1,next-Date.now()),2_147_483_647);
  const timer=setTimeout(()=>setNoticeNow(Date.now()),delay);
  return ()=>clearTimeout(timer);
 },[noticeConfig,noticeNow]);

 const value=useMemo<StarryIdContextValue>(()=>({
  enabled:true,env,passkeyAvailable:passkeySupported(),deviceSsoAvailable:Boolean(sharedStorageRef.current),state,busy,
  ensureLoaded(){
   if(loaded.current)return;
   loaded.current=true;
   void run(loadMember);
  },
  refreshMember:async()=>{
   if(!loaded.current)return;
   await run(loadMember);
  },
  getFreshMemberNo:async()=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   // Never share a cached member number: the member can change it in Starry ID.
   const latest=await fetchMe(session);
   if(latest.userId!==state.member.userId||latest.status!=='active'||latest.consent.required){
    setState(stateFromMember(latest));
    throw new Error('會員資料已變更，請重新確認後再分享。');
   }
   setState(stateFromMember(latest));
   return latest.memberNo;
  },
  getNonce:async()=>{
   const gate=await availability();
   if(gate)throw new Error('繁星會員目前無法登入或需要更新');
   return sdk.nonce();
  },
  signIn:input=>run(async()=>{
   const gate=await availability();
   if(gate)return gate;
   const result=await sdk.signInWithIdToken(input.provider,{
    idToken:input.idToken,nonce:input.nonce,
    ...(input.authorizationCode?{authorizationCode:input.authorizationCode}:{}),
    ...(input.redirectUri?{redirectUri:input.redirectUri}:{})
   });
   if(result.user.status==='pending_deletion')return {kind:'pending-deletion',purgeAt:result.user.deletion_purge_at};
   if(result.user.status==='suspended')return {kind:'suspended'};
   const next=stateFromMember(await fetchMe(session));
   await shareWebSession();
   return next;
  }),
  signInRelay:async provider=>{
   if(Platform.OS==='web')throw new Error('Native relay unavailable on web');
   const gate=await availability();
   if(gate){setState(gate);throw new Error('繁星會員目前無法登入或需要更新');}
   setBusy(true);
   try{
    const result=await sdk.signInWithRelay(provider,{returnUrl:NATIVE_RELAY_RETURN_URL});
    if(result.user.status==='pending_deletion')setState({kind:'pending-deletion',purgeAt:result.user.deletion_purge_at});
    else if(result.user.status==='suspended')setState({kind:'suspended'});
    else setState(stateFromMember(await fetchMe(session)));
   }finally{setBusy(false);}
  },
  beginWebRelay:async provider=>{
   if(Platform.OS!=='web'||typeof window==='undefined')throw new Error('Web relay unavailable');
   const gate=await availability();
   if(gate){setState(gate);throw new Error('繁星會員目前無法登入或需要更新');}
   await sdk.beginRelayRedirect(provider,{returnUrl:webRelayReturnUrl(window.location.origin)});
  },
  completeWebRelay:async href=>{
   const result=await sdk.completeRelayRedirect(href);
   if(!result)throw new Error('Missing Starry ID relay response');
   if(result.user.status==='pending_deletion')setState({kind:'pending-deletion',purgeAt:result.user.deletion_purge_at});
   else if(result.user.status==='suspended')setState({kind:'suspended'});
   else{
    setState(stateFromMember(await fetchMe(session)));
    // The IdP adoption is a top-level redirect: never race it with router.replace().
    return shareWebSession();
   }
   return false;
  },
  completeWebSso:async href=>{
   if(Platform.OS!=='web'||!webSsoReturnUrl())throw new Error('Unregistered SSO return origin');
   const result=await sdk.completeWebSsoCheck(href);
   if(result===true)setState(stateFromMember(await fetchMe(session)));
   else if(result===false)setState({kind:'signed-out'});
   return result;
  },
  signInPasskey:async()=>{
   if(busy)return;
   setBusy(true);
   try{
    const gate=await availability();
    if(gate){setState(gate);throw new Error('繁星會員目前無法登入或需要更新');}
    const result=await sdk.signInWithPasskey();
    if(result.user.status==='pending_deletion')setState({kind:'pending-deletion',purgeAt:result.user.deletion_purge_at});
    else if(result.user.status==='suspended')setState({kind:'suspended'});
    else{
     setState(stateFromMember(await fetchMe(session)));
     await shareWebSession();
    }
   }finally{setBusy(false);}
  },
  listPasskeys:async()=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   return sdk.listPasskeys();
  },
  addPasskey:async name=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   await sdk.registerPasskey(name?.trim().slice(0,80)||undefined);
  },
  removePasskey:async id=>{
   if(state.kind!=='signed-in')throw new Error('請先登入並同意條款');
   await sdk.removePasskey(id);
  },
  acceptConsent:()=>run(async()=>{
   if(state.kind!=='consent-required')return;
   await sdk.acceptConsent();
   return stateFromMember(await fetchMe(session));
  }),
  signOut:(everywhere=false)=>run(async()=>{
   if(everywhere)await sdk.signOutEverywhere();
   const returnUrl=webSsoReturnUrl();
   if(returnUrl)await sdk.signOutWebEverywhere({returnUrl});
   else if(!everywhere)await sdk.signOut();
   return {kind:'signed-out'};
  }),
  requestDeletion:()=>run(async()=>{
   await sdk.deleteAccount();
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
    throw new Error('🔋 普通電池餘額資料格式不正確');
   if(!q||q.app_id!=='echo'||!['balance','reserved','available'].every(k=>Number.isSafeInteger(q[k as keyof StarryQuantumBattery])))
    throw new Error('⚛️ 量子電池資料格式不正確');
   return {balance:b as StarryBatteryBalance,quantum:q as StarryQuantumBattery};
  }
 }),[env,state,busy,run,loadMember,availability,session,sdk,version,shareWebSession,webSsoReturnUrl]);

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
