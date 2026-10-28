import {useLocalSearchParams,router} from 'expo-router';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,FlatList,Pressable,SafeAreaView,StyleSheet,Text,View} from 'react-native';
import {getPublicTracks} from '../../src/api/client';
import {palette} from '../../src/theme';

export default function PublicSpeakerTracks(){
 const {name}=useLocalSearchParams<{name:string}>();
 const speaker=typeof name==='string'&&name.length<=80?name:null;
 const q=useQuery({
  queryKey:['echo','public-speaker-recordings',speaker],
  queryFn:({signal})=>getPublicTracks(signal,{speaker:speaker!}),
  enabled:Boolean(speaker),retry:1,
 });
 return <SafeAreaView style={styles.root}>
  <Text style={styles.title}>{speaker||'無效講師名稱'}</Text>
  <Text style={styles.note}>僅顯示已公開並完成媒體驗證的作品，不包含未核准的舊版講師簡介或 AI 問答。</Text>
  {!speaker?<Text style={styles.note}>講師連結不正確。</Text>:
   q.isPending?<ActivityIndicator color={palette.brand}/>:
   q.isError?<Text style={styles.note}>讀取暫時失敗，請稍後再試。</Text>:
    <FlatList data={q.data} keyExtractor={t=>t.id} contentContainerStyle={styles.list}
     ListEmptyComponent={<Text style={styles.note}>目前沒有可以公開的音檔。</Text>}
     renderItem={({item})=><Pressable style={styles.item}
      onPress={()=>router.push({pathname:'/track/[id]',params:{id:item.id}})}>
      <Text style={styles.track}>{item.title}</Text>
      <Text style={styles.meta}>{Math.round(item.durationSeconds/60)} 分鐘</Text>
     </Pressable>}/>}
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:palette.paper},
 title:{fontSize:24,fontWeight:'800',color:palette.ink,margin:20,marginBottom:8},
 note:{color:palette.muted,lineHeight:22,marginHorizontal:20,marginBottom:16},
 list:{paddingHorizontal:20,paddingBottom:32},
 item:{padding:20,marginBottom:10,borderRadius:16,backgroundColor:palette.white},
 track:{fontSize:17,color:palette.ink,fontWeight:'700'},
 meta:{color:palette.muted,marginTop:8}
});
