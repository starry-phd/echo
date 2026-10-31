import {useCallback,useEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useAudioPlayer,useAudioPlayerStatus} from 'expo-audio';
import {getPublicStreamUrl,getPublicTrack} from '../../src/api/client';
import {clampSeekTime,formatAudioTime} from '../../src/media/playback';
import {LEGACY_PLAYBACK_RATES,LEGACY_SKIP_SECONDS} from '../../src/media/legacyPlaybackControls';
import {LegacyPlaybackTimeline} from '../../src/ui/echo/LegacyPlaybackTimeline';
import type {EchoTrack} from '../../src/types';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {visualMetrics} from '../../packages/ui/src/tokens';
import {useDevicePreferences} from '../../src/ui/echo/DevicePreferences';
import {isLocallyHiddenCard} from '../../src/ui/echo/localCardVisibility';
import {splitSpeakerNames} from '../../src/ui/echo/speakerNames';
import {LegacyLectureNotes} from '../../src/ui/echo/LegacyLectureNotes';
import {LegacyEngagementDetail} from '../../src/ui/echo/LegacyEngagementDetail';
import {LegacyVerifiedTrackShare} from '../../src/ui/echo/LegacyVerifiedTrackShare';
import {LegacyDetailDeviceActions} from '../../src/ui/echo/LegacyDetailDeviceActions';
import {LegacyDetailSectionNavigation} from '../../src/ui/echo/LegacyDetailSectionNavigation';
import {LegacyDetailSpeakerPortrait} from '../../src/ui/echo/LegacyDetailSpeakerPortrait';
import {LegacyDetailEngagementSummary} from '../../src/ui/echo/LegacyDetailEngagementSummary';
import {useFontZoom} from '../../src/ui/echo/FontZoom';
import {useViewportDimensions} from '../../src/ui/useViewportDimensions';
import {legacyDetailHeroSizing} from '../../src/ui/echo/legacyDetailHeroSizing';
import {useDetailSectionJump} from '../../src/ui/echo/detailSectionScroll';

/**
 * Original DetailView visual hierarchy, mobile first. Do NOT instantiate
 * browser/native audio during Expo 58 static Web prerendering.
 * Only the public+verified detail endpoint authorizes playback.
 */
function AudioPlayback({track,onToggleReady}:{track:EchoTrack;onToggleReady:(toggle:(()=>void)|null)=>void}){
 const t=useLegacyTheme();
 const player=useAudioPlayer(null);
 const status=useAudioPlayerStatus(player);
 const initialized=useRef(false);
 const [speed,setSpeed]=useState(1);
 const source=getPublicStreamUrl(track.id);
 const available=track.playable&&Boolean(source);
 useEffect(()=>{
  initialized.current=false;
  player.pause();
  setSpeed(1);
  return()=>{player.pause();};
 },[player,track.id]);
 const toggle=()=>{
  if(!available||!source)return;
  if(status.playing){player.pause();return;}
  if(!initialized.current){player.replace({uri:source});initialized.current=true;}
  player.play();
 };
 const toggleRef=useRef<()=>void>(()=>{});
 toggleRef.current=toggle;
 const invokeToggle=useCallback(()=>toggleRef.current(),[]);
 useEffect(()=>{
  onToggleReady(invokeToggle);
  return()=>onToggleReady(null);
 },[onToggleReady,invokeToggle]);
 const seek=(delta:number)=>{
  if(!available||!status.isLoaded||status.duration<=0)return;
  void player.seekTo(clampSeekTime(status.currentTime+delta,status.duration));
 };
 const changeSpeed=(rate:number)=>{
  if(!available||!status.isLoaded||!LEGACY_PLAYBACK_RATES.some(value=>value===rate))return;
  player.setPlaybackRate(rate);
  setSpeed(rate);
 };
 const duration=status.duration>0?status.duration:track.durationSeconds;
 const skipButton=(delta:number)=><Pressable key={delta}
   accessibilityRole="button"
   accessibilityLabel={delta<0?'倒退'+Math.abs(delta)+'秒':'快進'+delta+'秒'}
   accessibilityState={{disabled:!available||!status.isLoaded}}
   disabled={!available||!status.isLoaded} onPress={()=>seek(delta)}
   style={[styles.skip,{borderColor:t.border},(!available||!status.isLoaded)&&styles.disabled]}>
   <Text style={[styles.skipText,{color:t.palette.primary}]}>{delta>0?'+':''}{delta}</Text>
  </Pressable>;
 return <View style={[styles.player,{backgroundColor:t.card,borderColor:t.border}]}>
   <LegacyDetailSpeakerPortrait track={track} onPress={toggle}/>
   <LegacyPlaybackTimeline currentTime={status.currentTime} duration={duration}
    enabled={available&&status.isLoaded&&status.duration>0}
    color={t.palette.primary} trackColor={t.lightPill} onSeek={seconds=>{
     if(available&&status.isLoaded&&status.duration>0)
      void player.seekTo(clampSeekTime(seconds,status.duration));
    }}/>
   <Text style={[styles.time,{color:t.ink}]}>{formatAudioTime(status.currentTime)} ／ {formatAudioTime(duration)}
    {status.duration>0?'（'+Math.round(clampSeekTime(status.currentTime,status.duration)/status.duration*100)+'%）':''}</Text>
   <View style={styles.controls}>
    {LEGACY_SKIP_SECONDS.slice(0,2).map(skipButton)}
    <Pressable accessibilityRole="button" accessibilityLabel={status.playing?'暫停播放':'開始播放'}
      accessibilityState={{disabled:!available}} disabled={!available}
      onPress={toggle} style={[styles.play,{backgroundColor:t.palette.primary},!available&&styles.disabled]}>
     <Text style={styles.playLabel}>{!available?'待驗證':status.playing?'Ⅱ':'▶'}</Text>
    </Pressable>
    {LEGACY_SKIP_SECONDS.slice(2).map(skipButton)}
   </View>
   <View style={styles.speedRow}>
    {LEGACY_PLAYBACK_RATES.map(rate=><Pressable key={rate}
     accessibilityRole="button" accessibilityLabel={'播放速度'+rate+'倍'}
     accessibilityState={{disabled:!available||!status.isLoaded,selected:speed===rate}}
     disabled={!available||!status.isLoaded} onPress={()=>changeSpeed(rate)}
     style={[styles.speedButton,{borderColor:speed===rate?t.palette.primary:t.border,
      backgroundColor:speed===rate?t.lightPill:t.card},(!available||!status.isLoaded)&&styles.disabled]}>
     <Text style={[styles.speedText,{color:speed===rate?t.palette.primary:t.muted}]}>{rate}×</Text>
    </Pressable>)}
   </View>
   {!available&&<Text style={[styles.status,{color:t.muted}]}>此音檔尚無已驗證公開播放權；操作不可用。</Text>}
   {status.isBuffering&&<Text style={[styles.status,{color:t.muted}]}>音訊緩衝中…</Text>}
   {status.error&&<Text style={styles.error}>播放暫時無法進行，請稍後重試。</Text>}
 </View>;
}
export default function TrackDetails(){
 const t=useLegacyTheme();
 const preferences=useDevicePreferences();
 const sections=useDetailSectionJump();
 const {fontSize}=useFontZoom();
 const viewport=useViewportDimensions();
 const hero=legacyDetailHeroSizing(viewport.width);
 const [portraitToggle,setPortraitToggle]=useState<(()=>void)|null>(null);
 const onToggleReady=useCallback((toggle:(()=>void)|null)=>setPortraitToggle(()=>toggle),[]);
 const {id}=useLocalSearchParams<{id:string}>();
 const trackId=typeof id==='string'&&id.length>0&&id.length<=200?id:null;
 const [hydrated,setHydrated]=useState(Platform.OS!=='web');
 useEffect(()=>setHydrated(true),[]);
 const q=useQuery({queryKey:['echo','public-track',trackId],enabled:Boolean(trackId),
  queryFn:({signal})=>getPublicTrack(trackId!,signal),retry:1});
 const track=q.data;
 const speakerNames=splitSpeakerNames(track?.speaker);
 const hidden=isLocallyHiddenCard(track,preferences.dislikedIds,preferences.hiddenSpeakers);
 return <ScrollView ref={sections.scrollRef} style={[styles.root,{backgroundColor:t.bg}]}
   contentContainerStyle={styles.screen}>
   <View style={styles.shell} onLayout={sections.onShellLayout}>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/')} style={styles.back}>
     <Text style={[styles.backText,{color:t.palette.primary}]}>‹ 返回音檔列表</Text>
    </Pressable>
    <View onLayout={sections.onCardLayout} style={[styles.mainCard,{backgroundColor:t.card,borderColor:t.border}]}>
     {!trackId?<Text style={[styles.notice,{color:t.muted}]}>無效的音檔連結。</Text>:
      q.isPending?<View style={styles.loading}>
       <ActivityIndicator color={t.palette.primary}/><Text style={[styles.notice,{color:t.muted}]}>載入音檔中…</Text>
      </View>:q.isError?<View style={styles.loading}>
       <Text style={[styles.notice,{color:t.muted}]}>連線或資料讀取暫時失敗。</Text>
       <Pressable accessibilityRole="button" onPress={()=>void q.refetch()}
        style={[styles.retry,{backgroundColor:t.palette.primary}]}><Text style={styles.retryText}>重新載入</Text></Pressable>
      </View>:!track?<Text style={[styles.notice,{color:t.muted}]}>音檔尚未完成驗證或未獲公開授權。</Text>:
      !preferences.ready?<View style={styles.loading}>
       <ActivityIndicator color={t.palette.primary}/>
       <Text style={[styles.notice,{color:t.muted}]}>載入本裝置隱藏設定中…</Text>
      </View>:hidden?<View style={styles.loading}>
       <Text style={[styles.notice,{color:t.muted}]}>這部音檔已依本裝置的「我不喜歡」設定隱藏；公開播放權限不受此設定影響。</Text>
       {preferences.dislikedIds.includes(track.id)&&<Pressable accessibilityRole="button"
        accessibilityLabel="還原此張音檔卡的本裝置隱藏"
        onPress={()=>preferences.restoreHiddenTrack(track.id)}
        style={[styles.retry,{backgroundColor:t.palette.primary}]}>
        <Text style={styles.retryText}>還原此張卡片</Text>
       </Pressable>}
       <Pressable accessibilityRole="button" accessibilityLabel="前往我的收藏管理隱藏設定"
        onPress={()=>router.push('/favorites')} style={[styles.retry,{backgroundColor:t.palette.primary}]}>
        <Text style={styles.retryText}>前往我的收藏管理隱藏設定</Text>
       </Pressable>
      </View>:
      <>
       <View style={styles.hero}>
        <LegacyDetailSpeakerPortrait track={track} onPress={portraitToggle??undefined}/>
        <View style={styles.tags}>{track.categories.map((category,i)=><Pressable key={category+i}
         accessibilityRole="link" accessibilityLabel={'瀏覽同分類已核准作品：'+category}
         onPress={()=>router.push({pathname:'/',params:{category}})}
         style={[styles.tag,{backgroundColor:t.lightPill,borderColor:t.border}]}>
         <Text style={[styles.tagText,{color:t.palette.primary,fontSize:fontSize(11)}]}>{category} ›</Text>
        </Pressable>)}</View>
        <Text style={[styles.title,{color:t.ink,fontSize:fontSize(hero.titleFont)}]}>{track.title}</Text>
        <View style={styles.heroSpeakers}>
         {speakerNames.length? speakerNames.map((name,i)=><View key={name+i} style={styles.speakerLinkItem}>
          {i>0&&<Text style={[styles.speakerSeparator,{color:t.muted}]}> & </Text>}
          <Pressable accessibilityRole="link" accessibilityLabel={'查看'+name+'的演講者資料'}
           onPress={()=>router.push({pathname:'/speaker/[name]',params:{name}})} style={styles.speakerLink}>
           <Text style={[styles.speakerName,{color:t.palette.primary,fontSize:fontSize(14)}]}>{name} ›</Text>
          </Pressable>
         </View>):<Text style={[styles.speakerName,{color:t.muted,fontSize:fontSize(14)}]}>講師資料待補</Text>}
         {!!track.speakerRank&&<Text style={[styles.speakerRank,{color:t.muted,fontSize:fontSize(13)}]}>· {track.speakerRank}</Text>}
        </View>
        <LegacyDetailEngagementSummary track={track} onViewEngagement={()=>sections.jumpTo('engagement')}/>
        <Text style={[styles.duration,{color:t.muted,fontSize:fontSize(12)}]}>
         錄音長度：{track.durationSeconds>0?'約 '+Math.max(1,Math.round(track.durationSeconds/60))+' 分鐘':'時間待確認'}
        </Text>
       </View>
       <LegacyDetailSectionNavigation showPlayback={track.playable} onJump={sections.jumpTo}/>
       <View onLayout={sections.onSectionLayout('playback')}>
        {hydrated?<AudioPlayback track={track} onToggleReady={onToggleReady}/>:<Text style={[styles.notice,{color:t.muted}]}>播放器準備中…</Text>}
       </View>
       <View onLayout={sections.onSectionLayout('notes')}>
        <LegacyLectureNotes track={track}/>
       </View>
       <LegacyVerifiedTrackShare track={track} routeId={trackId}/>
       <View onLayout={sections.onSectionLayout('engagement')}>
        <LegacyEngagementDetail track={track}/>
       </View>
       <View onLayout={sections.onSectionLayout('device')}>
        <LegacyDetailDeviceActions track={track} routeId={trackId} source="public"/>
       </View>
      </>}
    </View>
   </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1},screen:{alignItems:'center',paddingHorizontal:12,paddingBottom:30},
 shell:{maxWidth:visualMetrics.contentMaxWidth,width:'100%',paddingTop:12},
 back:{minHeight:44,justifyContent:'center',alignSelf:'flex-start',paddingHorizontal:6},
 backText:{fontSize:14,fontWeight:'800'},
 mainCard:{padding:16,borderRadius:21,borderWidth:1,minHeight:200,
  shadowColor:'#0f172a',shadowOpacity:.05,shadowRadius:13,elevation:1},
 hero:{alignItems:'center',paddingTop:5,paddingBottom:10,gap:6},
 title:{fontSize:20,fontWeight:'900',lineHeight:26,textAlign:'center'},
 heroSpeakers:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:7},
 speakerLinkItem:{flexDirection:'row',alignItems:'center'},
 speakerLink:{minHeight:44,justifyContent:'center'},
 speakerSeparator:{fontSize:14,fontWeight:'500'},
 speakerName:{fontSize:15,fontWeight:'900'},speakerRank:{lineHeight:22},
 tags:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:5,marginBottom:2},
duration:{lineHeight:20},
 tag:{borderWidth:1,borderRadius:20,paddingHorizontal:10,minHeight:44,justifyContent:'center'},
 tagText:{fontSize:11,fontWeight:'700'},
 player:{borderWidth:1,borderRadius:21,padding:15,alignItems:'center',marginVertical:12},
 time:{fontWeight:'800',fontSize:13,marginVertical:12},
 controls:{flexDirection:'row',alignItems:'center',gap:5,width:'100%'},
 skip:{minHeight:48,flex:1,justifyContent:'center',alignItems:'center',borderWidth:1,borderRadius:13},
 skipText:{fontSize:12,fontWeight:'800'},
 play:{minHeight:50,flex:1.25,justifyContent:'center',alignItems:'center',borderRadius:14},
 playLabel:{color:'#fff',fontSize:17,fontWeight:'900'},disabled:{opacity:.45},
 speedRow:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:5,marginTop:12},
 speedButton:{minHeight:44,minWidth:44,paddingHorizontal:7,alignItems:'center',
  justifyContent:'center',borderWidth:1,borderRadius:9},
 speedText:{fontSize:12,fontWeight:'800'},
 description:{borderTopWidth:1,marginTop:16,paddingTop:14},
 sectionTitle:{fontSize:16,fontWeight:'900',marginBottom:8},
 body:{fontSize:14,lineHeight:24},
 pendingRow:{marginTop:15,padding:12,borderRadius:13},
 pendingText:{fontSize:11,lineHeight:20},
 loading:{alignItems:'center',gap:16,justifyContent:'center',minHeight:160},
 notice:{fontSize:13,lineHeight:22,textAlign:'center'},
 status:{fontSize:12,marginTop:12},error:{fontSize:12,color:'#b8324e',marginTop:9},
 retry:{borderRadius:12,minHeight:44,alignItems:'center',justifyContent:'center',paddingHorizontal:20},
 retryText:{color:'#fff',fontWeight:'800'}
});
