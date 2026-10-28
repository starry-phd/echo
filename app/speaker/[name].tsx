import {router,useLocalSearchParams} from 'expo-router';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getPublicTracks} from '../../src/api/client';
import {LegacyTrackCard} from '../../src/ui/echo/LegacyTrackCard';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {visualMetrics} from '../../packages/ui/src/tokens';
export default function PublicSpeakerTracks(){
 const t=useLegacyTheme();
 const {name}=useLocalSearchParams<{name:string}>();
 const speaker=typeof name==='string'&&name.length>0&&name.length<=80?name:null;
 const q=useQuery({
  queryKey:['echo','public-speaker-recordings',speaker],
  queryFn:({signal})=>getPublicTracks(signal,{speaker:speaker!}),enabled:Boolean(speaker),retry:1,
 });
 return <ScrollView style={[styles.root,{backgroundColor:t.bg}]} contentContainerStyle={styles.content}>
  <View style={styles.shell}>
   <Pressable accessibilityRole="button" onPress={()=>router.push('/speaker')} style={styles.back}>
    <Text style={[styles.backText,{color:t.palette.primary}]}>‹ 返回講師列表</Text>
   </Pressable>
   <View style={[styles.bio,{backgroundColor:t.card,borderColor:t.border}]}>
    <View style={[styles.avatar,{backgroundColor:t.lightPill}]}>
     <Text style={[styles.initial,{color:t.palette.primary}]}>{Array.from(speaker??'♪')[0]??'♪'}</Text>
    </View>
    <View style={styles.bioText}>
     <Text style={[styles.title,{color:t.ink}]}>{speaker??'無效的講師名稱'}</Text>
     <Text style={[styles.note,{color:t.muted}]}>已驗證的公開演講作品</Text>
    </View>
   </View>
   <Text style={[styles.section,{color:t.ink}]}>演講音檔</Text>
   {!speaker?<Text style={[styles.message,{color:t.muted}]}>講師連結不正確。</Text>:
    q.isPending?<ActivityIndicator color={t.palette.primary}/>:
    q.isError?<Text style={[styles.message,{color:t.muted}]}>讀取暫時失敗，請稍後再試。</Text>:
    q.data?.length? q.data.map(track=><LegacyTrackCard key={track.id} track={track}
      onNotice={()=>{router.push({pathname:'/track/[id]',params:{id:track.id}});}}/>):
    <View style={[styles.empty,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.message,{color:t.muted}]}>目前沒有可以公開的音檔。</Text>
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
 avatar:{width:72,height:72,borderRadius:19,justifyContent:'center',alignItems:'center'},
 initial:{fontSize:32,fontWeight:'900'},
 bioText:{flex:1},title:{fontSize:22,fontWeight:'900'},
 note:{fontSize:12,marginTop:8},section:{fontSize:18,fontWeight:'900',marginVertical:18},
 empty:{borderWidth:1,borderStyle:'dashed',borderRadius:19,minHeight:130,alignItems:'center',justifyContent:'center'},
 message:{fontSize:13,textAlign:'center',lineHeight:22,padding:10},
 disclaimer:{fontSize:11,lineHeight:18,marginTop:12,textAlign:'center'}
});
