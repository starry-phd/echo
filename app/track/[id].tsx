import {useEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ActivityIndicator,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {useAudioPlayer,useAudioPlayerStatus} from 'expo-audio';
import {getPublicStreamUrl,getPublicTrack} from '../../src/api/client';
import {clampSeekTime,formatAudioTime} from '../../src/media/playback';
import type {EchoTrack} from '../../src/types';
import {useLegacyTheme} from '../../src/ui/echo/legacyTheme';
import {visualMetrics} from '../../packages/ui/src/tokens';

/**
 * Original DetailView visual hierarchy, mobile first. Do NOT instantiate
 * browser/native audio during Expo 58 static Web prerendering.
 * Only the public+verified detail endpoint authorizes playback.
 */
function AudioPlayback({track}:{track:EchoTrack}){
 const t=useLegacyTheme();
 const player=useAudioPlayer(null);
 const status=useAudioPlayerStatus(player);
 const initialized=useRef(false);
 const source=getPublicStreamUrl(track.id);
 const available=track.playable&&Boolean(source);
 useEffect(()=>{
  initialized.current=false;
  player.pause();
  return()=>{player.pause();};
 },[player,track.id]);
 const toggle=()=>{
  if(!available||!source)return;
  if(status.playing){player.pause();return;}
  if(!initialized.current){player.replace({uri:source});initialized.current=true;}
  player.play();
 };
 const seek=(delta:number)=>{
  if(!available||!status.isLoaded||status.duration<=0)return;
  void player.seekTo(clampSeekTime(status.currentTime+delta,status.duration));
 };
 const duration=status.duration>0?status.duration:track.durationSeconds;
 return <View style={[styles.player,{backgroundColor:t.card,borderColor:t.border}]}>
   <View style={[styles.playerPhoto,{backgroundColor:t.lightPill}]}>
    <Text style={styles.playerPhotoIcon}>🎙</Text>
   </View>
   <Text style={[styles.time,{color:t.ink}]}>{formatAudioTime(status.currentTime)} ／ {formatAudioTime(duration)}</Text>
   <View style={styles.controls}>
    <Pressable accessibilityRole="button" accessibilityLabel="倒退15秒" accessibilityState={{disabled:!status.isLoaded}}
      disabled={!status.isLoaded} onPress={()=>seek(-15)} style={[styles.skip,{borderColor:t.border}]}>
     <Text style={[styles.skipText,{color:t.palette.primary}]}>−15 秒</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={status.playing?'暫停播放':'開始播放'}
      accessibilityState={{disabled:!available}} disabled={!available}
      onPress={toggle} style={[styles.play,{backgroundColor:t.palette.primary},!available&&styles.disabled]}>
     <Text style={styles.playLabel}>{!available?'待驗證':status.playing?'Ⅱ 暫停':'▶ 播放'}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="快進30秒" accessibilityState={{disabled:!status.isLoaded}}
      disabled={!status.isLoaded} onPress={()=>seek(30)} style={[styles.skip,{borderColor:t.border}]}>
     <Text style={[styles.skipText,{color:t.palette.primary}]}>+30 秒</Text>
    </Pressable>
   </View>
   {status.isBuffering&&<Text style={[styles.status,{color:t.muted}]}>音訊緩衝中…</Text>}
   {status.error&&<Text style={styles.error}>播放暫時無法進行，請稍後重試。</Text>}
 </View>;
}
export default function TrackDetails(){
 const t=useLegacyTheme();
 const {id}=useLocalSearchParams<{id:string}>();
 const trackId=typeof id==='string'&&id.length>0&&id.length<=200?id:null;
 const [hydrated,setHydrated]=useState(Platform.OS!=='web');
 useEffect(()=>setHydrated(true),[]);
 const q=useQuery({queryKey:['echo','public-track',trackId],enabled:Boolean(trackId),
  queryFn:({signal})=>getPublicTrack(trackId!,signal),retry:1});
 const track=q.data;
 return <ScrollView style={[styles.root,{backgroundColor:t.bg}]}
   contentContainerStyle={styles.screen}>
   <View style={styles.shell}>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/')} style={styles.back}>
     <Text style={[styles.backText,{color:t.palette.primary}]}>‹ 返回音檔列表</Text>
    </Pressable>
    <View style={[styles.mainCard,{backgroundColor:t.card,borderColor:t.border}]}>
     {!trackId?<Text style={[styles.notice,{color:t.muted}]}>無效的音檔連結。</Text>:
      q.isPending?<View style={styles.loading}>
       <ActivityIndicator color={t.palette.primary}/><Text style={[styles.notice,{color:t.muted}]}>載入音檔中…</Text>
      </View>:q.isError?<View style={styles.loading}>
       <Text style={[styles.notice,{color:t.muted}]}>連線或資料讀取暫時失敗。</Text>
       <Pressable accessibilityRole="button" onPress={()=>void q.refetch()}
        style={[styles.retry,{backgroundColor:t.palette.primary}]}><Text style={styles.retryText}>重新載入</Text></Pressable>
      </View>:!track?<Text style={[styles.notice,{color:t.muted}]}>音檔尚未完成驗證或未獲公開授權。</Text>:
      <>
       <Text style={[styles.title,{color:t.ink}]}>{track.title}</Text>
       <Pressable accessibilityRole="button"
        onPress={()=>router.push({pathname:'/speaker/[name]',params:{name:track.speaker}})}
        style={styles.speakerRow}>
        <View style={[styles.speakerAvatar,{backgroundColor:t.lightPill}]}>
         <Text style={[styles.speakerInitial,{color:t.palette.primary}]}>{Array.from(track.speaker)[0]??'♪'}</Text>
        </View>
        <View style={styles.speakerText}>
         <Text style={[styles.speakerName,{color:t.palette.primary}]}>{track.speaker} ›</Text>
         <Text style={[styles.speakerCaption,{color:t.muted}]}>查看講師公開作品</Text>
        </View>
       </Pressable>
       <View style={styles.tags}>{track.categories.map((category,i)=><View key={category+i}
        style={[styles.tag,{backgroundColor:t.lightPill,borderColor:t.border}]}>
        <Text style={[styles.tagText,{color:t.palette.primary}]}>{category}</Text>
       </View>)}</View>
       {hydrated?<AudioPlayback track={track}/>:<Text style={[styles.notice,{color:t.muted}]}>播放器準備中…</Text>}
       <View style={[styles.description,{borderTopColor:t.border}]}>
        <Text style={[styles.sectionTitle,{color:t.ink}]}>詳細介紹</Text>
        <Text style={[styles.body,{color:t.muted}]}>{track.description||'尚無介紹'}</Text>
       </View>
       <View style={[styles.pendingRow,{backgroundColor:t.lightPill}]}>
        <Text style={[styles.pendingText,{color:t.muted}]}>
         ☆ 評價　♡ 按讚　▤ 心得　—　會員功能須待 Starry ID 授權後恢復
        </Text>
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
 title:{fontSize:22,fontWeight:'900',lineHeight:31,marginBottom:13},
 speakerRow:{flexDirection:'row',alignItems:'center',minHeight:52,gap:9,marginBottom:10},
 speakerAvatar:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
 speakerInitial:{fontSize:20,fontWeight:'800'},
 speakerText:{flex:1},
 speakerName:{fontSize:15,fontWeight:'900'},speakerCaption:{fontSize:11,marginTop:3},
 tags:{flexDirection:'row',flexWrap:'wrap',gap:5,marginBottom:10},
 tag:{borderWidth:1,borderRadius:20,paddingHorizontal:10,paddingVertical:5},
 tagText:{fontSize:11,fontWeight:'700'},
 player:{borderWidth:1,borderRadius:21,padding:15,alignItems:'center',marginVertical:12},
 playerPhoto:{height:108,width:108,borderRadius:19,alignItems:'center',justifyContent:'center'},
 playerPhotoIcon:{fontSize:50},
 time:{fontWeight:'800',fontSize:13,marginVertical:12},
 controls:{flexDirection:'row',alignItems:'center',gap:9,width:'100%'},
 skip:{minHeight:48,flex:1,justifyContent:'center',alignItems:'center',borderWidth:1,borderRadius:13},
 skipText:{fontSize:12,fontWeight:'800'},
 play:{minHeight:50,flex:1.7,justifyContent:'center',alignItems:'center',borderRadius:14},
 playLabel:{color:'#fff',fontSize:14,fontWeight:'900'},disabled:{opacity:.45},
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
