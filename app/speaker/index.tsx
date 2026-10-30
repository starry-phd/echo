import {useMemo,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {router} from 'expo-router';
import {ActivityIndicator,FlatList,Image,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {getApiBaseUrl,getPublicSpeakers,getGuestPreviewTracks} from '../../src/api/client';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {visualMetrics} from '../../packages/ui/src/tokens';
import {getCatalogDisplayState,hasPartialCatalogFailure} from '../../src/ui/echo/catalogDisplayState';
import {visibleSpeakerDirectory} from '../../src/ui/echo/visibleSpeakerDirectory';
import {filterApprovedSpeakerDirectory} from '../../src/ui/echo/approvedSpeakerSearch';
import {useDevicePreferences} from '../../src/ui/echo/DevicePreferences';

export default function SpeakerDirectory(){
 const t=useLegacyTheme();
 const [search,setSearch]=useState('');
 const {hiddenSpeakers,dislikedIds,ready}=useDevicePreferences();
 const q=useQuery({queryKey:['echo','public-speakers'],queryFn:({signal})=>getPublicSpeakers(signal),retry:1});
 const previews=useQuery({queryKey:['echo','guest-previews'],
  queryFn:({signal})=>getGuestPreviewTracks(signal),retry:1});
 const origin=getApiBaseUrl();
 const speakers=useMemo(()=>visibleSpeakerDirectory(
  q.data??[],previews.data??[],dislikedIds,hiddenSpeakers
 ),[q.data,previews.data,dislikedIds,hiddenSpeakers]);
 // Search operates on already-authorized and device-visible data only.
 const visibleSpeakers=useMemo(()=>filterApprovedSpeakerDirectory(speakers,search),[speakers,search]);
 const publicSource={pending:q.isPending,failed:q.isError,count:q.data?.length??0};
 const guestSource={pending:previews.isPending,failed:previews.isError,count:previews.data?.length??0};
 const display=getCatalogDisplayState(publicSource,guestSource,speakers.length);
 const partial=hasPartialCatalogFailure(publicSource,guestSource);
 const retry=()=>{void q.refetch();void previews.refetch();};
 return <View style={[styles.root,{backgroundColor:t.bg}]}>
  <View style={styles.heading}>
   <Text style={[styles.title,{color:t.ink}]}>講師作品</Text>
   <Text style={[styles.caption,{color:t.muted}]}>探索原版訪客可見的講者與作品資訊；播放仍依授權限制</Text>
   <View style={[styles.searchBox,{backgroundColor:t.card,borderColor:t.border}]}>
    <TextInput accessibilityLabel="搜尋已核准講師姓名" placeholder="搜尋講師姓名…"
     placeholderTextColor={t.muted} value={search} onChangeText={setSearch}
     autoCorrect={false} autoCapitalize="none" maxLength={80} returnKeyType="search"
     style={[styles.searchInput,{color:t.ink}]}/>
    {search.length>0&&<Pressable accessibilityRole="button" accessibilityLabel="清除講師搜尋"
     onPress={()=>setSearch('')} style={styles.clearSearch}>
     <Text style={[styles.clearText,{color:t.palette.primary}]}>✕ 清除</Text>
    </Pressable>}
   </View>
   {ready&&(display==='ready'||display==='empty')&&<Text style={[styles.searchCount,{color:t.muted}]}>
    目前符合條件的講師 {visibleSpeakers.length} 位（僅搜尋已核准展示資料）
   </Text>}
  </View>
  {partial&&display!=='failed'&&<View style={[styles.warning,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.notice,{color:t.ink}]}>部分講師資料暫時無法更新，以下僅顯示成功讀取的作品。</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="重新載入講師資料" onPress={retry} style={styles.retry}>
     <Text style={[styles.retryText,{color:t.palette.primary}]}>重新讀取</Text>
    </Pressable>
   </View>}
  {(!ready||display==='loading')?<ActivityIndicator color={t.palette.primary} style={styles.loading}/>:
   display==='failed'?<View style={[styles.warning,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.notice,{color:t.muted}]}>講師資料暫時無法完整讀取，並非沒有講師作品。</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="重新載入講師資料" onPress={retry} style={styles.retry}>
     <Text style={[styles.retryText,{color:t.palette.primary}]}>重試載入</Text>
    </Pressable>
   </View>:
   <FlatList data={visibleSpeakers} keyExtractor={s=>s.name} style={styles.list}
    contentContainerStyle={styles.listContent}
    ListEmptyComponent={<View style={[styles.empty,{backgroundColor:t.card,borderColor:t.border}]}>
     <Text style={[styles.emptyText,{color:t.muted}]}>{speakers.length>0&&search.trim()?'查無符合搜尋的已核准講師，請調整姓名或清除搜尋。':'目前沒有可瀏覽的講師作品資訊。'}</Text>
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
 searchBox:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:14,minHeight:48,marginTop:12,paddingHorizontal:10},
 searchInput:{flex:1,minHeight:44,paddingVertical:8,fontSize:15},
 clearSearch:{minHeight:44,justifyContent:'center',paddingHorizontal:8},
 clearText:{fontSize:13,fontWeight:'800'},searchCount:{fontSize:12,marginTop:7},
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
 loading:{marginTop:40},
 warning:{borderWidth:1,borderRadius:14,padding:10,marginHorizontal:12,marginBottom:12,gap:5},
 notice:{fontSize:13,lineHeight:21,marginVertical:5},
 retry:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',paddingHorizontal:8},
 retryText:{fontWeight:'900',fontSize:13},
 empty:{borderWidth:1,borderStyle:'dashed',borderRadius:21,minHeight:150,alignItems:'center',justifyContent:'center',padding:20},
 emptyText:{textAlign:'center',fontSize:13,lineHeight:20}
});
