import {useEffect,useMemo,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {router} from 'expo-router';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,useWindowDimensions,View} from 'react-native';
import {getCategories,getEchoHealth,getPublicTracks} from '../src/api/client';
import {describeEmptyPublicCatalog} from '../src/ui/echo/migrationPresentation';
import {LegacyFilterToolbar} from '../src/ui/echo/LegacyFilterToolbar';
import type {SortOrder} from '../src/ui/echo/LegacyFilterToolbar';
import {LegacyTrackCard} from '../src/ui/echo/LegacyTrackCard';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {visualMetrics} from '../packages/ui/src/tokens';
import {viewportLayout} from '../src/ui/responsive';

/**
 * Home layout follows yukidu/Echo-Starry v141/v145:
 * rose logo in navigation, lucky-answer button beside a rose search field,
 * four buttons for category/time/popular/advanced, visitor teaser,
 * and a one/two-column image-led audio card grid. This is NOT a redesign.
 */
export default function CatalogScreen(){
 const theme=useLegacyTheme();
 const {width}=useWindowDimensions();
 const [query,setQuery]=useState('');
 const [debouncedQuery,setDebouncedQuery]=useState('');
 const [category,setCategory]=useState<string|null>(null);
 const [order,setOrder]=useState<SortOrder>('newest');
 const [notice,setNotice]=useState('');
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
 const healthQuery=useQuery({
   queryKey:['echo','public-health'],
   queryFn:({signal})=>getEchoHealth(signal),retry:1,staleTime:30_000,
 });
 const categoriesQuery=useQuery({
   queryKey:['echo','categories'],
   queryFn:({signal})=>getCategories(signal),retry:1,
 });
 const tracks=useMemo(()=>{
   const items=tracksQuery.data??[];
   return order==='oldest'?[...items].reverse():items;
 },[tracksQuery.data,order]);
 const categories=categoriesQuery.data??[];
 const emptyCopy=describeEmptyPublicCatalog(healthQuery.data?.legacyMediaMigration,Boolean(query.trim()||category));
 const layout=viewportLayout(width);
 const twoColumns=layout.columns===2;
 const draw=()=>{
   if(!tracks.length){
     setNotice('目前沒有完成公開驗證的音檔，尚無法召喚繁星解答。');
     return;
   }
   const selected=tracks[Math.floor(Math.random()*tracks.length)];
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
           accessibilityLabel="搜尋演講者、主題、系列或網友關鍵字"
           placeholder={layout.phone?'搜尋演講者、主題、關鍵字...':'搜尋演講者、主題、系列或網友關鍵字...'}
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
       accessibilityState={{expanded:false}}
       onPress={()=>setNotice('進階關鍵字、獎銜與網友詞庫需由舊資料與中央會員權限驗證後才能開放。')}
       style={styles.advancedHint}>
       <Text style={[styles.advancedHintText,{color:'#b47a08'}]}>
         按此 ▼展開 進階篩選
       </Text>
     </Pressable>
     <LegacyFilterToolbar categories={categories} category={category}
       onCategory={setCategory} order={order} onOrder={setOrder} onNotice={setNotice}/>
     <View style={[styles.teaser,{borderColor:theme.palette.primary,
       backgroundColor:theme.dark?'#292030':'#fbeaf0'}]}>
       <Text style={[styles.teaserText,{color:theme.ink}]}>
         訪客可聽 <Text style={[styles.teaserCount,{color:theme.palette.primary}]}>{tracks.length}</Text> 部已驗證公開音檔
       </Text>
       <Pressable accessibilityRole="button" onPress={()=>router.push('/profile')}
         style={styles.teaserButton}>
         <Text style={[styles.teaserLink,{color:theme.palette.primary}]}>查看會員整合進度 →</Text>
       </Pressable>
       <Text style={[styles.teaserNote,{color:theme.muted}]}>
         中央會員系統尚待串接；尚未驗證的舊版音檔不會提前公開。
       </Text>
     </View>
     {notice.length>0&&<View style={[styles.notice,{borderColor:theme.palette.primary,borderWidth:1,
       backgroundColor:theme.card}]}>
       <Text style={[styles.noticeText,{color:theme.ink}]}>{notice}</Text>
       <Pressable accessibilityRole="button" accessibilityLabel="關閉提醒"
         onPress={()=>setNotice('')}><Text style={{color:theme.palette.primary,fontWeight:'900'}}>✕</Text></Pressable>
     </View>}
     {tracksQuery.isPending?<View style={styles.loading}>
       <ActivityIndicator color={theme.palette.primary} size="large"/>
       <Text style={[styles.loadingText,{color:theme.muted}]}>讀取音檔清單中…</Text>
     </View>:tracksQuery.isError?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.card}]}>
       <Text style={[styles.emptyText,{color:theme.muted}]}>
         暫時無法取得公開音檔清單，請稍後重試。
       </Text>
       <Pressable onPress={()=>void tracksQuery.refetch()} style={[styles.retry,{backgroundColor:theme.palette.primary}]}>
         <Text style={styles.retryText}>重新載入</Text>
       </Pressable>
     </View>:tracks.length===0?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.card}]}>
       <Text style={[styles.emptyText,{color:theme.muted}]}>
         {emptyCopy.title}
       </Text>
       <Text style={[styles.emptyExplanation,{color:theme.muted}]}>
         {emptyCopy.detail}
       </Text>
     </View>:<View style={styles.cardGrid}>
       {tracks.map(track=><View key={track.id} style={[styles.cardCell,
         {width:twoColumns?'49%':'100%'}]}>
         <LegacyTrackCard track={track} onNotice={setNotice}/>
       </View>)}
     </View>}
     <View style={styles.footer}>
       <Text style={[styles.footerText,{color:theme.muted}]}>
         繁星回聲 · 已驗證公開內容　│　廣告目前關閉
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
 footer:{paddingTop:18,alignItems:'center'},footerText:{fontSize:11}
});
