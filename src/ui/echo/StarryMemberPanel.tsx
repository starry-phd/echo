import {useEffect,useState} from 'react';
import {ActivityIndicator,Image,Linking,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {useStarryId} from '../../auth/starryId/StarryIdProvider';
import {formatPurgeDate} from '../../auth/starryId/memberFlow';
import {appleWebSignInSupported,cancelGooglePrompt,renderGoogleButton,signInWithAppleWeb} from '../../auth/starryId/webSignIn';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';

const GOOGLE_BUTTON_ID='starry-google-sign-in-button';
const NONCE_REFRESH_MS=9*60_000; // Starry nonces expire after 10 minutes

/**
 * Starry ID member panel (integration guide §2–4). Rendered only when Starry ID is
 * enabled; loads third-party login scripts only while the signed-out view is visible.
 */
export function StarryMemberPanel(){
 const starry=useStarryId();
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const [error,setError]=useState('');
 const [confirmDelete,setConfirmDelete]=useState(false);
 const {state,env}=starry;

 useEffect(()=>{starry.ensureLoaded();},[starry]);

 const signedOut=state.kind==='signed-out';
 useEffect(()=>{
  if(!signedOut||Platform.OS!=='web'||typeof document==='undefined')return;
  let cancelled=false;
  const mount=async()=>{
   try{
    const nonce=await starry.getNonce();
    const container=document.getElementById(GOOGLE_BUTTON_ID);
    if(cancelled||!container)return;
    await renderGoogleButton(container,nonce,idToken=>{void starry.signIn({provider:'google',idToken,nonce});});
    setError('');
   }catch{if(!cancelled)setError('Google 登入暫時無法使用，請稍後再試。');}
  };
  void mount();
  const timer=setInterval(()=>{void mount();},NONCE_REFRESH_MS);
  return()=>{cancelled=true;clearInterval(timer);cancelGooglePrompt();};
 },[signedOut]);

 const apple=async()=>{
  try{
   setError('');
   const nonce=await starry.getNonce();
   const result=await signInWithAppleWeb(nonce);
   await starry.signIn({provider:'apple',idToken:result.idToken,nonce,authorizationCode:result.code,redirectUri:result.redirectUri});
  }catch{setError('Apple 登入未完成，請再試一次。');}
 };

 const text=(value:string,muted=false)=><Text style={[styles.text,{color:muted?t.muted:t.ink,fontSize:fontSize(14)}]}>{value}</Text>;
 const button=(label:string,onPress:()=>void,kind:'primary'|'plain'|'danger'='plain')=><Pressable
  key={label} accessibilityRole="button" accessibilityLabel={label} disabled={starry.busy} onPress={onPress}
  style={[styles.button,kind==='primary'&&{backgroundColor:t.palette.primary,borderColor:t.palette.primary},
   kind!=='primary'&&{borderColor:kind==='danger'?'#b8324e':t.border},starry.busy&&styles.disabled]}>
  <Text style={[styles.buttonLabel,{fontSize:fontSize(14),color:kind==='primary'?'#fff':kind==='danger'?'#b8324e':t.ink}]}>{label}</Text>
 </Pressable>;
 const link=(label:string,path:string)=>env&&<Text key={path} accessibilityRole="link" onPress={()=>{void Linking.openURL(env.baseUrl+path);}}
  style={[styles.link,{color:t.palette.primary,fontSize:fontSize(14)}]}>{label}</Text>;

 let body;
 switch(state.kind){
  case 'disabled':return null;
  case 'checking':body=<View style={styles.row}><ActivityIndicator color={t.palette.primary}/>{text('正在確認繁星會員狀態…',true)}</View>;break;
  case 'signed-out':
   body=<>
    {state.notice&&text(state.notice)}
    {text('使用 Google 或 Apple 帳號登入繁星會員（Starry ID）。同一個帳號可用於繁星生態系的所有 App。',true)}
    {Platform.OS==='web'?<>
     <View nativeID={GOOGLE_BUTTON_ID} style={styles.googleSlot}/>
     {typeof window!=='undefined'&&appleWebSignInSupported(window.location.origin)
      &&<Pressable accessibilityRole="button" accessibilityLabel="使用 Apple 帳號登入" disabled={starry.busy}
       onPress={()=>{void apple();}} style={[styles.apple,starry.busy&&styles.disabled]}>
       <Text style={[styles.appleLabel,{fontSize:fontSize(15)}]}>使用 Apple 帳號登入</Text>
      </Pressable>}
    </>:text('手機 App 的會員登入即將推出；目前可先使用網頁版登入。',true)}
    <View style={styles.row}>{link('服務條款','/terms')}{link('隱私權政策','/privacy')}</View>
   </>;break;
  case 'consent-required':
   body=<>
    {text('繁星會員的服務條款或隱私權政策已更新，請閱讀後同意才能繼續使用會員功能。')}
    <View style={styles.row}>{link('服務條款','/terms')}{link('隱私權政策','/privacy')}</View>
    <View style={styles.row}>{button('同意並繼續',()=>{void starry.acceptConsent();},'primary')}{button('登出',()=>{void starry.signOut();})}</View>
   </>;break;
  case 'signed-in':{
   const member=state.member;
   body=<>
    <View style={styles.row}>
     {member.avatarPath&&env
      ?<Image source={{uri:env.baseUrl+member.avatarPath}} accessibilityLabel={'頭像：'+member.displayName} style={styles.avatar}/>
      :<View style={[styles.avatar,styles.initial,{backgroundColor:t.lightPill}]}>
        <Text style={{color:t.palette.primary,fontSize:fontSize(22),fontWeight:'900'}}>{Array.from(member.displayName)[0]}</Text></View>}
     <Text style={[styles.name,{color:t.ink,fontSize:fontSize(18)}]}>{member.displayName}</Text>
    </View>
    {text('已登入繁星會員。個人資料、頭像與登入方式請到繁星帳號中心管理。',true)}
    <View style={styles.row}>{link('前往繁星帳號中心','/account')}</View>
    <View style={styles.row}>{button('登出',()=>{void starry.signOut();})}{button('登出所有裝置',()=>{void starry.signOut(true);})}</View>
    {!confirmDelete?button('刪除帳號',()=>setConfirmDelete(true),'danger'):<View style={[styles.confirm,{borderColor:'#b8324e'}]}>
     {text('刪除後有 7 天可以撤回（期間重新登入即可撤回），期滿後繁星會員資料會永久刪除，所有繁星 App 都無法再使用這個帳號。刪除帳號不會自動取消已在 App Store／Google Play 訂閱的項目，請另外到商店取消。')}
     <View style={styles.row}>{button('確認刪除帳號',()=>{setConfirmDelete(false);void starry.requestDeletion();},'danger')}{button('取消',()=>setConfirmDelete(false))}</View>
    </View>}
   </>;break;
  }
  case 'pending-deletion':
   body=<>
    {text('這個帳號將於 '+formatPurgeDate(state.purgeAt)+' 刪除。撤回後即可繼續使用。')}
    <View style={styles.row}>{button('撤回刪除',()=>{void starry.cancelDeletion();},'primary')}{button('登出',()=>{void starry.signOut();})}</View>
   </>;break;
  case 'suspended':body=text('這個帳號已被停權，已為你登出。如有疑問請聯絡繁星客服。');break;
  case 'maintenance':body=text('繁星會員服務維護中，會員功能暫停；其他頁面可正常瀏覽。',true);break;
  case 'update-required':body=text('請更新 App 至 '+state.minVersion+' 以上版本後再使用會員功能。');break;
  default:body=text('暫時無法連線到繁星會員服務，會員功能已暫停；其他頁面可正常瀏覽。',true);
 }
 return <View accessibilityLabel="繁星會員" style={[styles.panel,{borderColor:t.border}]}>
  <Text style={[styles.title,{color:t.palette.primary,fontSize:fontSize(16)}]}>繁星會員（Starry ID）{env?.name==='staging'?'｜測試環境':''}</Text>
  {body}
  {error?<Text style={[styles.text,{color:'#b8324e',fontSize:fontSize(13)}]}>{error}</Text>:null}
 </View>;
}

const styles=StyleSheet.create({
 panel:{alignSelf:'stretch',borderWidth:1,borderRadius:16,padding:14,gap:10,marginBottom:12},
 title:{fontWeight:'900'},
 text:{lineHeight:22},
 row:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:10},
 button:{minHeight:44,paddingHorizontal:16,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},
 buttonLabel:{fontWeight:'800'},
 disabled:{opacity:.5},
 link:{fontWeight:'800',textDecorationLine:'underline',paddingVertical:8},
 googleSlot:{minHeight:44,alignSelf:'stretch'},
 apple:{minHeight:44,borderRadius:22,backgroundColor:'#000',alignItems:'center',justifyContent:'center',paddingHorizontal:18,alignSelf:'flex-start'},
 appleLabel:{color:'#fff',fontWeight:'800'},
 avatar:{width:56,height:56,borderRadius:28},
 initial:{alignItems:'center',justifyContent:'center'},
 name:{fontWeight:'900'},
 confirm:{borderWidth:1,borderRadius:12,padding:12,gap:10}
});
