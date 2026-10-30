import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getGuestPreviewTracks,getPublicTracks} from '../src/api/client';
import {useDevicePreferences} from '../src/ui/echo/DevicePreferences';
import {LegacyTrackCard} from '../src/ui/echo/LegacyTrackCard';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {visualMetrics} from '../packages/ui/src/tokens';
import {getCatalogDisplayState,hasPartialCatalogFailure} from '../src/ui/echo/catalogDisplayState';
import {restorableHiddenCards} from '../src/ui/echo/dislikedTracks';
import {isSpeakerHidden,restorableHiddenSpeakers} from '../src/ui/echo/hiddenSpeakers';

export default function DeviceFavorites(){
 const t=useLegacyTheme();
 const preferences=useDevicePreferences();
 const [notice,setNotice]=useState('');
 const previews=useQuery({queryKey:['echo','guest-previews'],queryFn:({signal})=>getGuestPreviewTracks(signal),retry:1});
 const catalog=useQuery({queryKey:['echo','favorite-public-catalog'],queryFn:({signal})=>getPublicTracks(signal),retry:1});
 // Saved IDs are not an access grant: resolve only through current authorized lists.
 const tracks=[...(catalog.data??[]),...(previews.data??[])].filter(track=>
  preferences.favoriteIds.includes(track.id)&&!preferences.dislikedIds.includes(track.id)&&
  !isSpeakerHidden(track.speaker,preferences.hiddenSpeakers));
 const publicSource={pending:catalog.isPending,failed:catalog.isError,count:catalog.data?.length??0};
 const previewSource={pending:previews.isPending,failed:previews.isError,count:previews.data?.length??0};
 const display=getCatalogDisplayState(publicSource,previewSource,tracks.length);
 const partial=hasPartialCatalogFailure(publicSource,previewSource);
 const pending=!preferences.ready||display==='loading';
 const hiddenCards=restorableHiddenCards(catalog.data??[],previews.data??[],preferences.dislikedIds);
 const missingHiddenCount=Math.max(0,preferences.dislikedIds.length-hiddenCards.length);
 const hiddenSpeakerNames=restorableHiddenSpeakers([...(catalog.data??[]),...(previews.data??[])],preferences.hiddenSpeakers);
 const missingSpeakerCount=Math.max(0,preferences.hiddenSpeakers.length-hiddenSpeakerNames.length);
 const retry=()=>{void previews.refetch();void catalog.refetch();};
 return <ScrollView style={{flex:1,backgroundColor:t.bg}} contentContainerStyle={styles.page}>
  <View style={styles.shell}>
   <Text style={[styles.title,{color:t.ink}]}>我的收藏</Text>
   <Text style={[styles.note,{color:t.muted}]}>僅保留在此裝置，尚未與會員同步。收藏不會開放錄音播放或分享。</Text>
   {preferences.storageError&&<Text style={[styles.note,{color:t.muted}]}>部分本機偏好無法讀取或儲存，相關變更可能僅在目前使用期間保留。</Text>}
   {!!notice&&<Text accessibilityLiveRegion="polite" style={[styles.notice,{color:t.palette.primary}]}>{notice}</Text>}
   {preferences.dislikedIds.length>0&&<View style={[styles.hiddenSection,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.hiddenTitle,{color:t.ink}]}>不喜歡的音檔卡（本裝置）</Text>
    <Text style={[styles.note,{color:t.muted}]}>只顯示目前仍獲准瀏覽的卡片。還原不會解鎖錄音，也不會同步至會員。</Text>
    {!pending&&hiddenCards.map(track=><View key={track.id} style={[styles.hiddenRow,{borderTopColor:t.border}]}>
     <View style={styles.hiddenDetails}>
      <Text numberOfLines={2} style={[styles.hiddenName,{color:t.ink}]}>{track.title}</Text>
      <Text numberOfLines={1} style={[styles.hiddenSpeaker,{color:t.muted}]}>{track.speaker}</Text>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel={'還原隱藏：'+track.title}
       disabled={!preferences.ready} onPress={()=>{
        if(preferences.restoreHiddenTrack(track.id))setNotice('已恢復此裝置的一張音檔卡。');
       }} style={[styles.hiddenRestore,{borderColor:t.palette.primary}]}>
      <Text style={[styles.hiddenRestoreText,{color:t.palette.primary}]}>個別還原</Text>
     </Pressable>
    </View>)}
    {!pending&&missingHiddenCount>0&&<Text style={[styles.note,{color:t.muted}]}>
      另有 {missingHiddenCount} 張隱藏卡目前無法顯示詳情（可能未公開或資料暫時無法讀取）。
    </Text>}
    <Pressable accessibilityRole="button" accessibilityLabel="還原所有本裝置隱藏的音檔卡"
     disabled={!preferences.ready} onPress={()=>{
      preferences.restoreHidden();setNotice('已還原此裝置全部隱藏的卡片。');
     }} style={[styles.restore,{borderColor:t.border}]}>
     <Text style={{color:t.palette.primary}}>還原全部（{preferences.dislikedIds.length} 張）</Text>
    </Pressable>
   </View>}
   {preferences.hiddenSpeakers.length>0&&<View style={[styles.hiddenSection,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.hiddenTitle,{color:t.ink}]}>不喜歡的演講者（本裝置）</Text>
    <Text style={[styles.note,{color:t.muted}]}>只顯示目前仍獲核准資料的講者名稱。夫妻或共同講者可能一併隱藏；不會同步至會員。</Text>
    {!pending&&hiddenSpeakerNames.map(name=><View key={name} style={[styles.hiddenRow,{borderTopColor:t.border}]}>
     <Text style={[styles.hiddenName,styles.hiddenDetails,{color:t.ink}]} numberOfLines={2}>{name}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel={'取消隱藏演講者：'+name}
      disabled={!preferences.ready} onPress={()=>{
       if(preferences.restoreHiddenSpeaker(name))setNotice('已取消隱藏此演講者。');
      }} style={[styles.hiddenRestore,{borderColor:t.palette.primary}]}>
      <Text style={[styles.hiddenRestoreText,{color:t.palette.primary}]}>取消隱藏</Text>
     </Pressable>
    </View>)}
    {!pending&&missingSpeakerCount>0&&<Text style={[styles.note,{color:t.muted}]}>
     另有 {missingSpeakerCount} 項隱藏講者目前無法顯示名稱（可能已停止公開或資料暫時無法讀取）。
    </Text>}
    <Pressable accessibilityRole="button" accessibilityLabel="還原所有本裝置隱藏的演講者"
     disabled={!preferences.ready} onPress={()=>{preferences.restoreAllSpeakers();setNotice('已還原本裝置隱藏的演講者。');}}
     style={[styles.restore,{borderColor:t.border}]}>
     <Text style={{color:t.palette.primary}}>還原全部演講者（{preferences.hiddenSpeakers.length} 項）</Text>
    </Pressable>
   </View>}
   {partial&&<View style={[styles.warning,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.note,{color:t.muted}]}>部分收藏來源暫時讀取失敗，以下內容可能不完整。</Text>
    <Pressable accessibilityRole="button" onPress={retry} accessibilityLabel="重新讀取收藏"
     style={styles.retry}><Text style={{color:t.palette.primary,fontWeight:'800'}}>重新讀取</Text></Pressable>
   </View>}
   {pending?<ActivityIndicator color={t.palette.primary}/>:
    display==='failed'?<View style={[styles.warning,{backgroundColor:t.card,borderColor:t.border}]}>
     <Text style={[styles.note,{color:t.muted}]}>收藏資訊暫時無法完整讀取，不能判斷是否有可顯示的作品；本機收藏紀錄仍保留。</Text>
     <Pressable accessibilityRole="button" onPress={retry} accessibilityLabel="重試載入收藏"
      style={styles.retry}><Text style={{color:t.palette.primary,fontWeight:'800'}}>重試載入</Text></Pressable>
    </View>:
    display==='ready'?tracks.map(track=><LegacyTrackCard key={track.id} track={track} onNotice={setNotice}
     onDislike={id=>{preferences.dislike(id);setNotice('已在此裝置隱藏卡片。');}}/>):
    <View style={[styles.empty,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.emptyTitle,{color:t.ink}]}>目前沒有可顯示的收藏</Text>
     <Text style={[styles.note,{color:t.muted}]}>{preferences.favoriteIds.length?
      '已收藏的作品可能已隱藏、暫時無法載入或已停止展示。收藏記錄仍保留。':
      '在音檔卡右上角「⋮」選擇「加入收藏」，即可在此查看。'}</Text>
    </View>}
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 page:{alignItems:'center',padding:12,paddingBottom:32},shell:{maxWidth:visualMetrics.contentMaxWidth,width:'100%'},
 title:{fontSize:23,fontWeight:'900',marginTop:8},note:{fontSize:12,lineHeight:20,marginVertical:10},
 notice:{paddingVertical:12,fontSize:13},restore:{minHeight:44,borderWidth:1,borderRadius:12,padding:12,marginBottom:12},
 hiddenSection:{padding:12,borderWidth:1,borderRadius:15,marginVertical:12,gap:8},
 hiddenTitle:{fontWeight:'900',fontSize:15},
 hiddenRow:{borderTopWidth:1,paddingTop:10,flexDirection:'row',alignItems:'center',gap:12},
 hiddenDetails:{flex:1,minWidth:0},
 hiddenName:{fontSize:13,fontWeight:'800'},
 hiddenSpeaker:{fontSize:11,marginTop:5},
 hiddenRestore:{borderWidth:1,borderRadius:11,paddingHorizontal:12,minHeight:44,alignItems:'center',justifyContent:'center'},
 hiddenRestoreText:{fontSize:12,fontWeight:'800'},
 warning:{borderWidth:1,borderRadius:14,padding:12,marginBottom:10},
 retry:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',paddingHorizontal:8},
 empty:{borderWidth:1,borderStyle:'dashed',borderRadius:20,padding:20},emptyTitle:{fontSize:16,fontWeight:'800'}
});
