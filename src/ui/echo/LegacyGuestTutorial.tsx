import {useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Modal,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {GUEST_TUTORIAL_KEY,LEGACY_TUTORIAL_KEYS,isLegacyTutorialOptedOut,shouldShowGuestTutorial} from './legacyGuestTutorialPolicy';

/**
 * The original Echo home uses TutorialSpotlight with an opt-out checkbox.
 * During the restricted migration the tutorial can explain PUBLIC, verified
 * UI affordances only. It must not promise guest audio, member identity,
 * stickers, progress or any other service without an approved contract.
 */
// Remember an ordinary dismissal while the app remains open, just like
// old App.tsx's showHomeTutorial state; opt-out persists across restarts.
let dismissedForThisAppRun=false;

export function isLegacyTutorialOptedOut(
 read:(key:string)=>string|null
):boolean{
 return LEGACY_TUTORIAL_KEYS.some(key=>read(key)==='1');
}

export function LegacyGuestTutorial({active}:{active:boolean}){
 const [loaded,setLoaded]=useState(false);
 const [suppressed,setSuppressed]=useState(true);
 const [closed,setClosed]=useState(false);
 const [neverAgain,setNeverAgain]=useState(false);
 const [error,setError]=useState('');

 useEffect(()=>{
  let mounted=true;
  void (async()=>{
   try{
    const stored=await AsyncStorage.getItem(GUEST_TUTORIAL_KEY);
    const oldChoice=Platform.OS==='web'&&typeof window!=='undefined'&&
      isLegacyTutorialOptedOut(key=>window.localStorage.getItem(key));
    if(mounted)setSuppressed(stored==='1'||Boolean(oldChoice)||dismissedForThisAppRun);
   }catch{
    // A broken or unavailable local store must not force an intrusive
    // repeated modal, nor overwrite a pre-existing opt-out choice.
    if(mounted)setSuppressed(true);
   }finally{
    if(mounted)setLoaded(true);
   }
  })();
  return ()=>{mounted=false;};
 },[]);

 const dismiss=async()=>{
  if(neverAgain){
   try{
    await AsyncStorage.setItem(GUEST_TUTORIAL_KEY,'1');
    // Preserve the legacy Web opt-out, without changing unrelated settings.
    if(Platform.OS==='web'&&typeof window!=='undefined'){
     for(const key of LEGACY_TUTORIAL_KEYS)window.localStorage.setItem(key,'1');
    }
   }catch{
    setError('目前無法儲存「不再提醒」的設定，請取消勾選後關閉，或稍後重試。');
    return;
   }
  }
  dismissedForThisAppRun=true;
  setClosed(true);
 };

 const visible=shouldShowGuestTutorial({
  catalogReady:active,preferencesReady:loaded,visibleCount:active?1:0,
  storedOptOut:suppressed,legacyOptOut:false,dismissedInRun:closed,
 });
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={()=>void dismiss()}>
  <View style={styles.overlay} accessibilityViewIsModal onAccessibilityEscape={()=>void dismiss()}>
   <Pressable accessibilityRole="button" accessibilityLabel="關閉新手教學背景"
    onPress={()=>void dismiss()} style={StyleSheet.absoluteFill}/>
   <View style={styles.panel} accessibilityViewIsModal>
    <Text style={styles.heading}>繁星回聲 · 新手教學</Text>
    <Text style={styles.lead}>這裡先介紹目前真正開放的訪客功能。</Text>
    <View style={styles.line}><Text style={styles.lineTitle}>⌂ 回首頁</Text>
     <Text style={styles.lineText}>點上方「繁星回聲」標誌，可回到公開作品清單。</Text></View>
    <View style={styles.line}><Text style={styles.lineTitle}>▣ 看作品資訊</Text>
     <Text style={styles.lineText}>點卡片查看已核准的公開資料；照片不代表錄音有播放授權。</Text></View>
    <View style={styles.line}><Text style={styles.lineTitle}>♡ 我的收藏</Text>
     <Text style={styles.lineText}>可在這個裝置收藏或隱藏資訊卡；目前不會同步到會員帳號。</Text></View>
    <Text style={styles.warning}>私人錄音、正式會員登入及付費功能尚未開放，教學不會解鎖這些權限。</Text>
    <Pressable accessibilityRole="checkbox" accessibilityLabel="不再顯示新手教學"
     accessibilityState={{checked:neverAgain}} onPress={()=>{setNeverAgain(v=>!v);setError('');}}
     style={styles.checkRow}>
     <Text style={styles.checkMark}>{neverAgain?'☑':'☐'}</Text>
     <Text style={styles.checkText}>打勾不再顯示新手教學</Text>
    </Pressable>
    {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel="關閉新手教學並開始瀏覽"
     onPress={()=>void dismiss()} style={styles.done}>
     <Text style={styles.doneText}>我知道了，開始瀏覽</Text>
    </Pressable>
   </View>
  </View>
 </Modal>;
}

const styles=StyleSheet.create({
 overlay:{flex:1,backgroundColor:'rgba(15,23,42,.78)',alignItems:'center',justifyContent:'center',padding:16},
 panel:{width:'100%',maxWidth:450,backgroundColor:'#fff9fb',borderRadius:22,padding:22,gap:12,
  borderWidth:1,borderColor:'#f5c8d6'},
 heading:{fontSize:21,fontWeight:'900',color:'#8f3556',textAlign:'center'},
 lead:{fontSize:13,color:'#625262',textAlign:'center',lineHeight:20},
 line:{backgroundColor:'#fff',borderRadius:12,padding:10,gap:4},
 lineTitle:{fontSize:14,fontWeight:'900',color:'#a54d6a'},
 lineText:{fontSize:12,color:'#453a45',lineHeight:19},
 warning:{fontSize:12,color:'#84475b',lineHeight:19},
 checkRow:{flexDirection:'row',alignItems:'center',minHeight:44,gap:8},
 checkMark:{fontSize:22,color:'#9e4667'},
 checkText:{fontSize:13,color:'#453a45',fontWeight:'700'},
 error:{fontSize:12,color:'#b91c1c',lineHeight:19},
 done:{minHeight:48,borderRadius:13,backgroundColor:'#9e4667',alignItems:'center',justifyContent:'center'},
 doneText:{fontSize:15,fontWeight:'900',color:'#fff'},
});
