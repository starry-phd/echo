import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {router} from 'expo-router';
import {ActivityIndicator,FlatList,Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {getApiBaseUrl,getPublicSpeakers,getGuestPreviewTracks} from '../../src/api/client';
import {splitSpeakerNames} from '../../src/ui/echo/speakerNames';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {visualMetrics} from '../../packages/ui/src/tokens';

export default function SpeakerDirectory(){
 const t=useLegacyTheme();
 const q=useQuery({queryKey:['echo','public-speakers'],queryFn:({signal})=>getPublicSpeakers(signal),retry:1});
 const previews=useQuery({queryKey:['echo','speaker-preview-list'],
  queryFn:({signal})=>getGuestPreviewTracks(signal),retry:1});
 const origin=getApiBaseUrl();
 const speakers=useMemo(()=>{
  const found=new Map<string,{name:string;trackCount:number;coverUrl:string|null}>();
  for(const entry of q.data??[]){
   for(const name of splitSpeakerNames(entry.name)){
    const prev=found.get(name);
    found.set(name,{name,trackCount:(prev?.trackCount||0)+entry.trackCount,coverUrl:prev?.coverUrl||null});
   }
  }
  for(const track of previews.data??[]){
   for(const name of splitSpeakerNames(track.speaker)){
    const prev=found.get(name);
    found.set(name,{name,trackCount:(prev?.trackCount||0)+1,
     coverUrl:prev?.coverUrl||track.coverUrl||null});
   }
  }
  return [...found.values()].sort((a,b)=>b.trackCount-a.trackCount||a.name.localeCompare(b.name));
 },[q.data,previews.data]);
 return <View style={[styles.root,{backgroundColor:t.bg}]}>
  <View style={styles.heading}>
   <Text style={[styles.title,{color:t.ink}]}>講師作品</Text>
   <Text style={[styles.caption,{color:t.muted}]}>探索原版訪客可見的講者與作品資訊；播放仍依授權限制</Text>
  </View>
  {(q.isPending||previews.isPending)?<ActivityIndicator color={t.palette.primary} style={styles.loading}/>:
   (q.isError&&previews.isError)?<Text style={[styles.notice,{color:t.muted}]}>讀取暫時失敗，請稍後再試。</Text>:
   <FlatList data={speakers} keyExtractor={s=>s.name} style={styles.list}
    contentContainerStyle={styles.listContent}
    ListEmptyComponent={<View style={[styles.empty,{backgroundColor:t.card,borderColor:t.border}]}>
     <Text style={[styles.emptyText,{color:t.muted}]}>目前沒有可瀏覽的講師作品資訊。</Text>
    </View>}
    renderItem={({item})=><Pressable accessibilityRole="button"
     onPress={()=>router.push({pathname:'/speaker/[name]',params:{name:item.name}})}
     style={[styles.speakerCard,{backgroundColor:t.card,borderColor:t.border}]}>
     <View style={[styles.avatar,{backgroundColor:t.lightPill}]}>
      {item.coverUrl&&origin?<Image source={{uri:origin+item.coverUrl}} resizeMode="cover"
       accessibilityLabel={'原版講者封面：'+item.name} style={styles.photo}/>:
       <Text style={[styles.initial,{color:t.palette.primary}]}>{Array.from(item.name)[0]??'♪'}</Text>}
     </View>
     <View style={styles.info}>
      <Text style={[styles.name,{color:t.ink}]}>{item.name}</Text>
      <Text style={[styles.count,{color:t.muted}]}>已收錄作品 {item.trackCount} 筆（含尚未開放播放的資訊卡）</Text>
     </View>
     <Text style={[styles.arrow,{color:t.palette.primary}]}>›</Text>
    </Pressable>}/>
  }
 </View>;
}
const styles=StyleSheet.create({
 root:{flex:1},
 heading:{maxWidth:visualMetrics.contentMaxWidth,alignSelf:'center',width:'100%',paddingHorizontal:15,paddingTop:19,paddingBottom:13},
 title:{fontSize:23,fontWeight:'900'},
 caption:{fontSize:12,marginTop:7,lineHeight:18},
 list:{flex:1,width:'100%'},
 listContent:{maxWidth:visualMetrics.contentMaxWidth,width:'100%',alignSelf:'center',
  paddingHorizontal:12,paddingBottom:30},
 speakerCard:{borderWidth:1,borderRadius:19,marginBottom:9,padding:12,minHeight:80,
  flexDirection:'row',alignItems:'center',gap:12},
 avatar:{width:56,height:56,borderRadius:17,alignItems:'center',justifyContent:'center',overflow:'hidden'},
 photo:{width:56,height:56},
 initial:{fontSize:23,fontWeight:'800'},info:{flex:1},
 name:{fontSize:16,fontWeight:'900'},count:{fontSize:12,marginTop:5},
 arrow:{fontSize:28,fontWeight:'400'},
 loading:{marginTop:40},notice:{fontSize:13,margin:20},
 empty:{borderWidth:1,borderStyle:'dashed',borderRadius:21,minHeight:150,alignItems:'center',justifyContent:'center',padding:20},
 emptyText:{textAlign:'center',fontSize:13,lineHeight:20}
});
