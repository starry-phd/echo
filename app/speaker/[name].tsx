import {useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Image,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getApiBaseUrl,getPublicTracks,getGuestPreviewTracks} from '../../src/api/client';
import {splitSpeakerNames} from '../../src/ui/echo/speakerNames';
import {LegacyTrackCard} from '../../src/ui/echo/LegacyTrackCard';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {visualMetrics} from '../../packages/ui/src/tokens';
import {useDevicePreferences} from '../../src/ui/echo/DevicePreferences';
import {getCatalogDisplayState,hasPartialCatalogFailure} from '../../src/ui/echo/catalogDisplayState';
import {isSpeakerHidden} from '../../src/ui/echo/hiddenSpeakers';
import {authorizedSpeakerProfileTracks,publicSpeakerRouteName} from '../../src/ui/echo/authorizedSpeakerProfile';
import {mergeAuthorizedCards} from '../../src/ui/echo/mergeAuthorizedCards';
export default function PublicSpeakerTracks(){
 const t=useLegacyTheme();
 const [notice,setNotice]=useState('');
 const {dislikedIds,hiddenSpeakers,ready,dislike,restoreHidden}=useDevicePreferences();
 const hide=(id:string)=>{
  dislike(id);
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
  queryFn:({signal})=>getPublicTracks(signal,{speaker:speaker!}),enabled:Boolean(speaker),retry:1,
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
 return <ScrollView style={[styles.root,{backgroundColor:t.bg}]} contentContainerStyle={styles.content}>
  <View style={styles.shell}>
   <Pressable accessibilityRole="button" onPress={()=>router.push('/speaker')} style={styles.back}>
    <Text style={[styles.backText,{color:t.palette.primary}]}>‹ 返回講師列表</Text>
   </Pressable>
   {showBio&&<View style={[styles.bio,{backgroundColor:t.card,borderColor:t.border}]}>
    <View style={[styles.avatar,{backgroundColor:t.lightPill}]}>
     {photo&&origin?<Image source={{uri:origin+photo}} resizeMode="cover"
      style={styles.photo} accessibilityLabel={'原版講者封面：'+speaker}/>:
      <Text style={[styles.initial,{color:t.palette.primary}]}>{Array.from(speaker??'♪')[0]??'♪'}</Text>}
    </View>
    <View style={styles.bioText}>
     <Text style={[styles.title,{color:t.ink}]}>{speaker??'無效的講師名稱'}</Text>
     <Text style={[styles.note,{color:t.muted}]}>原版可瀏覽作品；播放須另行授權</Text>
    </View>
   </View>}
   <Text style={[styles.section,{color:t.ink}]}>演講音檔</Text>
   {speakerHidden&&<Pressable accessibilityRole="button" onPress={()=>router.push('/favorites')} style={styles.back}>
    <Text style={[styles.backText,{color:t.palette.primary}]}>此演講者已在本裝置隱藏，前往收藏頁管理</Text>
   </Pressable>}
   {notice.length>0&&<Text style={[styles.message,{color:t.palette.primary}]}>{notice}</Text>}
   {dislikedIds.length>0&&<Pressable accessibilityRole="button" onPress={()=>{
    restoreHidden();setNotice('已還原此裝置隱藏的卡片。');
   }}><Text style={[styles.backText,{color:t.palette.primary}]}>還原隱藏（{dislikedIds.length} 張）</Text></Pressable>}
   {!!speaker&&partial&&display!=='failed'&&<View style={[styles.warning,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.message,{color:t.muted}]}>部分講師作品暫時無法讀取，目前只顯示成功取得的資料。</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="重新載入講師作品" onPress={retry} style={styles.retry}>
      <Text style={[styles.backText,{color:t.palette.primary}]}>重新讀取</Text>
     </Pressable>
    </View>}
   {!speaker?<Text style={[styles.message,{color:t.muted}]}>講師連結不正確。</Text>:
    (!ready||display==='loading')?<ActivityIndicator color={t.palette.primary}/>:
    display==='failed'?<View style={[styles.warning,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.message,{color:t.muted}]}>講師作品資料暫時無法完整載入，並非沒有作品。</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="重新載入講師作品" onPress={retry} style={styles.retry}>
      <Text style={[styles.backText,{color:t.palette.primary}]}>重試載入</Text>
     </Pressable>
    </View>:
    display==='ready'? visibleTracks.map(track=><LegacyTrackCard key={track.id} track={track}
      onNotice={setNotice} onDislike={hide}/>):
    <View style={[styles.empty,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.message,{color:t.muted}]}>目前沒有可瀏覽的講者作品資訊。</Text>
    </View>}
   <Text style={[styles.disclaimer,{color:t.muted}]}>
    舊版講師簡介、AI 問答及會員權限資料尚待授權驗證，因此暫不顯示。
   </Text>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1},content:{paddingHorizontal:12,paddingBottom:32,alignItems:'center'},
 shell:{maxWidth:visualMetrics.contentMaxWidth,width:'100%',paddingTop:10},
 back:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',paddingHorizontal:5},
 backText:{fontSize:14,fontWeight:'800'},
 bio:{borderWidth:1,borderRadius:20,padding:15,flexDirection:'row',alignItems:'center',gap:12,minHeight:106},
 avatar:{width:72,height:72,borderRadius:19,justifyContent:'center',alignItems:'center',overflow:'hidden'},
 photo:{width:72,height:72},
 initial:{fontSize:32,fontWeight:'900'},
 bioText:{flex:1},title:{fontSize:22,fontWeight:'900'},
 note:{fontSize:12,marginTop:8},section:{fontSize:18,fontWeight:'900',marginVertical:18},
 warning:{borderWidth:1,borderRadius:14,padding:8,marginBottom:10},
 retry:{minHeight:44,justifyContent:'center',alignSelf:'flex-start',paddingHorizontal:10},
 empty:{borderWidth:1,borderStyle:'dashed',borderRadius:19,minHeight:130,alignItems:'center',justifyContent:'center'},
 message:{fontSize:13,textAlign:'center',lineHeight:22,padding:10},
 disclaimer:{fontSize:11,lineHeight:18,marginTop:12,textAlign:'center'}
});
