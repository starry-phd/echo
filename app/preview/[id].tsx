import {useQuery} from '@tanstack/react-query';
import {router,useLocalSearchParams} from 'expo-router';
import {ActivityIndicator,Image,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getApiBaseUrl,getGuestPreviewTracks} from '../../src/api/client';
import {useDevicePreferences} from '../../src/ui/echo/DevicePreferences';
import {splitSpeakerNames} from '../../src/ui/echo/speakerNames';
import {AnimatedNewcomerTag} from '../../src/ui/echo/AnimatedNewcomerTag';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {useFontZoom} from '../../src/ui/echo/FontZoom';
import {visualMetrics} from '../../packages/ui/src/tokens';
import {isLocallyHiddenCard} from '../../src/ui/echo/localCardVisibility';
import {LegacyLectureNotes} from '../../src/ui/echo/LegacyLectureNotes';
import {LegacyEngagementDetail} from '../../src/ui/echo/LegacyEngagementDetail';
import {LegacyDetailDeviceActions} from '../../src/ui/echo/LegacyDetailDeviceActions';
import {LegacyDetailSectionNavigation} from '../../src/ui/echo/LegacyDetailSectionNavigation';
import {useDetailSectionJump} from '../../src/ui/echo/detailSectionScroll';
import {approvedGuestSpeakerRank} from '../../src/ui/echo/publicSpeakerRankNavigation';

/** Independent metadata-only detail route. No media source or audio player exists here. */
export default function GuestPreviewDetails(){
 const t=useLegacyTheme(),preferences=useDevicePreferences();
 const {fontSize}=useFontZoom();
 const sections=useDetailSectionJump();
 const {id}=useLocalSearchParams<{id:string}>();
 const valid=typeof id==='string'&&id.length>0&&id.length<=200;
 const q=useQuery({queryKey:['echo','guest-previews'],queryFn:({signal})=>getGuestPreviewTracks(signal),enabled:valid,retry:1});
 const track=q.data?.find(item=>item.id===id);
 const origin=getApiBaseUrl();
 const approvedRankLink=approvedGuestSpeakerRank(track);
 const hidden=isLocallyHiddenCard(track,preferences.dislikedIds,preferences.hiddenSpeakers);
 return <ScrollView ref={sections.scrollRef} style={{flex:1,backgroundColor:t.bg}} contentContainerStyle={styles.page}>
  <View style={styles.shell} onLayout={sections.onShellLayout}>
   <Pressable accessibilityRole="button" onPress={()=>router.canGoBack()?router.back():router.replace('/')} style={styles.back}>
    <Text style={[styles.backText,{color:t.palette.primary,fontSize:fontSize(14)}]}>‹ 返回音檔列表</Text>
   </Pressable>
   <View onLayout={sections.onCardLayout} style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
    {!valid?<Text style={{color:t.muted}}>無效的音檔連結。</Text>:
     q.isPending?<ActivityIndicator color={t.palette.primary}/>:
     q.isError?<Pressable accessibilityRole="button" onPress={()=>void q.refetch()} style={styles.back}>
      <Text style={{color:t.palette.primary}}>音檔資訊暫時無法載入，點此重試</Text>
     </Pressable>:!track?<Text style={{color:t.muted}}>這張資訊卡目前未開放展示。</Text>:
     !preferences.ready?<ActivityIndicator color={t.palette.primary}/>:
     hidden?<View style={styles.hiddenNotice}>
      <Text style={[styles.note,{color:t.muted,fontSize:fontSize(12)}]}>這張資訊卡已依本裝置的「我不喜歡」設定隱藏；這不會變更公開權限。</Text>
      {preferences.dislikedIds.includes(track.id)&&<Pressable accessibilityRole="button"
       accessibilityLabel="還原此張音檔卡的本裝置隱藏"
       onPress={()=>preferences.restoreHiddenTrack(track.id)}
       style={[styles.hiddenAction,{borderColor:t.border}]}>
       <Text style={[styles.backText,{color:t.palette.primary,fontSize:fontSize(14)}]}>還原此張卡片</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" accessibilityLabel="前往我的收藏管理隱藏設定"
       onPress={()=>router.push('/favorites')} style={[styles.hiddenAction,{borderColor:t.border}]}>
       <Text style={[styles.backText,{color:t.palette.primary,fontSize:fontSize(14)}]}>前往我的收藏管理隱藏設定</Text>
      </Pressable>
     </View>:<>
      {track.coverUrl&&origin&&<Image source={{uri:origin+track.coverUrl}} resizeMode="contain"
       accessibilityLabel={'封面：'+track.speaker} style={styles.photo}/>}
      <Text style={[styles.title,{color:t.palette.primary,fontSize:fontSize(23)}]}>{track.title}</Text>
      <View style={styles.row}>
       {splitSpeakerNames(track.speaker).map(name=><Pressable key={name} accessibilityRole="link"
        accessibilityLabel={'查看'+name+'的演講者資料'} onPress={()=>router.push({pathname:'/speaker/[name]',params:{name}})} style={styles.speaker}>
        <Text style={{color:t.palette.primary,fontWeight:'700'}}>{name} ›</Text>
       </Pressable>)}
      </View>
      {!!track.speakerRank&&(approvedRankLink?<Pressable accessibilityRole="link"
       accessibilityLabel={'篩選所有'+approvedRankLink+'講師已核准作品'}
       onPress={()=>router.push({pathname:'/',params:{rank:approvedRankLink}})}
       style={styles.rankLink}>
       <Text style={[styles.line,{color:t.palette.primary,fontSize:fontSize(14)}]}>講師獎銜：{track.speakerRank} ›</Text>
      </Pressable>:<Text style={[styles.line,{color:t.ink,fontSize:fontSize(14)}]}>講師獎銜：{track.speakerRank}</Text>)}
      <Text style={[styles.line,{color:t.muted,fontSize:fontSize(14)}]}>錄音長度：{track.durationSeconds>0?'約 '+Math.max(1,Math.round(track.durationSeconds/60))+' 分鐘':'時間待確認'}</Text>
      <View style={styles.row}>{track.categories.map(category=><Pressable key={category}
       accessibilityRole="link" accessibilityLabel={'瀏覽同分類已核准作品：'+category}
       onPress={()=>router.push({pathname:'/',params:{category}})}
       style={[styles.tag,{backgroundColor:t.lightPill,borderColor:t.border}]}>
        {category==='新人'
         ?<AnimatedNewcomerTag fill={t.lightPill} textColor={t.palette.primary}/>
         :<Text style={{color:t.palette.primary,fontSize:fontSize(13)}}>{category} ›</Text>}
       </Pressable>)}</View>
      <LegacyDetailSectionNavigation showPlayback={false} onJump={sections.jumpTo}/>
      <View onLayout={sections.onSectionLayout('notes')}>
       <LegacyLectureNotes track={track}/>
      </View>
      <View onLayout={sections.onSectionLayout('engagement')}>
       <LegacyEngagementDetail track={track}/>
      </View>
      <View onLayout={sections.onSectionLayout('device')}>
       <LegacyDetailDeviceActions track={track} routeId={id} source="preview"/>
      </View>
      <Text style={[styles.note,{color:t.muted,fontSize:fontSize(12)}]}>這張卡片僅展示演講資訊；錄音播放、分享、心得與評價尚未開放。</Text>
     </>}
   </View>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 page:{alignItems:'center',padding:12,paddingBottom:32},shell:{width:'100%',maxWidth:visualMetrics.contentMaxWidth},
 back:{minHeight:44,justifyContent:'center'},backText:{fontSize:14,fontWeight:'800'},
 card:{padding:16,borderWidth:1,borderRadius:21,gap:10},photo:{width:'100%',height:220,borderRadius:16},
 title:{fontSize:24,lineHeight:32,fontWeight:'900'},row:{flexDirection:'row',flexWrap:'wrap',gap:7,alignItems:'center'},
 speaker:{minHeight:44,justifyContent:'center'},rankLink:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'},line:{fontSize:13,lineHeight:22},tag:{minHeight:44,padding:8,borderRadius:12,borderWidth:1,justifyContent:'center'},
 statistics:{borderTopWidth:1,paddingTop:12,gap:6},section:{fontSize:15,fontWeight:'800'},
 note:{fontSize:12,lineHeight:20},
 hiddenNotice:{gap:12,paddingVertical:14},hiddenAction:{minHeight:44,borderWidth:1,borderRadius:12,padding:10,justifyContent:'center',alignSelf:'flex-start'}
});
