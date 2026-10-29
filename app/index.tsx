import {useEffect,useMemo,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {router} from 'expo-router';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useViewportDimensions} from '../src/ui/useViewportDimensions';
import {getCategories,getEchoHealth,getPublicTracks,getGuestPreviewTracks} from '../src/api/client';
import {describeEmptyPublicCatalog} from '../src/ui/echo/migrationPresentation';
import {LegacyFilterToolbar} from '../src/ui/echo/LegacyFilterToolbar';
import type {SortOrder} from '../src/ui/echo/LegacyFilterToolbar';
import {LegacyTrackCard} from '../src/ui/echo/LegacyTrackCard';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {visualMetrics} from '../packages/ui/src/tokens';
import {viewportLayout} from '../src/ui/responsive';
import {sortEchoCards} from '../src/ui/echo/cardSorting';
import {baseSpeakerRank,matchesCardFilters} from '../src/ui/echo/cardFilters';
import {useDevicePreferences} from '../src/ui/echo/DevicePreferences';
import {AdvancedCardFilters} from '../src/ui/echo/AdvancedCardFilters';

/**
 * Home layout follows yukidu/Echo-Starry v141/v145:
 * rose logo in navigation, lucky-answer button beside a rose search field,
 * four buttons for category/time/popular/advanced, visitor teaser,
 * and a one/two-column image-led audio card grid. This is NOT a redesign.
 */
export default function CatalogScreen(){
 const theme=useLegacyTheme();
 const {width}=useViewportDimensions();
 const [query,setQuery]=useState('');
 const [debouncedQuery,setDebouncedQuery]=useState('');
 const [category,setCategory]=useState<string|null>(null);
 const [order,setOrder]=useState<SortOrder>('newest');
 const [notice,setNotice]=useState('');
 const [advanced,setAdvanced]=useState(false);
 const [speakerRank,setSpeakerRank]=useState<string|null>(null);
 const {dislikedIds,dislike,restoreHidden,storageError,ready}=useDevicePreferences();
 const dislikeTrack=(id:string)=>{
  dislike(id);
  setNotice('已在此裝置隱藏這張音檔卡；可點「還原隱藏」恢復。');
 };
 const restoreDisliked=()=>{
  restoreHidden();
  setNotice('已還原此裝置隱藏的音檔卡。');
 };
 useEffect(()=>{
   const timer=setTimeout(()=>setDebouncedQuery(query),250);
   return ()=>clearTimeout(timer);
 },[query]);
 const tracksQuery=useQuery({
   queryKey:['echo','public-tracks',debouncedQuery,category],
   queryFn:({signal})=>getPublicTracks(signal,{
     query:debouncedQuery,category:category??undefined,
   }),
   retry:1,
 });
 const previewsQuery=useQuery({
   queryKey:['echo','guest-previews'],
   queryFn:({signal})=>getGuestPreviewTracks(signal),retry:1,
 });
 const healthQuery=useQuery({
   queryKey:['echo','public-health'],
   queryFn:({signal})=>getEchoHealth(signal),retry:1,staleTime:30_000,
 });
 const categoriesQuery=useQuery({
   queryKey:['echo','categories'],
   queryFn:({signal})=>getCategories(signal),retry:1,
 });
 const tracks=useMemo(()=>sortEchoCards([
   ...(tracksQuery.data??[]),...(previewsQuery.data??[])
 ],order),[tracksQuery.data,previewsQuery.data,order]);
 const visibleTracks=useMemo(()=>tracks.filter(t=>!dislikedIds.includes(t.id)&&matchesCardFilters(t,{
  query:debouncedQuery,category,speakerRank
 })),[tracks,dislikedIds,debouncedQuery,category,speakerRank]);
 const ranks=useMemo(()=>[...new Set((previewsQuery.data??[]).map(t=>baseSpeakerRank(t.speakerRank??'')).filter(Boolean))].sort(),[previewsQuery.data]);
 const categories=useMemo(()=>[...new Set([
   ...(categoriesQuery.data??[]),
   ...(previewsQuery.data??[]).flatMap(t=>t.categories)
 ])],[categoriesQuery.data,previewsQuery.data]);
 const emptyCopy=describeEmptyPublicCatalog(healthQuery.data?.legacyMediaMigration,Boolean(query.trim()||category||speakerRank));
 const layout=viewportLayout(width);
 const twoColumns=layout.columns===2;
 const draw=()=>{
   const playable=visibleTracks.filter(t=>t.playable);
   if(!playable.length){
     setNotice('資訊卡已恢復，但目前沒有完成播放授權的音檔。');
     return;
   }
   const selected=playable[Math.floor(Math.random()*playable.length)];
   router.push({pathname:'/track/[id]',params:{id:selected.id}});
 };
 return <ScrollView style={[styles.page,{backgroundColor:theme.bg}]}
   contentContainerStyle={[styles.pageContent,{paddingHorizontal:layout.horizontalGutter}]} keyboardShouldPersistTaps="handled">
   <View style={styles.shell}>
     <View style={styles.searchRow}>
       <Pressable accessibilityRole="button" accessibilityLabel="召喚繁星解答"
         onPress={draw}
         style={[styles.lucky,{backgroundColor:theme.palette.primary,width:layout.luckyWidth}]}>
         <Text numberOfLines={2} style={styles.luckyText}>💫召喚繁星解答</Text>
       </Pressable>
       <View style={[styles.search,{backgroundColor:theme.palette.primary}]}>
         <Text style={styles.searchIcon}>⌕</Text>
         <TextInput
           accessibilityLabel="搜尋演講者、主題、分類或獎銜"
           placeholder={layout.phone?'搜尋演講者、主題、分類...':'搜尋演講者、主題、分類或獎銜...'}
           placeholderTextColor="rgba(255,255,255,.75)"
           style={styles.input} value={query} onChangeText={setQuery}
           maxLength={100} returnKeyType="search" autoCapitalize="none"/>
         {query.length>0&&<Pressable accessibilityRole="button" accessibilityLabel="清除搜尋"
           onPress={()=>setQuery('')} style={styles.clear}>
           <Text style={styles.clearText}>✕</Text>
         </Pressable>}
       </View>
     </View>
     <Pressable accessibilityRole="button"
       accessibilityState={{expanded:advanced}}
       onPress={()=>setAdvanced(value=>!value)}
       style={styles.advancedHint}>
       <Text style={[styles.advancedHintText,{color:'#b47a08'}]}>
         按此 {advanced?'▲收起':'▼展開'} 進階篩選{speakerRank?'（已套用）':''}
       </Text>
     </Pressable>
     {advanced&&<AdvancedCardFilters ranks={ranks} selectedRank={speakerRank} onRank={setSpeakerRank}/>}
     <LegacyFilterToolbar categories={categories} category={category}
       onCategory={setCategory} order={order} onOrder={setOrder} onNotice={setNotice}
       advanced={advanced} onAdvanced={()=>setAdvanced(value=>!value)}/>
     <View style={[styles.teaser,{borderColor:theme.palette.primary,
       backgroundColor:theme.dark?'#292030':'#fbeaf0'}]}>
       <Text style={[styles.teaserText,{color:theme.ink}]}>
         訪客可瀏覽 <Text style={[styles.teaserCount,{color:theme.palette.primary}]}>{visibleTracks.length}</Text> 張音檔資訊卡；目前條件可播放 {visibleTracks.filter(t=>t.playable).length} 部
       </Text>
       <Pressable accessibilityRole="button" onPress={()=>router.push('/profile')}
         style={styles.teaserButton}>
         <Text style={[styles.teaserLink,{color:theme.palette.primary}]}>查看會員整合進度 →</Text>
       </Pressable>
       <Text style={[styles.teaserNote,{color:theme.muted}]}>
         資訊卡不代表播放授權；私人音檔與會員功能仍受保護。
       </Text>
     </View>
     {(query.trim()||category||speakerRank)&&<Pressable accessibilityRole="button" accessibilityLabel="清除全部篩選"
      onPress={()=>{setQuery('');setCategory(null);setSpeakerRank(null);}} style={styles.restore}>
      <Text style={[styles.restoreText,{color:theme.palette.primary}]}>清除全部篩選</Text>
     </Pressable>}
     {storageError&&<Text style={[styles.teaserNote,{color:theme.muted}]}>裝置儲存暫時不可用，這次變更僅在目前使用期間保留。</Text>}
     {dislikedIds.length>0&&<Pressable
       accessibilityRole="button" accessibilityLabel="還原本裝置隱藏的音檔卡"
       disabled={!ready} onPress={restoreDisliked} style={[styles.restore,{borderColor:theme.border,backgroundColor:theme.card}]}>
        <Text style={[styles.restoreText,{color:theme.palette.primary}]}>
         還原隱藏（本裝置 {dislikedIds.length} 張）
        </Text>
       </Pressable>}
     {notice.length>0&&<View style={[styles.notice,{borderColor:theme.palette.primary,borderWidth:1,
       backgroundColor:theme.card}]}>
       <Text style={[styles.noticeText,{color:theme.ink}]}>{notice}</Text>
       <Pressable accessibilityRole="button" accessibilityLabel="關閉提醒"
         onPress={()=>setNotice('')}><Text style={{color:theme.palette.primary,fontWeight:'900'}}>✕</Text></Pressable>
     </View>}
     {(tracksQuery.isPending||previewsQuery.isPending)?<View style={styles.loading}>
       <ActivityIndicator color={theme.palette.primary} size="large"/>
       <Text style={[styles.loadingText,{color:theme.muted}]}>讀取音檔清單中…</Text>
     </View>:(tracksQuery.isError&&previewsQuery.isError)?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.card}]}>
       <Text style={[styles.emptyText,{color:theme.muted}]}>
         暫時無法取得公開音檔清單，請稍後重試。
       </Text>
       <Pressable onPress={()=>{void tracksQuery.refetch();void previewsQuery.refetch();}} style={[styles.retry,{backgroundColor:theme.palette.primary}]}>
         <Text style={styles.retryText}>重新載入</Text>
       </Pressable>
     </View>:visibleTracks.length===0?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.card}]}>
       <Text style={[styles.emptyText,{color:theme.muted}]}>
         {emptyCopy.title}
       </Text>
       <Text style={[styles.emptyExplanation,{color:theme.muted}]}>
         {emptyCopy.detail}
       </Text>
     </View>:<View style={styles.cardGrid}>
       {visibleTracks.map(track=><View key={track.id} style={[styles.cardCell,
         {width:twoColumns?'49%':'100%'}]}>
         <LegacyTrackCard track={track} onNotice={setNotice} onDislike={dislikeTrack}/>
       </View>)}
     </View>}
     <View style={styles.footer}>
       <Text style={[styles.footerText,{color:theme.muted}]}>
         繁星回聲 · 訪客資訊卡（唯讀）　│　播放須另經授權　│　廣告關閉
       </Text>
     </View>
   </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 page:{flex:1},
 pageContent:{flexGrow:1,alignItems:'center',paddingHorizontal:12,paddingBottom:38},
 shell:{maxWidth:visualMetrics.contentMaxWidth,width:'100%',paddingTop:14},
 searchRow:{flexDirection:'row',gap:9,alignItems:'stretch',minHeight:visualMetrics.searchHeight},
 lucky:{borderRadius:17,minHeight:50,alignItems:'center',justifyContent:'center',
   paddingHorizontal:6,shadowColor:'#c13f6f',shadowOpacity:.2,shadowRadius:12,elevation:3},
 luckyText:{fontSize:12,fontWeight:'900',textAlign:'center',color:'#fff'},
 search:{flex:1,minWidth:120,borderRadius:17,flexDirection:'row',alignItems:'center',
   paddingHorizontal:10,shadowColor:'#c13f6f',shadowOpacity:.15,shadowRadius:12,elevation:2},
 searchIcon:{color:'#fff',fontSize:25,marginRight:4},
 input:{color:'#fff',fontSize:13,flex:1,paddingVertical:9,minWidth:0},
 clear:{padding:7},clearText:{color:'#fff',fontWeight:'900'},
 advancedHint:{marginTop:10,paddingVertical:7,paddingHorizontal:3},
 advancedHintText:{fontSize:13,fontWeight:'800'},
 teaser:{marginTop:9,marginBottom:10,borderRadius:23,padding:14,borderWidth:1,alignItems:'center',
   shadowColor:'#c13f6f',shadowOpacity:.12,shadowRadius:16,elevation:1},
 teaserText:{fontSize:14,fontWeight:'800',textAlign:'center'},
 teaserCount:{fontSize:20,fontWeight:'900'},
 teaserButton:{marginTop:8,paddingVertical:5,paddingHorizontal:12},
 teaserLink:{fontSize:15,fontWeight:'900',textAlign:'center'},
 teaserNote:{fontSize:11,textAlign:'center',marginTop:3,lineHeight:17},
 notice:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:13,
   borderRadius:14,marginVertical:8,gap:10},noticeText:{fontSize:13,flex:1,lineHeight:20},
 cardGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',paddingTop:5},
 cardCell:{minWidth:0},
 empty:{marginTop:8,borderRadius:24,borderWidth:1,borderStyle:'dashed',
   minHeight:170,justifyContent:'center',alignItems:'center',padding:25},
 emptyText:{fontSize:14,fontWeight:'700',textAlign:'center'},
 emptyExplanation:{fontSize:12,marginTop:10,lineHeight:20,textAlign:'center'},
 loading:{paddingVertical:48,alignItems:'center',gap:10},
 loadingText:{fontSize:13},
 retry:{paddingVertical:10,paddingHorizontal:19,borderRadius:12,marginTop:14},
 retryText:{fontSize:13,color:'#fff',fontWeight:'900'},
 restore:{marginTop:6,padding:10,borderWidth:1,borderRadius:12,alignItems:'center'},
 restoreText:{fontSize:12,fontWeight:'700'},
 footer:{paddingTop:18,alignItems:'center'},footerText:{fontSize:11}
});
