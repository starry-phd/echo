import {useFontZoom} from '../src/ui/echo/FontZoom';
import {useMemo,useState} from 'react';
import {useInfiniteQuery,useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getGuestPreviewTracks,getPublicTracks} from '../src/api/client';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {useDevicePreferences} from '../src/ui/echo/DevicePreferences';
import {getCatalogDisplayState,hasPartialCatalogFailure} from '../src/ui/echo/catalogDisplayState';
import {mergeAuthorizedCards} from '../src/ui/echo/mergeAuthorizedCards';
import {isSpeakerHidden} from '../src/ui/echo/hiddenSpeakers';
import {sortEchoCards} from '../src/ui/echo/cardSorting';
import type {SortOrder} from '../src/ui/echo/cardSorting';
import {LegacyTrackCard} from '../src/ui/echo/LegacyTrackCard';
import {gatedRankingCopy,legacyRankingTabs} from '../src/ui/echo/legacyRankingTabs';
import type {RankingTab} from '../src/ui/echo/legacyRankingTabs';
import {useViewportDimensions} from '../src/ui/useViewportDimensions';
import {visualMetrics} from '../packages/ui/src/tokens';

/**
 * Second-level original StatisticsView navigation. Only public/approved
 * historical card metrics are available. Never imitate private member,
 * sticker, learning-progress, play-count, or keyword aggregates.
 */
export default function LegacyRankings(){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const {width}=useViewportDimensions();
 const preferences=useDevicePreferences();
 const [tab,setTab]=useState<RankingTab>('model');
 const [metric,setMetric]=useState<Extract<SortOrder,'rating'|'likes'|'comments'>>('rating');
 const [notice,setNotice]=useState('');
 const catalog=useInfiniteQuery({queryKey:['echo','ranking-public-catalog'],
  queryFn:({signal,pageParam})=>getPublicTracks(signal,{offset:pageParam}),
  initialPageParam:0,
  getNextPageParam:(lastPage,allPages)=>lastPage.length===100?allPages.length*100:undefined,
  retry:1});
 const previews=useQuery({queryKey:['echo','guest-previews'],
  queryFn:({signal})=>getGuestPreviewTracks(signal),retry:1});
 const verifiedPublicTracks=useMemo(()=>catalog.data?.pages.flat()??[],[catalog.data]);
 const visible=useMemo(()=>mergeAuthorizedCards(verifiedPublicTracks,previews.data??[]).filter(track=>
  !preferences.dislikedIds.includes(track.id)&&!isSpeakerHidden(track.speaker,preferences.hiddenSpeakers)
 ),[verifiedPublicTracks,previews.data,preferences.dislikedIds,preferences.hiddenSpeakers]);
 const ranked=useMemo(()=>sortEchoCards(visible,metric).slice(0,10),[visible,metric]);
 const publicSource={pending:catalog.isPending,failed:catalog.isError||catalog.isFetchNextPageError,count:verifiedPublicTracks.length};
 const previewSource={pending:previews.isPending,failed:previews.isError,count:previews.data?.length??0};
 const display=getCatalogDisplayState(publicSource,previewSource,visible.length);
 const partial=hasPartialCatalogFailure(publicSource,previewSource);
 const retry=()=>{void catalog.refetch();void previews.refetch();};
 const metrics=[{id:'rating',label:'評價最高'},{id:'likes',label:'按讚最多'},{id:'comments',label:'心得最多'}] as const;
 return <ScrollView style={[styles.root,{backgroundColor:t.bg}]}
   contentContainerStyle={styles.page}>
  <View style={styles.shell}>
   <Text style={[styles.title,{color:t.ink,fontSize:fontSize(24)}]}>排行榜</Text>
   <Text style={[styles.note,{color:t.muted,fontSize:fontSize(12)}]}>依舊版五個分頁排列。尚未接入中央會員的排名會清楚標示，不展示私人會員或未授權錄音。</Text>
   <View style={styles.tabs} accessibilityRole="tablist">
    {legacyRankingTabs.map(item=><Pressable key={item.id}
     accessibilityRole="tab" accessibilityState={{selected:tab===item.id}}
     accessibilityLabel={item.label} onPress={()=>setTab(item.id)}
     style={[styles.tab,{backgroundColor:tab===item.id?t.card:t.lightPill,
      borderColor:tab===item.id?t.palette.primary:t.border,width:width<600?'48%':'19%'}]}>
     <Text style={[styles.tabText,{color:tab===item.id?t.palette.primary:t.ink,fontSize:fontSize(11)}]}>{item.label}</Text>
    </Pressable>)}
   </View>
   {tab!=='hot-tracks'?<View style={[styles.gated,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.gatedTitle,{color:t.palette.primary,fontSize:fontSize(17)}]}>{legacyRankingTabs.find(x=>x.id===tab)?.label}</Text>
    <Text style={[styles.gatedBody,{color:t.muted,fontSize:fontSize(13)}]}>{gatedRankingCopy[tab]}</Text>
    <Text style={[styles.small,{color:t.muted,fontSize:fontSize(11)}]}>此頁目前為介面移植階段；沒有使用舊版會員資料或虛構名次。</Text>
   </View>:<>
    <View style={styles.metrics}>
     {metrics.map(x=><Pressable key={x.id} accessibilityRole="button"
      accessibilityLabel={'依'+x.label+'排序'} accessibilityState={{selected:metric===x.id}}
      onPress={()=>setMetric(x.id)} style={[styles.metric,{
       backgroundColor:metric===x.id?t.palette.primary:t.card,borderColor:t.border}]}>
      <Text style={[styles.metricText,{color:metric===x.id?'#fff':t.ink,fontSize:fontSize(12)}]}>{x.label}</Text>
     </Pressable>)}
    </View>
    <Text style={[styles.note,{color:t.muted,fontSize:fontSize(12)}]}>以下只從目前已載入的 {visible.length} 張核准作品或訪客資訊卡排序{catalog.hasNextPage?'（尚有公開作品未載入，名次非全量）':''}。評價／按讚／心得數字是舊版歷史唯讀紀錄，並非即時會員排行或播放授權。</Text>
    {Boolean(notice)&&<Text accessibilityLiveRegion="polite" style={[styles.notice,{color:t.palette.primary}]}>{notice}</Text>}
    {partial&&<View style={[styles.gated,{backgroundColor:t.card,borderColor:t.border}]}>
     <Text style={[styles.gatedBody,{color:t.muted,fontSize:fontSize(13)}]}>部分公開作品資料暫時讀取失敗，排名可能不完整。</Text>
     <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}><Text style={{color:t.palette.primary}}>重新讀取</Text></Pressable>
    </View>}
    {!preferences.ready||display==='loading'?<ActivityIndicator color={t.palette.primary} style={styles.loading}/>:
     display==='failed'?<View style={[styles.gated,{backgroundColor:t.card,borderColor:t.border}]}>
      <Text style={[styles.gatedBody,{color:t.muted,fontSize:fontSize(13)}]}>部分合法作品無法讀取，現在不能判定排行榜是否有結果。</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}><Text style={{color:t.palette.primary}}>重試載入</Text></Pressable>
     </View>:
     display==='empty'?<View style={[styles.gated,{backgroundColor:t.card,borderColor:t.border}]}>
       <Text style={[styles.gatedBody,{color:t.muted,fontSize:fontSize(13)}]}>目前沒有符合公開條件的作品資料。</Text>
     </View>:
     ranked.map((track,index)=><View key={track.id} style={styles.trackRow}>
      <Text style={[styles.rank,{color:t.palette.primary,fontSize:fontSize(14)}]} accessibilityLabel={'名次 '+(index+1)}>#{index+1}</Text>
      <View style={styles.cardWrap}>
       <LegacyTrackCard track={track} onNotice={setNotice}
        onDislike={id=>{preferences.dislike(id);setNotice('已在本裝置隱藏這張卡，可到我的收藏還原。');}}/>
      </View>
     </View>)}
    {display==='ready'&&catalog.hasNextPage&&<Pressable
     accessibilityRole="button" accessibilityLabel="載入更多已驗證公開作品供排行榜排序"
     accessibilityState={{disabled:catalog.isFetchingNextPage}}
     disabled={catalog.isFetchingNextPage}
     onPress={()=>void catalog.fetchNextPage()}
     style={[styles.more,{backgroundColor:t.card,borderColor:t.border}]}>
      <Text style={[styles.moreText,{color:t.palette.primary,fontSize:fontSize(13)}]}>
       {catalog.isFetchingNextPage?'載入中…':'載入更多公開作品以更新排名'}
      </Text>
    </Pressable>}
   </>}
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1},page:{alignItems:'center',paddingHorizontal:12,paddingTop:18,paddingBottom:40},
 shell:{maxWidth:visualMetrics.contentMaxWidth,width:'100%'},
 title:{fontSize:24,fontWeight:'900'},
 note:{fontSize:12,lineHeight:19,marginTop:8,marginBottom:13},
 tabs:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:6,marginVertical:12},
 tab:{borderWidth:1,borderRadius:12,padding:6,minHeight:48,justifyContent:'center',alignItems:'center'},
 tabText:{fontSize:11,fontWeight:'800',textAlign:'center'},
 gated:{borderWidth:1,borderRadius:19,padding:18,marginTop:12,gap:10},
 gatedTitle:{fontSize:17,fontWeight:'900'},gatedBody:{fontSize:13,lineHeight:23},
 small:{fontSize:11,lineHeight:18},
 metrics:{flexDirection:'row',gap:7,marginTop:5},
 metric:{flex:1,minHeight:44,borderRadius:12,alignItems:'center',justifyContent:'center',borderWidth:1,paddingHorizontal:3},
 metricText:{fontSize:12,fontWeight:'800'},
 notice:{fontWeight:'700',fontSize:12,marginBottom:6},
 loading:{marginTop:40},retry:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',paddingHorizontal:9},
 more:{minHeight:48,borderWidth:1,borderRadius:12,marginTop:12,alignItems:'center',justifyContent:'center'},
 moreText:{fontWeight:'800'},
 trackRow:{flexDirection:'row',gap:6,alignItems:'flex-start',marginBottom:8},
 rank:{width:36,fontWeight:'900',fontSize:14,paddingTop:22,textAlign:'center'},
 cardWrap:{flex:1,minWidth:0}
});
