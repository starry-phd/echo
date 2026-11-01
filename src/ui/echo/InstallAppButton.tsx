import {useEffect,useState} from 'react';
import {Modal,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {useLegacyTheme} from './legacyTheme';
import {detectInstallPlatform,manualInstallHelp} from './installGuide';

export type InstallPromptEvent=Event&{
 prompt:()=>Promise<void>;
 userChoice:Promise<{outcome:string}>;
};
/**
 * Original legacy menu entry, scoped to public Web. No service worker or
 * offline caching: 28 curated previews are revocable and media is private.
 */
export function InstallAppButton({earlyPrompt=null,onPromptConsumed=()=>{}}:{
 earlyPrompt?:InstallPromptEvent|null;
 onPromptConsumed?:()=>void;
}={}){
 const theme=useLegacyTheme();
 const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [guideOpen,setGuideOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{
  if(Platform.OS!=='web'||typeof window==='undefined')return;
  const nav=window.navigator as Navigator&{standalone?:boolean};
  const media=window.matchMedia?.('(display-mode: standalone)');
  const checkInstalled=()=>setInstalled(Boolean(media?.matches||nav.standalone));
  const onPrompt=(event:Event)=>{
   event.preventDefault();
   setPrompt(event as InstallPromptEvent);
  };
  const onInstalled=()=>{setInstalled(true);setGuideOpen(false);setPrompt(null);setMessage('繁星回聲已安裝到此裝置。');};
  checkInstalled();
  window.addEventListener('beforeinstallprompt',onPrompt);
  window.addEventListener('appinstalled',onInstalled);
  media?.addEventListener?.('change',checkInstalled);
  return ()=>{
   window.removeEventListener('beforeinstallprompt',onPrompt);
   window.removeEventListener('appinstalled',onInstalled);
   media?.removeEventListener?.('change',checkInstalled);
  };
 },[]);
 // The original Navbar hides the install entry when the PWA is already in standalone mode.
 // Keep this check after all hooks; a late appinstalled event can hide the row safely.
 if(Platform.OS!=='web'||installed)return null;
 const nav=typeof navigator!=='undefined'?navigator:null;
 const pendingPrompt=prompt??earlyPrompt;
 const device=detectInstallPlatform(nav?.userAgent??'',nav?.platform??'',nav?.maxTouchPoints??0);
 const install=async()=>{
  if(installed){setMessage('目前已使用主畫面安裝模式。');return;}
  if(!pendingPrompt){setGuideOpen(true);return;}
  const current=pendingPrompt;
  setPrompt(null);
  onPromptConsumed();
  setBusy(true);
  try{
   // Must run within the direct user gesture, before any awaited operation.
   await current.prompt();
   const result=await current.userChoice;
   if(result.outcome==='accepted'){
    setMessage('已接受安裝，請依照瀏覽器提示完成。');
   }else{
    setMessage('未安裝。你仍可透過瀏覽器選單加入主畫面。');
    setGuideOpen(true);
   }
  }catch{
   setMessage('瀏覽器未能顯示系統安裝視窗，請使用手動加入主畫面。');
   setGuideOpen(true);
  }finally{setBusy(false);}
 };
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={installed?'已安裝繁星回聲':'安裝繁星回聲到桌面'}
   accessibilityState={{disabled:busy}} disabled={busy} onPress={()=>void install()}
   style={styles.menuRow}>
   <Text style={[styles.menuText,{color:theme.ink}]}>⇩　安裝到桌面</Text>
   <Text style={[styles.status,{color:theme.muted}]}>{installed?'已安裝':busy?'處理中':pendingPrompt?'可安裝':'查看步驟'}</Text>
  </Pressable>
  {message.length>0&&<Text accessibilityLiveRegion="polite" style={[styles.feedback,{color:theme.muted}]}>{message}</Text>}
  <Modal visible={guideOpen} transparent animationType="fade" onRequestClose={()=>setGuideOpen(false)}>
   <View style={styles.overlay}>
    <Pressable accessibilityRole="button" accessibilityLabel="關閉安裝說明背景"
     onPress={()=>setGuideOpen(false)} style={StyleSheet.absoluteFill}/>
    <View accessibilityViewIsModal style={[styles.dialog,{backgroundColor:theme.card,borderColor:theme.border}]}>
     <Text style={[styles.title,{color:theme.ink}]}>安裝繁星回聲</Text>
     <Text style={[styles.body,{color:theme.muted}]}>{manualInstallHelp[device]}</Text>
     <Text style={[styles.note,{color:theme.muted}]}>安裝到主畫面不會開放尚未授權的音檔；目前仍需連線才能讀取最新核准內容。</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="關閉安裝說明" onPress={()=>setGuideOpen(false)}
      style={[styles.close,{backgroundColor:theme.palette.primary}]}>
      <Text style={styles.closeText}>我知道了</Text>
     </Pressable>
    </View>
   </View>
  </Modal>
 </>;
}
const styles=StyleSheet.create({
 menuRow:{minHeight:46,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:13,gap:8},
 menuText:{fontSize:14,fontWeight:'800'},status:{fontSize:11,fontWeight:'700'},
 feedback:{fontSize:11,lineHeight:17,paddingHorizontal:12,paddingBottom:8},
 overlay:{flex:1,alignItems:'center',justifyContent:'center',padding:18,backgroundColor:'#0008'},
 dialog:{width:'100%',maxWidth:370,borderWidth:1,borderRadius:20,padding:20,gap:13},
 title:{fontSize:19,fontWeight:'900'},body:{fontSize:14,lineHeight:25},note:{fontSize:12,lineHeight:20},
 close:{minHeight:48,borderRadius:13,alignItems:'center',justifyContent:'center'},
 closeText:{fontSize:15,fontWeight:'900',color:'#fff'}
});
