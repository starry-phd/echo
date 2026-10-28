import {useQuery} from '@tanstack/react-query';
import {router} from 'expo-router';
import {ActivityIndicator,FlatList,Pressable,SafeAreaView,StyleSheet,Text,View} from 'react-native';
import {getPublicSpeakers} from '../../src/api/client';
import {palette} from '../../src/theme';

/** Minimal migrated speaker browser; no unverified legacy biographies or membership data. */
export default function SpeakerDirectory(){
 const q=useQuery({queryKey:['echo','public-speakers'],queryFn:({signal})=>getPublicSpeakers(signal),retry:1});
 return <SafeAreaView style={styles.root}>
  <Text style={styles.title}>講師作品</Text>
  <Text style={styles.note}>只列出已有公開授權、完成驗證的音檔講師。</Text>
  {q.isPending?<ActivityIndicator color={palette.brand}/>:
    q.isError?<Text style={styles.note}>讀取暫時失敗，請稍後再試。</Text>:
    <FlatList data={q.data} keyExtractor={s=>s.name} contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.note}>目前尚無已驗證公開的講師作品。</Text>}
      renderItem={({item})=><Pressable accessibilityRole="button" style={styles.item}
        onPress={()=>router.push({pathname:'/speaker/[name]',params:{name:item.name}})}>
        <View><Text style={styles.name}>{item.name}</Text><Text style={styles.count}>公開音檔 {item.trackCount} 筆</Text></View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>}/>}
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:palette.paper},
 title:{fontSize:24,fontWeight:'800',color:palette.ink,margin:20,marginBottom:10},
 note:{color:palette.muted,marginHorizontal:20,marginBottom:16,lineHeight:22},
 list:{paddingHorizontal:20,paddingBottom:28},
 item:{borderRadius:16,marginBottom:10,padding:18,backgroundColor:palette.white,
  flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 name:{fontSize:17,fontWeight:'700',color:palette.ink},
 count:{color:palette.muted,marginTop:7},
 arrow:{fontSize:26,color:palette.brand}
});
