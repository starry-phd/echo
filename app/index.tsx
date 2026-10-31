import {useEffect,useMemo,useRef,useState} from 'react';
import {useInfiniteQuery,useQuery} from '@tanstack/react-query';
import {router,useLocalSearchParams} from 'expo-router';
import {AccessibilityInfo,ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
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
import {matchesCardFilters} from '../src/ui/echo/cardFilters';
import {useDevicePreferences} from '../src/ui/echo/DevicePreferences';
import {AdvancedCardFilters} from '../src/ui/echo/AdvancedCardFilters';
import {getCatalogDisplayState,hasPartialCatalogFailure} from '../src/ui/echo/catalogDisplayState';
import {chooseSafeLuckyCard,isApprovedPreview,moveLuckyCardToSecondSlot} from '../src/ui/echo/safeLuckyDraw';
import {publicCategorySuggestions,shouldShowCategorySuggestions} from '../src/ui/echo/categorySuggestions';
import {safeApprovedCategoryOptions} from '../src/ui/echo/safeApprovedCategoryOptions';
import {categoryFromRoute} from '../src/ui/echo/publicCategoryNavigation';
import {speakerRankFromRoute} from '../src/ui/echo/publicSpeakerRankNavigation';
import {isSpeakerHidden} from '../src/ui/echo/hiddenSpeakers';
import {mergeAuthorizedCards} from '../src/ui/echo/mergeAuthorizedCards';
import {currentCatalogDisplayState,canDrawFromCurrentCatalog} from '../src/ui/echo/currentCatalogDisplayState';
import {canLoadMoreAuthorizedPublic} from '../src/ui/echo/publicLoadMoreEligibility';
import {visibleGuestFacets} from '../src/ui/echo/visibleGuestFacets';
import {visibleAuthorizedRankFacets} from '../src/ui/echo/visibleAuthorizedRankFacets';
import {useFontZoom} from '../src/ui/echo/FontZoom';

/**
 * Home preserves the original rose logo, lucky button + search and cards.
 * The sort bar now follows the latest yukidu/Echo-Starry main (v3.7):
 * seven desktop or five portrait controls, not obsolete v145 four controls.
 * Unverified permissions/stickers remain informational only.
 */
export default function CatalogScreen(){
 const theme=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const {category:linkedCategory,rank:linkedSpeakerRank}=useLocalSearchParams<{category?:string;rank?:string}>();
 const {width}=useViewportDimensions();
 const [query,setQuery]=useState('');
 const [searchSuggestionsOpen,setSearchSuggestionsOpen]=useState(false);
 const [debouncedQuery,setDebouncedQuery]=useState('');
 const [category,setCategory]=useState<string|null>(()=>speakerRankFromRoute(linkedSpeakerRank)?null:categoryFromRoute(linkedCategory));
 const [order,setOrder]=useState<SortOrder>('newest');
 const [notice,setNotice]=useState('');
 const [luckyPreviewId,setLuckyPreviewId]=useState<string|null>(null);
 const [luckySpinId,setLuckySpinId]=useState<string|null>(null);
 const [luckyPhase,setLuckyPhase]=useState<'idle'|'spin'|'win'>('idle');
 const luckyGeneration=useRef(0);
 const luckyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [advanced,setAdvanced]=useState(()=>Boolean(speakerRankFromRoute(linkedSpeakerRank)));
 const [speakerRank,setSpeakerRank]=useState<string|null>(()=>speakerRankFromRoute(linkedSpeakerRank));
 const {dislikedIds,hiddenSpeakers,dislike,restoreHidden,storageError,ready}=useDevicePreferences();
 const dislikeTrack=(id:string)=>{
  dislike(id);
  setNotice('已在此裝置隱藏這張音檔卡；可點「還原隱藏」恢復。');
 };
 const restoreDisliked=()=>{
  restoreHidden();
  setNotice('已還原此裝置隱藏的音檔卡。');
 };
 // Route category or speaker rank narrows currently approved cards only.
 // Rank deep links take precedence so a stale category never masks the rank.
 useEffect(()=>{
  const linkedRank=speakerRankFromRoute(linkedSpeakerRank);
  setCategory(linkedRank?null:categoryFromRoute(linkedCategory));
  setSpeakerRank(linkedRank);
  if(linkedRank)setAdvanced(true);
  setQuery('');
  setDebouncedQuery('');
  setSearchSuggestionsOpen(false);
 },[linkedCategory,linkedSpeakerRank]);
 useEffect(()=>{
   const timer=setTimeout(()=>setDebouncedQuery(query),250);
   return ()=>clearTimeout(timer);
 },[query]);
 const tracksQuery=useInfiniteQuery({
   queryKey:['echo','public-tracks',debouncedQuery,category],
   // Only public+verified catalog may page; guest metadata cards stay curated.
   queryFn:({signal,pageParam})=>getPublicTracks(signal,{
     query:debouncedQuery,category:category??undefined,offset:pageParam,
   }),
   initialPageParam:0,
   getNextPageParam:(lastPage,allPages)=>lastPage.length===100?allPages.length*100:undefined,
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
 const verifiedPublicTracks=useMemo(()=>tracksQuery.data?.pages.flat()??[],[tracksQuery.data]);
 const tracks=useMemo(()=>sortEchoCards(mergeAuthorizedCards(
  verifiedPublicTracks,previewsQuery.data??[]
 ),order),[verifiedPublicTracks,previewsQuery.data,order]);
 const visibleTracks=useMemo(()=>tracks.filter(t=>!dislikedIds.includes(t.id)&&!isSpeakerHidden(t.speaker,hiddenSpeakers)&&matchesCardFilters(t,{
  query:debouncedQuery,category,speakerRank
 })),[tracks,dislikedIds,hiddenSpeakers,debouncedQuery,category,speakerRank]);
 // A prior pick disappears immediately if hidden or excluded by new filters.
 const luckyPreview=useMemo(()=>
  visibleTracks.find(t=>t.id===luckyPreviewId&&isApprovedPreview(t)),
  [visibleTracks,luckyPreviewId]);
 const approvedGuestCards=useMemo(()=>
  visibleTracks.filter(isApprovedPreview),[visibleTracks]);
 const visibleFingerprint=visibleTracks.map(t=>t.id+':'+(t.playable?'1':'0')).join('|');
 // Changing the query, category, ranking or approved result set must cancel
 // the reel; otherwise stale timers could resurface a hidden/private card.
 useEffect(()=>{
   luckyGeneration.current++;
   if(luckyTimer.current){clearTimeout(luckyTimer.current);luckyTimer.current=null;}
   setLuckySpinId(null);setLuckyPreviewId(null);setLuckyPhase('idle');
   return ()=>{
     luckyGeneration.current++;
     if(luckyTimer.current){clearTimeout(luckyTimer.current);luckyTimer.current=null;}
   };
 },[query,category,speakerRank,order,visibleFingerprint]);
 const focusedId=luckyPhase==='spin'?luckySpinId:luckyPreview?.id??null;
 const displayedTracks=useMemo(()=>
  moveLuckyCardToSecondSlot(visibleTracks,focusedId),[visibleTracks,focusedId]);
 const guestFacets=useMemo(()=>visibleGuestFacets(
  previewsQuery.data??[],dislikedIds,hiddenSpeakers
 ),[previewsQuery.data,dislikedIds,hiddenSpeakers]);
 // Rank choices represent ONLY ranks present in the current approved guest
 // previews or verified-public catalog (not private/saved IDs). The sources
 // have separate authorization gates; device-hidden cards never add hints.
 // Do not reveal any facet before preferences have hydrated.
 const approvedRanks=useMemo(()=>visibleAuthorizedRankFacets(
  verifiedPublicTracks,previewsQuery.data??[],dislikedIds,hiddenSpeakers
 ),[verifiedPublicTracks,previewsQuery.data,dislikedIds,hiddenSpeakers]);
 const ranks=ready?approvedRanks:[];
 // Source-wide public categories remain trusted API metadata, while guest-only
 // category hints respect this device's visibility preferences.
 const categories=useMemo(()=>ready?safeApprovedCategoryOptions([
  ...(categoriesQuery.data??[]),...guestFacets.categories
 ]):[],[ready,categoriesQuery.data,guestFacets]);
 // The original Echo search suggestion panel shows at most FOUR categories.
 // The separate dropdown retains the full authorized category list.
 const categorySuggestions=useMemo(()=>
   publicCategorySuggestions(categories,query,4),[categories,query]);
 const selectSuggestedCategory=(value:string)=>{
   // Same path as the legacy category chip, without pretending user keywords
   // or private speaker data are available.
   setCategory(value);
   setQuery('');
   setDebouncedQuery('');
   setSearchSuggestionsOpen(false);
 };
 const publicSource={pending:tracksQuery.isPending,failed:tracksQuery.isError||tracksQuery.isFetchNextPageError,count:verifiedPublicTracks.length};
 const previewSource={pending:previewsQuery.isPending,failed:previewsQuery.isError,count:previewsQuery.data?.length??0};
 const catalogDisplay=getCatalogDisplayState(publicSource,previewSource,visibleTracks.length);
 const currentDisplay=currentCatalogDisplayState(ready,query,debouncedQuery,catalogDisplay);
 const catalogPartialFailure=hasPartialCatalogFailure(publicSource,previewSource);
 const retryCatalog=()=>{void tracksQuery.refetch();void previewsQuery.refetch();};
 const emptyCopy=describeEmptyPublicCatalog(healthQuery.data?.legacyMediaMigration,Boolean(query.trim()||category||speakerRank));
 const layout=viewportLayout(width);
 const twoColumns=layout.columns===2;
 const resetLucky=()=>{
   luckyGeneration.current++;
   if(luckyTimer.current){clearTimeout(luckyTimer.current);luckyTimer.current=null;}
   setLuckySpinId(null);
   setLuckyPreviewId(null);
   setLuckyPhase('idle');
 };
 const draw=()=>{
   if(!canDrawFromCurrentCatalog(currentDisplay,luckyPhase==='spin'))return;
   const outcome=chooseSafeLuckyCard(visibleTracks,luckyPreviewId);
   resetLucky();
   if(outcome.kind==='empty'){
     setNotice('目前條件下沒有可抽選的已授權音檔或訪客資訊卡，請調整篩選。');
     return;
   }
   if(outcome.kind==='playable'){
     setNotice('');
     router.push({pathname:'/track/[id]',params:{id:outcome.track.id}});
     return;
   }
   // Metadata-only visitor discovery: visual shuffle, NOT audio playback.
   const winner=outcome.track;
   const pool=approvedGuestCards;
   setNotice('');
   setLuckyPhase('spin');
   const generation=luckyGeneration.current;
   const complete=()=>{
     if(generation!==luckyGeneration.current)return;
     luckyTimer.current=null;
     setLuckySpinId(null);
     setLuckyPreviewId(winner.id);
     setLuckyPhase('win');
   };
   const begin=(reducedMotion:boolean)=>{
     if(generation!==luckyGeneration.current)return;
     if(reducedMotion||pool.length<=1){complete();return;}
     let step=0;
     const steps=Math.max(10,Math.min(14,pool.length*2));
     const tick=()=>{
       if(generation!==luckyGeneration.current)return;
       if(step>=steps){complete();return;}
       const choice=pool[Math.floor(Math.random()*pool.length)];
       setLuckySpinId(choice.id);
       const progress=step/Math.max(1,steps-1);
       step++;
       luckyTimer.current=setTimeout(tick,Math.round(62+progress*progress*70));
     };
     tick();
   };
   void AccessibilityInfo.isReduceMotionEnabled().then(begin,()=>begin(true));
 };
 return <ScrollView style={[styles.page,{backgroundColor:theme.bg}]}
   contentContainerStyle={[styles.pageContent,{paddingHorizontal:layout.horizontalGutter}]} keyboardShouldPersistTaps="handled">
   <View style={styles.shell}>
     <View style={styles.searchRow}>
       <Pressable accessibilityRole="button" accessibilityLabel="召喚繁星解答"
         accessibilityState={{disabled:!canDrawFromCurrentCatalog(currentDisplay,luckyPhase==='spin')}}
         disabled={!canDrawFromCurrentCatalog(currentDisplay,luckyPhase==='spin')} onPress={draw}
         style={[styles.lucky,{backgroundColor:theme.palette.primary,width:layout.luckyWidth}]}>
         <Text numberOfLines={2} style={styles.luckyText}>{luckyPhase==='spin'?'💫抽選中…':'💫召喚繁星解答'}</Text>
       </Pressable>
       <View style={[styles.search,{backgroundColor:theme.palette.primary}]}>
         <Text style={styles.searchIcon}>⌕</Text>
         <TextInput
           accessibilityLabel="搜尋演講者、主題、分類或獎銜"
           placeholder={layout.phone?'搜尋演講者、主題、分類...':'搜尋演講者、主題、分類或獎銜...'}
           placeholderTextColor="rgba(255,255,255,.75)"
           style={styles.input} value={query}
           onFocus={()=>setSearchSuggestionsOpen(true)}
           onChangeText={value=>{setQuery(value);setSearchSuggestionsOpen(true);}}
           onKeyPress={event=>{
             if(event.nativeEvent.key==='Escape')setSearchSuggestionsOpen(false);
           }}
           maxLength={100} returnKeyType="search" autoCapitalize="none"/>
         {query.length>0&&<Pressable accessibilityRole="button" accessibilityLabel="清除搜尋"
           onPress={()=>setQuery('')} style={styles.clear}>
           <Text style={styles.clearText}>✕</Text>
         </Pressable>}
       </View>
     </View>
     {shouldShowCategorySuggestions(searchSuggestionsOpen,query,categorySuggestions)&&
      <View style={[styles.suggestions,{backgroundColor:theme.card,borderColor:theme.border}]}>
       <View style={styles.suggestionHeading}>
        <Text style={[styles.suggestionTitle,{color:theme.muted,fontSize:fontSize(11)}]}>🏷️ 分類標籤（已核准）</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="關閉搜尋建議"
         onPress={()=>setSearchSuggestionsOpen(false)} style={styles.suggestionClose}>
         <Text style={[styles.restoreText,{color:theme.muted}]}>✕ 關閉</Text>
        </Pressable>
       </View>
       <View style={styles.suggestionChoices}>
        {categorySuggestions.map(label=><Pressable key={label}
         accessibilityRole="button" accessibilityLabel={'依分類搜尋：'+label}
         onPress={()=>selectSuggestedCategory(label)}
         style={[styles.suggestionChip,{backgroundColor:theme.lightPill,borderColor:theme.border}]}>
         <Text style={[styles.suggestionChipText,{color:theme.palette.primary}]}>#{label}</Text>
        </Pressable>)}
       </View>
      </View>}
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
       onCategory={setCategory} order={order} onOrder={setOrder} onNotice={setNotice}/>
     <View style={[styles.teaser,{borderColor:theme.palette.primary,
       backgroundColor:theme.dark?'#292030':'#fbeaf0'}]}>
       <Text style={[styles.teaserText,{color:theme.ink,fontSize:fontSize(14)}]}>
         訪客目前已載入 <Text style={[styles.teaserCount,{color:theme.palette.primary,fontSize:fontSize(19)}]}>{currentDisplay==='ready'||currentDisplay==='empty'?visibleTracks.length:'—'}</Text> 張音檔資訊卡{tracksQuery.hasNextPage?'（仍有更多公開作品）':''}；其中可播放 {currentDisplay==='ready'||currentDisplay==='empty'?visibleTracks.filter(t=>t.playable).length:'—'} 部
       </Text>
       <Pressable accessibilityRole="button" onPress={()=>router.push('/profile')}
         style={styles.teaserButton}>
         <Text style={[styles.teaserLink,{color:theme.palette.primary}]}>查看會員整合進度 →</Text>
       </Pressable>
       <Text style={[styles.teaserNote,{color:theme.muted,fontSize:fontSize(12)}]}>
         資訊卡不代表播放授權；私人音檔與會員功能仍受保護。
       </Text>
       {ready&&(currentDisplay==='ready'||currentDisplay==='empty')&&
        (order==='newest'||order==='oldest')&&visibleTracks.some(track=>!track.uploadDate)&&
        <Text style={[styles.teaserNote,{color:theme.muted,fontSize:fontSize(12)}]}>
         部分核准公開作品尚無可排序的公開日期；這些作品排在有日期的作品後方，保留原清單順序，不代表實際上傳先後。
        </Text>}
       {ready&&currentDisplay==='ready'&&
        (order.startsWith('rating')||order.startsWith('likes')||order.startsWith('comments'))&&
        <Text style={[styles.teaserNote,{color:theme.muted,fontSize:fontSize(12)}]}>
         評價、按讚與心得只依已公開的歷史數字排序；沒有提供所選指標的作品會排在有數值的作品後面，不視為 0。
        </Text>}
     </View>
     {(query.trim()||category||speakerRank)&&<Pressable accessibilityRole="button" accessibilityLabel="清除全部篩選"
      onPress={()=>{setQuery('');setCategory(null);setSpeakerRank(null);}} style={styles.restore}>
      <Text style={[styles.restoreText,{color:theme.palette.primary}]}>清除全部篩選</Text>
     </Pressable>}
     {storageError&&<Text style={[styles.teaserNote,{color:theme.muted,fontSize:fontSize(12)}]}>部分本機偏好無法讀取或儲存，相關變更可能僅在目前使用期間保留。</Text>}
     {dislikedIds.length>0&&<Pressable
       accessibilityRole="button" accessibilityLabel="還原本裝置隱藏的音檔卡"
       disabled={!ready} onPress={restoreDisliked} style={[styles.restore,{borderColor:theme.border,backgroundColor:theme.card}]}>
        <Text style={[styles.restoreText,{color:theme.palette.primary}]}>
         還原隱藏（本裝置 {dislikedIds.length} 張）
        </Text>
       </Pressable>}
     {dislikedIds.length>0&&<Pressable accessibilityRole="button" accessibilityLabel="逐張管理本裝置隱藏的音檔卡"
      onPress={()=>router.push('/favorites')} style={[styles.restore,{borderColor:theme.border,backgroundColor:theme.card}]}>
      <Text style={[styles.restoreText,{color:theme.palette.primary}]}>管理不喜歡的音檔卡（可個別還原）</Text>
     </Pressable>}
     {hiddenSpeakers.length>0&&<Pressable accessibilityRole="button"
      accessibilityLabel="管理本裝置不喜歡的演講者"
      onPress={()=>router.push('/favorites')} style={[styles.restore,{borderColor:theme.border,backgroundColor:theme.card}]}>
      <Text style={[styles.restoreText,{color:theme.palette.primary}]}>管理隱藏的演講者（{hiddenSpeakers.length} 項）</Text>
     </Pressable>}
     {notice.length>0&&<View style={[styles.notice,{borderColor:theme.palette.primary,borderWidth:1,
       backgroundColor:theme.card}]}>
       <Text style={[styles.noticeText,{color:theme.ink,fontSize:fontSize(13)}]}>{notice}</Text>
       <Pressable accessibilityRole="button" accessibilityLabel="關閉提醒"
         onPress={()=>setNotice('')}><Text style={{color:theme.palette.primary,fontWeight:'900'}}>✕</Text></Pressable>
     </View>}
     {luckyPhase==='spin'&&<View accessibilityRole="summary" style={[styles.luckyResult,{
       backgroundColor:theme.card,borderColor:theme.palette.primary}]}>
       <ActivityIndicator color={theme.palette.primary}/>
       <Text style={[styles.luckyResultTitle,{color:theme.palette.primary,fontSize:fontSize(16)}]}>
         正在從符合條件的訪客資訊卡中抽選…
       </Text>
       <Text style={[styles.teaserNote,{color:theme.muted,fontSize:fontSize(12)}]}>
         這是僅供瀏覽的視覺抽選；不會讀取或播放私人音訊。
       </Text>
       <Pressable accessibilityRole="button" accessibilityLabel="取消抽選"
         onPress={resetLucky} style={[styles.luckyCloseButton,{borderColor:theme.border}]}>
         <Text style={[styles.restoreText,{color:theme.muted}]}>取消抽選</Text>
       </Pressable>
     </View>}
     {!!luckyPreview&&luckyPhase==='win'&&currentDisplay==='ready'&&<View accessibilityRole="summary" style={[styles.luckyResult,{
       backgroundColor:theme.card,borderColor:theme.palette.primary}]}>
       <Text style={[styles.luckyResultTitle,{color:theme.palette.primary,fontSize:fontSize(16)}]}>✨ 好手氣！本次抽中訪客資訊卡</Text>
       <Text style={[styles.luckyResultName,{color:theme.ink,fontSize:fontSize(17)}]} numberOfLines={2}>{luckyPreview.title}</Text>
       <Text style={[styles.luckyResultSpeaker,{color:theme.muted,fontSize:fontSize(13)}]} numberOfLines={1}>{luckyPreview.speaker}</Text>
       <Text style={[styles.teaserNote,{color:theme.muted,fontSize:fontSize(12)}]}>
         僅可查看已核准的照片及資訊，這不是可播放的繁星解答。
       </Text>
       <View style={styles.luckyActions}>
         <Pressable accessibilityRole="button" accessibilityLabel="查看抽中的資訊卡"
          onPress={()=>router.push({pathname:'/preview/[id]',params:{id:luckyPreview.id}})}
          style={[styles.luckyDetailsButton,{backgroundColor:theme.palette.primary}]}>
          <Text style={styles.retryText}>查看資訊卡</Text>
         </Pressable>
         <Pressable accessibilityRole="button" accessibilityLabel="關閉抽選結果"
          onPress={resetLucky} style={[styles.luckyCloseButton,{borderColor:theme.border}]}>
          <Text style={[styles.restoreText,{color:theme.muted}]}>關閉</Text>
         </Pressable>
       </View>
     </View>}
     {catalogPartialFailure&&currentDisplay!=='failed'&&currentDisplay!=='loading'&&<View style={[styles.notice,{
       borderColor:theme.palette.primary,borderWidth:1,backgroundColor:theme.card}]}>
       <Text style={[styles.noticeText,{color:theme.ink,fontSize:fontSize(13)}]}>
         部分音檔資訊暫時無法更新，畫面只顯示目前成功讀取的資料。
       </Text>
       <Pressable accessibilityRole="button" accessibilityLabel="重新讀取全部音檔資訊" onPress={retryCatalog}>
         <Text style={{color:theme.palette.primary,fontWeight:'900'}}>重試</Text>
       </Pressable>
     </View>}
     {currentDisplay==='loading'?<View style={styles.loading}>
       <ActivityIndicator color={theme.palette.primary} size="large"/>
       <Text style={[styles.loadingText,{color:theme.muted,fontSize:fontSize(13)}]}>讀取音檔清單中…</Text>
     </View>:currentDisplay==='failed'?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.card}]}>
       <Text style={[styles.emptyText,{color:theme.muted,fontSize:fontSize(15)}]}>
         音檔資訊暫時無法完整讀取，並非沒有音檔。請重試。
       </Text>
       <Pressable accessibilityRole="button" onPress={retryCatalog} style={[styles.retry,{backgroundColor:theme.palette.primary}]}>
         <Text style={styles.retryText}>重新載入</Text>
       </Pressable>
     </View>:currentDisplay==='empty'?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.card}]}>
       <Text style={[styles.emptyText,{color:theme.muted,fontSize:fontSize(15)}]}>
         {tracksQuery.hasNextPage?'目前已載入的作品沒有符合條件的資料，仍可繼續載入其他已核准公開作品。':emptyCopy.title}
       </Text>
       <Text style={[styles.emptyExplanation,{color:theme.muted,fontSize:fontSize(12)}]}>
         {emptyCopy.detail}
       </Text>
     </View>:<View style={styles.cardGrid}>
       {displayedTracks.map(track=><View key={track.id} style={[styles.cardCell,
         {width:twoColumns?'49%':'100%'},
         focusedId===track.id&&{borderWidth:2,borderColor:theme.palette.primary,
           borderRadius:23,padding:2}]}>
         {luckyPhase==='win'&&luckyPreview?.id===track.id&&
          <Text style={[styles.luckyBadge,{color:theme.palette.primary}]}>✨ 好手氣！✨　僅資訊卡</Text>}
         <LegacyTrackCard track={track} onNotice={setNotice} onDislike={dislikeTrack}/>
       </View>)}
     </View>}
     {canLoadMoreAuthorizedPublic(currentDisplay,tracksQuery.hasNextPage,ready)&&<Pressable
       accessibilityRole="button" accessibilityLabel="載入更多已核准公開音檔"
       accessibilityState={{disabled:tracksQuery.isFetchingNextPage}}
       disabled={tracksQuery.isFetchingNextPage}
       onPress={()=>void tracksQuery.fetchNextPage()}
       style={[styles.restore,{borderColor:theme.border,backgroundColor:theme.card}]}>
       <Text style={[styles.restoreText,{color:theme.palette.primary,fontSize:fontSize(14)}]}>
        {tracksQuery.isFetchingNextPage?'載入中…':'載入更多公開音檔'}
       </Text>
     </Pressable>}
     <View style={styles.footer}>
       <Text style={[styles.footerText,{color:theme.muted,fontSize:fontSize(12)}]}>
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
 suggestions:{borderWidth:1,borderRadius:16,padding:12,marginTop:8,gap:8},
 suggestionHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 suggestionTitle:{fontSize:11,fontWeight:'800'},
 suggestionClose:{minHeight:44,minWidth:60,alignItems:'center',justifyContent:'center'},
 suggestionChoices:{flexDirection:'row',flexWrap:'wrap',gap:7},
 suggestionChip:{borderWidth:1,borderRadius:12,paddingHorizontal:11,
   minHeight:44,justifyContent:'center',alignItems:'center'},
 suggestionChipText:{fontSize:12,fontWeight:'700'},
 advancedHint:{marginTop:10,paddingVertical:7,paddingHorizontal:3},
 advancedHintText:{fontSize:13,fontWeight:'800'},
 teaser:{marginTop:9,marginBottom:10,borderRadius:23,padding:14,borderWidth:1,alignItems:'center',
   shadowColor:'#c13f6f',shadowOpacity:.12,shadowRadius:16,elevation:1},
 teaserText:{fontSize:14,fontWeight:'800',textAlign:'center'},
 teaserCount:{fontSize:20,fontWeight:'900'},
 teaserButton:{marginTop:8,paddingVertical:5,paddingHorizontal:12},
 teaserLink:{fontSize:15,fontWeight:'900',textAlign:'center'},
 teaserNote:{fontSize:11,textAlign:'center',marginTop:3,lineHeight:17},
 luckyResult:{borderWidth:1,borderRadius:18,padding:14,marginVertical:10,alignItems:'center',gap:7},
 luckyResultTitle:{fontSize:15,fontWeight:'900'},
 luckyResultName:{fontSize:17,fontWeight:'800',textAlign:'center'},
 luckyResultSpeaker:{fontSize:12,textAlign:'center'},
 luckyActions:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:7},
 luckyDetailsButton:{minHeight:44,justifyContent:'center',alignItems:'center',paddingHorizontal:17,borderRadius:12},
 luckyCloseButton:{minHeight:44,justifyContent:'center',alignItems:'center',paddingHorizontal:15,borderWidth:1,borderRadius:12},
 notice:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:13,
   borderRadius:14,marginVertical:8,gap:10},noticeText:{fontSize:13,flex:1,lineHeight:20},
 cardGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',paddingTop:5},
 cardCell:{minWidth:0},
 luckyBadge:{fontSize:13,fontWeight:'900',textAlign:'center',padding:5},
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
