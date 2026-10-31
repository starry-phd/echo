import {useFontZoom} from '../../src/ui/echo/FontZoom';
import {useEffect,useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Image,Modal,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getApiBaseUrl,getPublicTracks,getGuestPreviewTracks} from '../../src/api/client';
import {splitSpeakerNames} from '../../src/ui/echo/speakerNames';
import {LegacySpeakerRecordingRow} from '../../src/ui/echo/LegacySpeakerRecordingRow';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {visualMetrics} from '../../packages/ui/src/tokens';
import {useDevicePreferences} from '../../src/ui/echo/DevicePreferences';
import {useViewportDimensions} from '../../src/ui/useViewportDimensions';
import {getCatalogDisplayState,hasPartialCatalogFailure} from '../../src/ui/echo/catalogDisplayState';
import {isSpeakerHidden} from '../../src/ui/echo/hiddenSpeakers';
import {authorizedSpeakerProfileTracks,publicSpeakerRouteName} from '../../src/ui/echo/authorizedSpeakerProfile';
import {mergeAuthorizedCards} from '../../src/ui/echo/mergeAuthorizedCards';
import {speakerProfileSections,speakerBioUnavailableText,speakerQaUnavailableText} from '../../src/ui/echo/speakerProfileSections';
import type {EchoTrack} from '../../src/types';
import type {SpeakerProfileSection} from '../../src/ui/echo/speakerProfileSections';
export default function PublicSpeakerTracks(){
 const t=useLegacyTheme();
 const {height}=useViewportDimensions();
 const {fontSize}=useFontZoom();
 const [confirmTrack,setConfirmTrack]=useState<EchoTrack|null>(null);
 const close=()=>router.canGoBack()?router.back():router.replace('/');
 useEffect(()=>{
  if(Platform.OS!=='web'||typeof document==='undefined')return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){
   event.preventDefault();
   if(confirmTrack)setConfirmTrack(null);else close();
  }};
  document.addEventListener('keydown',onKey);
  return ()=>document.removeEventListener('keydown',onKey);
 },[confirmTrack]);
 const [notice,setNotice]=useState('');
 const [section,setSection]=useState<SpeakerProfileSection>('audio');
 const {favoriteIds,toggleFavorite,dislikedIds,hiddenSpeakers,ready,dislike,restoreHidden}=useDevicePreferences();
 const toggleLocalFavorite=(id:string)=>{
  const added=toggleFavorite(id);
  setNotice(added?'已加入此裝置收藏（尚未與中央會員同步）。':'已取消此裝置的收藏。');
 };
 const hide=(id:string)=>{
  dislike(id);
  setConfirmTrack(null);
  setNotice('已在此裝置隱藏卡片。');
 };
 const {name}=useLocalSearchParams<{name:string}>();
 const speaker=publicSpeakerRouteName(name);
 const p=useQuery({
  queryKey:['echo','guest-previews'],
  queryFn:({signal})=>getGuestPreviewTracks(signal),
  select:tracks=>tracks.filter(track=>splitSpeakerNames(track.speaker).includes(speaker!)),
  enabled:Boolean(speaker),retry:1
 });
 const q=useQuery({
  queryKey:['echo','public-speaker-recordings',speaker],
  // The public catalog's speaker= filter is whole-string only; a verified
  // '王小明 & 林美麗' co-presented track would be omitted for either person.
  // Use the public-only bound keyword search for candidates, then require
  // exact normalized speaker-part matching in authorizedSpeakerProfileTracks.
  queryFn:({signal})=>getPublicTracks(signal,{query:speaker!}),enabled:Boolean(speaker),retry:1,
 });
 // A name in a URL is not evidence that the API currently approves it.
 // Check current approved metadata and both local visibility preferences.
 const speakerHidden=Boolean(speaker&&isSpeakerHidden(speaker,hiddenSpeakers));
 const visibleTracks=authorizedSpeakerProfileTracks(speaker,
  mergeAuthorizedCards(q.data??[],p.data??[]),dislikedIds,hiddenSpeakers);
 const origin=getApiBaseUrl();
 const publicSource={pending:q.isPending,failed:q.isError,count:q.data?.length??0};
 const guestSource={pending:p.isPending,failed:p.isError,count:p.data?.length??0};
 const display=getCatalogDisplayState(publicSource,guestSource,visibleTracks.length);
 const partial=hasPartialCatalogFailure(publicSource,guestSource);
 const retry=()=>{void q.refetch();void p.refetch();};
 const showBio=ready&&display==='ready'&&!speakerHidden;
 const photo=showBio?p.data?.find(track=>
  visibleTracks.some(approved=>approved.id===track.id)&&track.coverUrl)?.coverUrl:null;
 return <View style={styles.overlay} accessibilityLabel="演講者個人資訊視窗">
  <Pressable accessibilityRole="button" accessibilityLabel="關閉演講者資料視窗背景"
   onPress={close} style={StyleSheet.absoluteFill}/>
  <View style={[styles.modalPanel,{backgroundColor:t.bg,borderColor:t.border,
   height:Math.max(1,Math.floor(height*0.79))}]}>
   <View style={[styles.modalHeader,{borderBottomColor:t.border}]}>
    <Text style={[styles.modalTitle,{color:t.ink,fontSize:fontSize(14)}]}>演講者個人資訊</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="關閉演講者資料視窗"
     onPress={close} style={styles.closeButton}>
     <Text style={[styles.closeText,{color:t.muted}]}>✕</Text>
    </Pressable>
   </View>
   <ScrollView style={[styles.root,{backgroundColor:t.bg}]} contentContainerStyle={styles.content}>
  <View style={styles.shell}>
   {showBio&&<View style={[styles.bio,{backgroundColor:t.card,borderColor:t.border}]}>
    <View style={[styles.avatar,{backgroundColor:t.lightPill}]}>
     {photo&&origin?<Image source={{uri:origin+photo}} resizeMode="cover"
      style={styles.photo} accessibilityLabel={'原版講者封面：'+speaker}/>:
      <Text style={[styles.initial,{color:t.palette.primary}]}>{Array.from(speaker??'♪')[0]??'♪'}</Text>}
    </View>
    <View style={styles.bioText}>
     <Text style={[styles.title,{color:t.ink,fontSize:fontSize(22)}]}>{speaker??'無效的講師名稱'}</Text>
     <Text style={[styles.note,{color:t.muted,fontSize:fontSize(12)}]}>原版可瀏覽作品；播放須另行授權</Text>
    </View>
    <View style={[styles.biography,{borderTopColor:t.border}]}>
     <Text style={[styles.biographyTitle,{color:t.ink,fontSize:fontSize(14)}]}>綜合人物摘要</Text>
     <Text style={[styles.biographyText,{color:t.muted,fontSize:fontSize(12)}]}>{speakerBioUnavailableText}</Text>
    </View>
   </View>}
   {showBio&&<View style={styles.tabList} accessibilityRole="tablist" accessibilityLabel="講師資料分頁">
    {speakerProfileSections.map(item=><Pressable key={item.id} accessibilityRole="tab"
     accessibilityLabel={item.label} accessibilityState={{selected:section===item.id}}
     onPress={()=>setSection(item.id)}
     style={[styles.tab,{borderColor:section===item.id?t.palette.primary:t.border,
      backgroundColor:section===item.id?t.palette.primary:t.card}]}>
     <Text style={[styles.tabText,{color:section===item.id?'#fff':t.ink,fontSize:fontSize(13)}]}>
      {item.id==='audio'?`所有錄音（${visibleTracks.length}）`:'歷史問答'}
     </Text>
    </Pressable>)}
   </View>}
   {showBio&&section==='audio'&&<Text style={[styles.tabHint,{color:t.muted,fontSize:fontSize(12)}]}>
    僅列出目前已核准展示的作品；未取得公開播放授權的錄音只顯示資訊卡。
   </Text>}
   {showBio&&section==='qa'&&<View style={[styles.qaEmpty,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.qaTitle,{color:t.ink,fontSize:fontSize(16)}]}>歷史問答</Text>
    <Text style={[styles.qaDescription,{color:t.muted,fontSize:fontSize(12)}]}>{speakerQaUnavailableText}</Text>
   </View>}
   {section==='audio'&&<Text style={[styles.section,{color:t.ink,fontSize:fontSize(18)}]}>所有錄音</Text>}
   {speakerHidden&&<Pressable accessibilityRole="button" onPress={()=>router.push('/favorites')} style={styles.back}>
    <Text style={[styles.backText,{color:t.palette.primary,fontSize:fontSize(14)}]}>此演講者已在本裝置隱藏，前往收藏頁管理</Text>
   </Pressable>}
   {notice.length>0&&<Text style={[styles.message,{color:t.palette.primary,fontSize:fontSize(13)}]}>{notice}</Text>}
   {dislikedIds.length>0&&<Pressable accessibilityRole="button" onPress={()=>{
    restoreHidden();setNotice('已還原此裝置隱藏的卡片。');
   }}><Text style={[styles.backText,{color:t.palette.primary,fontSize:fontSize(14)}]}>還原隱藏（{dislikedIds.length} 張）</Text></Pressable>}
   {!!speaker&&partial&&display!=='failed'&&<View style={[styles.warning,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.message,{color:t.muted,fontSize:fontSize(13)}]}>部分講師作品暫時無法讀取，目前只顯示成功取得的資料。</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="重新載入講師作品" onPress={retry} style={styles.retry}>
      <Text style={[styles.backText,{color:t.palette.primary,fontSize:fontSize(14)}]}>重新讀取</Text>
     </Pressable>
    </View>}
   {section==='qa'&&showBio?null:!speaker?<Text style={[styles.message,{color:t.muted,fontSize:fontSize(13)}]}>講師連結不正確。</Text>:
    (!ready||display==='loading')?<ActivityIndicator color={t.palette.primary}/>:
    display==='failed'?<View style={[styles.warning,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.message,{color:t.muted,fontSize:fontSize(13)}]}>講師作品資料暫時無法完整載入，並非沒有作品。</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="重新載入講師作品" onPress={retry} style={styles.retry}>
      <Text style={[styles.backText,{color:t.palette.primary,fontSize:fontSize(14)}]}>重試載入</Text>
     </Pressable>
    </View>:
    display==='ready'? visibleTracks.map(track=><LegacySpeakerRecordingRow key={track.id}
     track={track} favorite={favoriteIds.includes(track.id)}
     onSelect={()=>setConfirmTrack(track)}
     onFavorite={()=>toggleLocalFavorite(track.id)} onHide={()=>hide(track.id)}/>):
    <View style={[styles.empty,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.message,{color:t.muted,fontSize:fontSize(13)}]}>目前沒有可瀏覽的講者作品資訊。</Text>
    </View>}
   {confirmTrack&&<Modal visible transparent animationType="fade"
    onRequestClose={()=>setConfirmTrack(null)}>
    <View style={styles.confirmOverlay}>
     <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="關閉錄音確認視窗背景"
      accessibilityRole="button" onPress={()=>setConfirmTrack(null)}/>
     <View style={[styles.confirmDialog,{backgroundColor:t.card,borderColor:t.border}]}>
      <Text style={[styles.confirmTitle,{color:t.ink,fontSize:fontSize(17)}]}>
       {confirmTrack.playable?'是否查看並播放這場公開錄音？':'這場錄音尚未開放播放'}
      </Text>
      <Text style={[styles.confirmDescription,{color:t.ink,fontSize:fontSize(14)}]}>
       {[speaker,confirmTrack.speakerRank,confirmTrack.title].filter(Boolean).join(' ')}
      </Text>
      {!confirmTrack.playable&&<Text style={[styles.confirmDescription,{color:t.muted,fontSize:fontSize(12)}]}>
       僅能查看已核准資訊，尚無權播放原音檔。
      </Text>}
      <View style={styles.confirmActions}>
       <Pressable accessibilityRole="button" accessibilityLabel="取消" onPress={()=>setConfirmTrack(null)}
        style={[styles.confirmAction,{borderColor:t.border}]}>
        <Text style={[styles.confirmActionText,{color:t.ink,fontSize:fontSize(14)}]}>取消</Text>
       </Pressable>
       <Pressable accessibilityRole="button" accessibilityLabel={confirmTrack.playable?'查看公開錄音':'查看作品資訊'}
        onPress={()=>{const selected=confirmTrack;setConfirmTrack(null);
         if(selected)router.push({pathname:selected.playable?'/track/[id]':'/preview/[id]',params:{id:selected.id}});
        }} style={[styles.confirmAction,{backgroundColor:t.palette.primary}]}>
        <Text style={[styles.confirmActionText,{color:'#fff',fontSize:fontSize(14)}]}>
         {confirmTrack.playable?'查看公開錄音':'查看作品資訊'}
        </Text>
       </Pressable>
      </View>
     </View>
    </View>
   </Modal>}
   <Text style={[styles.disclaimer,{color:t.muted}]}>
    原版會員限定的講師資料、AI 問答及私人錄音仍須授權驗證；本站只顯示已核准公開內容。
   </Text>
  </View>
   </ScrollView>
  </View>
 </View>;
}
const styles=StyleSheet.create({
 overlay:{flex:1,backgroundColor:'rgba(15,23,42,.55)',alignItems:'center',justifyContent:'center',paddingHorizontal:12,paddingVertical:12},
 modalPanel:{width:'100%',maxWidth:570,borderWidth:1,borderRadius:18,overflow:'hidden',elevation:12},
 modalHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,minHeight:48,paddingLeft:14,paddingRight:6},
 modalTitle:{fontWeight:'800'},closeButton:{width:48,height:48,justifyContent:'center',alignItems:'center'},
 closeText:{fontSize:22,fontWeight:'700'},
 root:{flex:1},content:{paddingHorizontal:12,paddingBottom:32,alignItems:'center'},
 shell:{maxWidth:visualMetrics.contentMaxWidth,width:'100%',paddingTop:10},
 back:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',paddingHorizontal:5},
 backText:{fontSize:14,fontWeight:'800'},
 bio:{borderWidth:1,borderRadius:20,padding:15,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:12,minHeight:106},
 biography:{width:'100%',borderTopWidth:1,paddingTop:13,marginTop:5,gap:6},
 biographyTitle:{fontSize:14,fontWeight:'900'},biographyText:{fontSize:12,lineHeight:20},
 tabList:{flexDirection:'row',gap:8,marginTop:15},
 tab:{flex:1,minHeight:48,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:6},
 tabText:{fontWeight:'900',fontSize:13,textAlign:'center'},
 tabHint:{fontSize:12,lineHeight:20,marginTop:10},
 qaEmpty:{borderWidth:1,borderRadius:17,padding:18,marginTop:14,marginBottom:12,gap:9,minHeight:145,justifyContent:'center'},
 qaTitle:{fontSize:16,fontWeight:'900'},qaDescription:{fontSize:12,lineHeight:21},
 avatar:{width:80,height:80,borderRadius:40,justifyContent:'center',alignItems:'center',overflow:'hidden'},
 photo:{width:80,height:80},
 initial:{fontSize:32,fontWeight:'900'},
 bioText:{flex:1},title:{fontSize:22,fontWeight:'900'},
 note:{fontSize:12,marginTop:8},section:{fontSize:18,fontWeight:'900',marginVertical:18},
 warning:{borderWidth:1,borderRadius:14,padding:8,marginBottom:10},
 retry:{minHeight:44,justifyContent:'center',alignSelf:'flex-start',paddingHorizontal:10},
 empty:{borderWidth:1,borderStyle:'dashed',borderRadius:19,minHeight:130,alignItems:'center',justifyContent:'center'},
 message:{fontSize:13,textAlign:'center',lineHeight:22,padding:10},
 confirmOverlay:{flex:1,backgroundColor:'rgba(15,23,42,.6)',justifyContent:'center',paddingHorizontal:22},
 confirmDialog:{borderWidth:1,borderRadius:18,padding:19,gap:12,maxWidth:420,width:'100%',alignSelf:'center'},
 confirmTitle:{fontWeight:'900'},confirmDescription:{lineHeight:22},
 confirmActions:{flexDirection:'row',gap:10,marginTop:7},
 confirmAction:{minHeight:48,borderRadius:12,borderWidth:1,flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:5},
 confirmActionText:{fontWeight:'800'},
 disclaimer:{fontSize:11,lineHeight:18,marginTop:12,textAlign:'center'}
});
