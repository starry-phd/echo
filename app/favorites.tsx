import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getGuestPreviewTracks,getPublicTracks} from '../src/api/client';
import {useDevicePreferences} from '../src/ui/echo/DevicePreferences';
import {LegacyTrackCard} from '../src/ui/echo/LegacyTrackCard';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {visualMetrics} from '../packages/ui/src/tokens';

export default function DeviceFavorites(){
 const t=useLegacyTheme();
 const preferences=useDevicePreferences();
 const [notice,setNotice]=useState('');
 const previews=useQuery({queryKey:['echo','guest-previews'],queryFn:({signal})=>getGuestPreviewTracks(signal),retry:1});
 const catalog=useQuery({queryKey:['echo','favorite-public-catalog'],queryFn:({signal})=>getPublicTracks(signal),retry:1});
 // Saved IDs are not an access grant: resolve only through current authorized lists.
 const tracks=[...(catalog.data??[]),...(previews.data??[])].filter(track=>
  preferences.favoriteIds.includes(track.id)&&!preferences.dislikedIds.includes(track.id));
 const pending=!preferences.ready||previews.isPending||catalog.isPending;
 const failed=previews.isError||catalog.isError;
 return <ScrollView style={{flex:1,backgroundColor:t.bg}} contentContainerStyle={styles.page}>
  <View style={styles.shell}>
   <Text style={[styles.title,{color:t.ink}]}>我的收藏</Text>
   <Text style={[styles.note,{color:t.muted}]}>僅保留在此裝置，尚未與會員同步。收藏不會開放錄音播放或分享。</Text>
   {preferences.storageError&&<Text style={[styles.note,{color:t.muted}]}>裝置儲存暫時不可用，變更僅在目前使用期間保留。</Text>}
   {!!notice&&<Text accessibilityLiveRegion="polite" style={[styles.notice,{color:t.palette.primary}]}>{notice}</Text>}
   {preferences.dislikedIds.length>0&&<Pressable accessibilityRole="button" onPress={preferences.restoreHidden}
    style={[styles.restore,{borderColor:t.border}]}>
    <Text style={{color:t.palette.primary}}>還原本裝置隱藏（{preferences.dislikedIds.length} 張）</Text>
   </Pressable>}
   {failed&&<Pressable accessibilityRole="button" onPress={()=>{void previews.refetch();void catalog.refetch();}}
    style={[styles.restore,{borderColor:t.border}]}>
    <Text style={{color:t.palette.primary}}>部分收藏暫時無法載入，點此重試</Text>
   </Pressable>}
   {pending?<ActivityIndicator color={t.palette.primary}/>:
    tracks.length?tracks.map(track=><LegacyTrackCard key={track.id} track={track} onNotice={setNotice}
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
 empty:{borderWidth:1,borderStyle:'dashed',borderRadius:20,padding:20},emptyTitle:{fontSize:16,fontWeight:'800'}
});
