import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {useDevicePreferences} from './DevicePreferences';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';
import {mayChangeLocalDetailPreference} from './detailPreferenceEligibility';
import type {AuthorizedDetailSource} from './detailPreferenceEligibility';

/** Real offline-device favorites + dislikes, shared by authorized public and
 * metadata-only preview detail routes. No Starry ID or playback side effects. */
export function LegacyDetailDeviceActions({track,routeId,source}:{
 track:EchoTrack;routeId:string|null;source:AuthorizedDetailSource;
}){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const preferences=useDevicePreferences();
 const eligible=preferences.ready&&mayChangeLocalDetailPreference(track,routeId,source);
 const favorite=preferences.favoriteIds.includes(track.id);
 return <View style={styles.container}>
  <Text style={[styles.heading,{color:t.ink,fontSize:fontSize(16)}]}>本裝置的音檔管理</Text>
  <View style={styles.actions}>
   <Pressable accessibilityRole="button" accessibilityLabel={favorite?'取消本裝置收藏':'加入本裝置收藏'}
    accessibilityState={{disabled:!eligible,selected:favorite}} disabled={!eligible}
    onPress={()=>{if(eligible)preferences.toggleFavorite(track.id);}}
    style={[styles.favorite,{backgroundColor:t.palette.primary},!eligible&&styles.disabled]}>
    <Text style={[styles.favoriteText,{fontSize:fontSize(13)}]}>{favorite?'♥ 取消本裝置收藏':'♡ 加入本裝置收藏'}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="我不喜歡，於本裝置隱藏此音檔卡"
    accessibilityState={{disabled:!eligible}} disabled={!eligible}
    onPress={()=>{if(eligible)preferences.dislike(track.id);}}
    style={[styles.dislike,{borderColor:t.border},!eligible&&styles.disabled]}>
    <Text style={[styles.dislikeText,{color:t.palette.primary,fontSize:fontSize(13)}]}>我不喜歡 · 隱藏</Text>
   </Pressable>
  </View>
  <Text style={[styles.note,{color:t.muted,fontSize:fontSize(12)}]}>
   收藏與隱藏只保存在此裝置，不會同步中央會員、改變音檔公開權限或解鎖播放。
  </Text>
  {preferences.storageError&&<Text style={[styles.note,{color:t.muted,fontSize:fontSize(12)}]}>
   本裝置偏好儲存發生異常，變更可能只在目前使用期間有效。
  </Text>}
 </View>;
}
const styles=StyleSheet.create({
 container:{gap:9,paddingVertical:8},
 heading:{fontWeight:'900'},
 actions:{flexDirection:'row',flexWrap:'wrap',gap:8},
 favorite:{minHeight:48,flexGrow:1,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:10},
 favoriteText:{fontWeight:'900',color:'#fff'},
 dislike:{minHeight:48,flexGrow:1,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center',paddingHorizontal:10},
 dislikeText:{fontWeight:'800'},
 disabled:{opacity:.45},note:{lineHeight:20}
});
