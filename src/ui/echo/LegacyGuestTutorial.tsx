import {useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Modal,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {GUEST_TUTORIAL_KEY,LEGACY_TUTORIAL_KEYS,isLegacyTutorialOptedOut,shouldShowGuestTutorial} from './legacyGuestTutorialPolicy';
import {normalizeTutorialTarget,tutorialCalloutPlacement,tutorialSpotlightScrim} from './legacyTutorialSpotlightGeometry';
import type {TutorialRect,TutorialViewport} from './legacyTutorialSpotlightGeometry';

/**
 * The original Echo home uses TutorialSpotlight with an opt-out checkbox.
 * During the restricted migration the tutorial can explain PUBLIC, verified
 * UI affordances only. It must not promise guest audio, member identity,
 * stickers, progress or any other service without an approved contract.
 */
// Remember an ordinary dismissal while the app remains open, just like
// old App.tsx's showHomeTutorial state; opt-out persists across restarts.
let dismissedForThisAppRun=false;

export function LegacyGuestTutorial({active}:{active:boolean}){
 const [loaded,setLoaded]=useState(false);
 const [suppressed,setSuppressed]=useState(true);
 const [closed,setClosed]=useState(false);
 const [neverAgain,setNeverAgain]=useState(false);
 const [error,setError]=useState('');
 const [step,setStep]=useState<0|1>(0);
 const [anchor,setAnchor]=useState<{rect:TutorialRect;viewport:TutorialViewport}|null>(null);
 const [geometryLoaded,setGeometryLoaded]=useState(false);

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
 // This is the exact Web homepage geometry, not a simulated card layout.
 // Native devices retain the accessible modal until real-device positioning
 // and VoiceOver/TalkBack acceptance can be performed.
 useEffect(()=>{
  if(!visible||Platform.OS!=='web'||typeof document==='undefined')return;
  let frame=0;
  const measure=()=>{
   window.cancelAnimationFrame(frame);
   frame=window.requestAnimationFrame(()=>{
    const id=step===0?'echo-tutorial-home-logo':'echo-tutorial-first-public-photo';
    const element=document.getElementById(id);
    const viewport={width:window.innerWidth,height:window.innerHeight};
    const bounds=element?.getBoundingClientRect();
    const style=element?window.getComputedStyle(element):null;
    const rect=bounds&&style?.display!=='none'&&style?.visibility!=='hidden'
     ?normalizeTutorialTarget(bounds,viewport):null;
    setAnchor(rect?{rect,viewport}:null);
    setGeometryLoaded(true);
   });
  };
  measure();
  const delayed=window.setTimeout(measure,180);
  window.addEventListener('resize',measure);
  window.addEventListener('orientationchange',measure);
  window.addEventListener('scroll',measure,true);
  return ()=>{
   window.clearTimeout(delayed);
   window.cancelAnimationFrame(frame);
   window.removeEventListener('resize',measure);
   window.removeEventListener('orientationchange',measure);
   window.removeEventListener('scroll',measure,true);
  };
 },[visible,step]);

 const spotlight=Platform.OS==='web'&&anchor;
 const callout=spotlight?tutorialCalloutPlacement(spotlight.rect,spotlight.viewport):null;
 const next=()=>{
  if(step===0){
   setStep(1);
   if(Platform.OS==='web'&&typeof document!=='undefined'){
    document.getElementById('echo-tutorial-first-public-photo')?.scrollIntoView({block:'center'});
   }
  }else void dismiss();
 };
 return <Modal visible={visible&&(Platform.OS!=='web'||geometryLoaded)}
  transparent animationType="fade" onRequestClose={()=>void dismiss()}>
  <View style={[styles.overlay,spotlight&&styles.spotlightOverlay]}
   accessibilityViewIsModal onAccessibilityEscape={()=>void dismiss()}>
   {spotlight&&callout?<>
    <Pressable accessibilityRole="button" accessibilityLabel="關閉新手教學背景"
     onPress={()=>void dismiss()} style={StyleSheet.absoluteFill}/>
    {tutorialSpotlightScrim(spotlight.rect,spotlight.viewport).map((mask,index)=>
     <View key={index} pointerEvents="none"
      style={[styles.spotlightScrim,{left:mask.left,top:mask.top,width:mask.width,height:mask.height}]}/>
    )}
    <View pointerEvents="none" style={[styles.spotlightOutline,{
     left:spotlight.rect.left,top:spotlight.rect.top,
     width:spotlight.rect.right-spotlight.rect.left,
     height:spotlight.rect.bottom-spotlight.rect.top
    }]}/>
    <View style={[styles.spotlightCallout,{left:callout.left,top:callout.top,width:callout.width,
     maxHeight:callout.height}]}>
     <Text style={styles.spotlightTitle}>{step===0?'① 回首頁':'② 查看已核准作品'}</Text>
     <Text style={styles.spotlightDescription}>{step===0
      ?'點選「繁星回聲」標誌可返回公開作品清單。'
      :'點封面會告知播放尚未開放；點作品標題可查閱已核准資訊。本裝置可收藏，不等於會員同步。'}</Text>
     <Text style={styles.spotlightWarning}>私人錄音、正式會員登入及付費功能尚未開放。</Text>
     <Pressable accessibilityRole="checkbox" accessibilityLabel="不再顯示新手教學"
      accessibilityState={{checked:neverAgain}}
      onPress={()=>{setNeverAgain(value=>!value);setError('');}}
      style={styles.spotlightCheckbox}>
      <Text style={styles.spotlightCheckboxText}>{neverAgain?'☑':'☐'} 打勾不再顯示新手教學</Text>
     </Pressable>
     {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
     <Pressable accessibilityRole="button" accessibilityLabel={step===0?'下一步：查看作品資訊':'完成新手教學'}
      onPress={next} style={styles.spotlightNext}>
      <Text style={styles.spotlightNextText}>{step===0?'下一步':'知道了'}</Text>
     </Pressable>
    </View>
   </>:<>
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
   </>}
  </View>
 </Modal>;
}

const styles=StyleSheet.create({
 spotlightOverlay:{backgroundColor:'transparent',padding:0,alignItems:'stretch',justifyContent:'flex-start'},
 spotlightScrim:{position:'absolute',backgroundColor:'rgba(0,0,0,.89)'},
 spotlightOutline:{position:'absolute',borderColor:'#ffffff',borderWidth:2,borderRadius:16},
 spotlightCallout:{position:'absolute',backgroundColor:'#fff9fb',padding:12,borderRadius:14,
  borderColor:'#db8ea8',borderWidth:2,gap:8,justifyContent:'space-around'},
 spotlightTitle:{fontWeight:'900',fontSize:17,color:'#8f3556'},
 spotlightDescription:{fontSize:12,lineHeight:19,color:'#453a45'},
 spotlightWarning:{fontSize:11,lineHeight:16,color:'#84475b'},
 spotlightCheckbox:{minHeight:38,justifyContent:'center'},
 spotlightCheckboxText:{fontSize:12,fontWeight:'700',color:'#453a45'},
 spotlightNext:{minHeight:42,backgroundColor:'#9e4667',borderRadius:11,
  alignItems:'center',justifyContent:'center'},
 spotlightNextText:{fontWeight:'900',fontSize:14,color:'#fff'},
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
