import {useEffect,useRef,useState} from 'react';
import {router} from 'expo-router';
import {Image,Modal,Pressable,ScrollView,Share,StyleSheet,Text,View} from 'react-native';
import type {ViewInstance} from 'react-native';
import type {EchoTrack} from '../../types';
import {getApiBaseUrl} from '../../api/client';
import {useLegacyTheme} from './legacyTheme';
import {AnimatedNewcomerTag} from './AnimatedNewcomerTag';
import {splitSpeakerNames} from './speakerNames';
import {useDevicePreferences} from './DevicePreferences';
import {useViewportDimensions} from '../useViewportDimensions';
import {cardMenuLayout} from './cardMenuLayout';
import {useFontZoom} from './FontZoom';

export function LegacyTrackCard({track,onNotice,onDislike}:{
 track:EchoTrack;onNotice:(message:string)=>void;onDislike:(id:string)=>void;
}){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const preferences=useDevicePreferences();
 const viewport=useViewportDimensions();
 const moreAnchor=useRef<ViewInstance>(null);
 const [open,setOpen]=useState(false);
 const [menuPosition,setMenuPosition]=useState(()=>cardMenuLayout({x:0,y:0,width:32,height:32},{width:390,height:844}));
 const [coverError,setCoverError]=useState(false);
 const favorite=preferences.favoriteIds.includes(track.id);
 const speakerNames=splitSpeakerNames(track.speaker);
 useEffect(()=>setOpen(false),[track.id,viewport.width,viewport.height]);
 const openMenu=()=>{
  moreAnchor.current?.measureInWindow((x,y,width,height)=>{
   setMenuPosition(cardMenuLayout({x,y,width,height},viewport));setOpen(true);
  });
 };
 const toggleFavorite=()=>{
  setOpen(false);
  const added=preferences.toggleFavorite(track.id);
  onNotice(added?'已加入此裝置收藏（尚未與中央會員同步）。':'已取消此裝置的收藏。');
 };
 const apiOrigin=getApiBaseUrl();
 const rawCover=track.coverUrl;
 const coverUri=rawCover&&apiOrigin
  ?(rawCover.startsWith('/')?apiOrigin+rawCover:rawCover):null;
 useEffect(()=>setCoverError(false),[coverUri,track.id]);
 const duration=Math.max(0,Math.floor(track.durationSeconds));
 const speakerRank=track.speakerRank?.trim()||'';
 const legacy=track.legacySnapshot===true;
 const toggleDetails=()=>{
  setOpen(false);
  if(track.playable){router.push({pathname:'/track/[id]',params:{id:track.id}});return;}
  router.push({pathname:'/preview/[id]',params:{id:track.id}});
 };
 const playFromPhoto=()=>{
  setOpen(false);
  if(!track.playable){
   onNotice('這張是原版音檔資訊卡；錄音仍屬私人遷移資料，尚未完成公開播放授權。');
   return;
  }
  router.push({pathname:'/track/[id]',params:{id:track.id}});
 };
 const share=async()=>{
  setOpen(false);
  if(!track.playable){onNotice('此音檔尚未取得公開分享與播放授權。');return;}
  if(!apiOrigin){onNotice('尚未設定公開分享網址。');return;}
  try{await Share.share({message:track.title+' · '+track.speaker+'\n'+apiOrigin+'/track/'+encodeURIComponent(track.id)});}
  catch{onNotice('目前無法使用系統分享。');}
 };
 const noLike=()=>{setOpen(false);onDislike(track.id);};
 const hideOneSpeaker=(name:string)=>{
  setOpen(false);
  // Multi-speaker cards must not silently blacklist every co-presenter.
  const added=preferences.hideSpeaker(name);
  onNotice(added
   ?'已在本裝置隱藏「'+name+'」的核准作品（含共同講師作品），可在我的收藏中還原。'
   :'未新增隱藏「'+name+'」（可能已在清單或已達上限）。');
 };
 return <View style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
  <View style={styles.body}>
   <View style={styles.mediaSide}>
    <Pressable onPress={playFromPhoto}
     accessibilityRole="button"
     accessibilityLabel={track.playable?'點擊照片開始播放':'音檔尚未開放播放'}
     style={[styles.portrait,{backgroundColor:t.dark?'#344052':'#f8e6ed'}]}>
     {coverUri&&!coverError
      ?<Image source={{uri:coverUri}} resizeMode="cover" onError={()=>setCoverError(true)}
         accessibilityLabel={'封面：'+track.speaker} style={styles.photo}/>
      :<Text style={[styles.portraitIcon,{color:t.palette.primary}]}>🎙</Text>}
     <View style={[styles.rewardBar,{backgroundColor:track.playable?t.palette.primary:'#76455d'}]}>
      <Text style={styles.rewardText}>{track.playable?'寫心得可得獎勵':'僅展示資訊'}</Text>
     </View>
     <View style={styles.permissionBar}>
      <Text style={styles.permissionText}>{track.playable?'公開播放':'播放未開放'}</Text>
     </View>
    </Pressable>
    <Text style={[styles.duration,{color:t.muted,fontSize:fontSize(11)}]}>
     ◷ {duration>0?'約 '+Math.max(1,Math.round(duration/60))+' 分鐘':'時間待確認'}
    </Text>
   </View>
   <View style={styles.details}>
    <Pressable onPress={toggleDetails} accessibilityRole="button"
     accessibilityLabel={'查看音檔資訊：'+track.title}>
     <Text numberOfLines={2} style={[styles.title,{color:t.palette.primary,fontSize:fontSize(20),lineHeight:fontSize(24)}]}>{track.title}</Text>
    </Pressable>
    <View style={styles.speakerLinks}>
     {speakerNames.map((name,i)=>
      <View key={name+i} style={styles.speakerPart}>
       {i>0&&<Text style={[styles.speaker,{color:t.ink,fontSize:fontSize(14)}]}> & </Text>}
       <Pressable accessibilityRole="link" accessibilityLabel={'查看'+name+'的演講者資料'}
        onPress={()=>router.push({pathname:'/speaker/[name]',params:{name}})}>
        <Text style={[styles.speaker,{color:t.ink,fontSize:fontSize(14)}]}>{name}</Text>
       </Pressable>
      </View>)}
     {!!speakerRank&&<Text numberOfLines={1} style={[styles.speaker,{color:t.ink,fontSize:fontSize(14)}]}> {speakerRank}</Text>}
    </View>
    <View style={styles.tags}>
     {track.categories.slice(0,3).map((c,i)=>c.trim()==='新人'?
      <AnimatedNewcomerTag key={c+i} fill={t.lightPill} textColor={t.palette.primary}/>:
      <View key={c+i} style={[styles.tag,{backgroundColor:t.lightPill,borderColor:t.border}]}>
       <Text numberOfLines={1} style={[styles.tagText,{color:t.palette.primary,fontSize:fontSize(10)}]}>{c}</Text>
      </View>)}
    </View>
    <View style={[styles.stats,{borderTopColor:t.border}]}>
     <View style={styles.ratingRow}>
      <Text style={styles.stars}>{legacy&&typeof track.rating==='number'
       ?'★'.repeat(Math.max(0,Math.min(5,Math.round(track.rating))))+
        '☆'.repeat(5-Math.max(0,Math.min(5,Math.round(track.rating))))
       :'☆☆☆☆☆'}</Text>
      <Text style={[styles.ratingValue,{color:t.muted,fontSize:fontSize(11)}]}>
       {legacy&&typeof track.rating==='number'
        ?track.rating.toFixed(1)+' ('+(track.ratingCount??0)+')':'—'}
      </Text>
     </View>
     <Text style={[styles.snapshot,{color:t.muted,fontSize:fontSize(9)}]}>
      {legacy?'舊版統計（唯讀）':'評價待同步'}
     </Text>
     <View style={styles.statRow}>
      <Text style={[styles.stat,{color:t.muted,fontSize:fontSize(11)}]}>▤ 心得 {legacy?(track.commentsCount??0):'—'}</Text>
      <Text style={[styles.stat,{color:t.muted,fontSize:fontSize(11)}]}>♡ 按讚 {legacy?(track.likes??0):'—'}</Text>
     </View>
    </View>
   </View>
  </View>
  <Pressable ref={moreAnchor} hitSlop={6} accessibilityRole="button" accessibilityLabel="更多功能"
   accessibilityState={{expanded:open}} onPress={openMenu}
   style={[styles.more,{backgroundColor:t.card,borderColor:t.border}]}>
   <Text style={[styles.moreText,{color:t.muted}]}>⋮</Text>
  </Pressable>
  <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={StyleSheet.absoluteFill}>
    <Pressable accessibilityRole="button" accessibilityLabel="關閉音檔選單背景"
     onPress={()=>setOpen(false)} style={[StyleSheet.absoluteFill,styles.menuBackdrop]}/>
    <View accessibilityViewIsModal style={[styles.popup,menuPosition,{backgroundColor:t.card,borderColor:t.border}]}>
     <ScrollView contentContainerStyle={styles.popupContent}>
   <Pressable accessibilityRole="button" accessibilityLabel="關閉音檔選單" style={styles.popupRow} onPress={()=>setOpen(false)}>
    <Text style={[styles.popupText,{color:t.muted,fontSize:fontSize(13)}]}>✕　關閉選單</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={styles.popupRow} onPress={()=>void share()}>
    <Text style={[styles.popupText,{color:t.ink,fontSize:fontSize(13)}]}>⇧　{track.playable?'分享音檔':'分享尚未開放'}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={styles.popupRow} onPress={toggleDetails}>
    <Text style={[styles.popupText,{color:t.ink,fontSize:fontSize(13)}]}>ⓘ　詳細內容</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={styles.popupRow} onPress={toggleFavorite}
    disabled={!preferences.ready} accessibilityState={{disabled:!preferences.ready}}>
    <Text style={[styles.popupText,{color:t.ink,fontSize:fontSize(13)}]}>{favorite?'▣　取消收藏':'♧　加入收藏'}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" style={styles.popupRow} onPress={noLike}
    disabled={!preferences.ready} accessibilityState={{disabled:!preferences.ready}}>
    <Text style={[styles.popupText,{color:t.palette.primary,fontSize:fontSize(13)}]}>⊘　我不喜歡這張卡片</Text>
   </Pressable>
   {speakerNames.map(name=><Pressable key={name}
    accessibilityRole="button" accessibilityLabel={'隱藏演講者：'+name}
    style={styles.popupRow} onPress={()=>hideOneSpeaker(name)}
    disabled={!preferences.ready} accessibilityState={{disabled:!preferences.ready}}>
    <Text style={[styles.popupText,{color:t.palette.primary,fontSize:fontSize(13)}]}>⊘　不喜歡講師：{name}（本裝置）</Text>
   </Pressable>)}
     </ScrollView>
    </View>
   </View>
  </Modal>
 </View>;
}
const styles=StyleSheet.create({
 card:{width:'100%',borderRadius:21,borderWidth:1,marginBottom:12,minHeight:162,
  shadowColor:'#0f172a',shadowOffset:{width:0,height:7},shadowRadius:16,shadowOpacity:.075,elevation:2},
 body:{flexDirection:'row',padding:10,gap:12},
 mediaSide:{width:112,alignItems:'center',flexShrink:0},
 portrait:{height:112,width:112,borderRadius:16,overflow:'hidden',justifyContent:'center',alignItems:'center'},
 photo:{width:'100%',height:'100%',position:'absolute',left:0,top:0},
 portraitIcon:{fontSize:47},
 rewardBar:{position:'absolute',left:0,right:0,top:0,alignItems:'center',paddingVertical:4},
 rewardText:{color:'#fff',fontWeight:'700',fontSize:12},
 permissionBar:{position:'absolute',left:0,right:0,bottom:0,backgroundColor:'rgba(15,23,42,.75)',alignItems:'center',paddingVertical:4},
 permissionText:{color:'#fff',fontWeight:'700',fontSize:12},
 duration:{fontSize:11,fontWeight:'500',marginTop:6,textAlign:'center'},
 details:{flex:1,minWidth:0,paddingRight:23,minHeight:138},
 title:{fontSize:20,fontWeight:'900',lineHeight:24},
 speakerLinks:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',marginTop:4},
 speakerPart:{flexDirection:'row',alignItems:'center'},
 speaker:{fontSize:14,fontWeight:'500',marginTop:2},
 tags:{flexDirection:'row',gap:4,marginTop:8,flexWrap:'wrap',alignItems:'center'},
 tag:{borderWidth:1,borderRadius:999,paddingHorizontal:7,paddingVertical:4},
 tagText:{fontSize:10,fontWeight:'500'},
 stats:{marginTop:'auto',paddingTop:7,borderTopWidth:1},
 ratingRow:{flexDirection:'row',gap:5,alignItems:'center',flexWrap:'wrap'},
 stars:{color:'#fbbf24',fontSize:15,letterSpacing:0},
 ratingValue:{fontSize:11},
 snapshot:{fontSize:9,marginTop:2},
 statRow:{flexDirection:'row',gap:12,marginTop:5,flexWrap:'wrap'},
 stat:{fontSize:11,fontWeight:'500'},
 more:{position:'absolute',right:9,top:9,width:32,height:32,borderWidth:1,borderRadius:17,alignItems:'center',justifyContent:'center',zIndex:11},
 moreText:{fontSize:23,lineHeight:26,fontWeight:'700'},
 menuBackdrop:{backgroundColor:'rgba(15,23,42,.12)'},
 popup:{position:'absolute',borderWidth:1,borderRadius:14,overflow:'hidden',
  shadowColor:'#111827',shadowOpacity:.17,shadowRadius:13,elevation:13},
 popupContent:{padding:5},
 popupRow:{minHeight:44,paddingVertical:10,paddingHorizontal:9,justifyContent:'center'},
 popupText:{fontSize:13,fontWeight:'700'},
 expanded:{paddingHorizontal:12,paddingVertical:11,borderTopWidth:1,borderBottomLeftRadius:20,borderBottomRightRadius:20,gap:5},
 expandedTitle:{fontSize:14,fontWeight:'800'},
 expandedText:{fontSize:12,lineHeight:19}
});
