import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getPublicStreamUrl, getPublicTrack } from '../../src/api/client';
import { clampSeekTime, formatAudioTime } from '../../src/media/playback';
import type { EchoTrack } from '../../src/types';
import { palette } from '../../src/theme';

/**
 * Expo SDK 58 statically prerenders Web in Node. Only mount this hook-driven
 * player after hydration, and only for a verified public track from the API.
 */
function AudioPlayback({track}: {track:EchoTrack}) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const sourceLoaded = useRef(false);
  const streamUrl = getPublicStreamUrl(track.id);
  const available = track.playable && Boolean(streamUrl);

  useEffect(() => {
    sourceLoaded.current = false;
    player.pause();
    return () => { player.pause(); };
  }, [player, track.id]);

  const toggle = () => {
    if (!available || !streamUrl) return;
    if (status.playing) { player.pause(); return; }
    if (!sourceLoaded.current) {
      player.replace({ uri: streamUrl });
      sourceLoaded.current = true;
    }
    player.play();
  };

  const seekBy = (seconds: number) => {
    if (!available || !status.isLoaded || status.duration <= 0) return;
    void player.seekTo(clampSeekTime(status.currentTime + seconds, status.duration));
  };
  const duration = status.duration > 0 ? status.duration : track.durationSeconds;

  return <View style={styles.player}>
    <Text accessibilityRole="text" style={styles.time}>
      {formatAudioTime(status.currentTime)} ／ {formatAudioTime(duration)}
    </Text>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel="倒退15秒"
        accessibilityState={{disabled:!status.isLoaded}}
        disabled={!status.isLoaded} onPress={() => seekBy(-15)}
        style={[styles.skip,!status.isLoaded&&styles.disabled]}>
        <Text style={styles.skipText}>−15 秒</Text>
      </Pressable>
      <Pressable accessibilityRole="button"
        accessibilityLabel={status.playing ? '暫停播放' : '播放音檔'}
        accessibilityState={{disabled:!available}}
        disabled={!available} onPress={toggle}
        style={[styles.button,!available&&styles.disabled]}>
        <Text style={styles.buttonText}>
          {!available ? '媒體待驗證' : status.playing ? '暫停' : '播放'}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="快進30秒"
        accessibilityState={{disabled:!status.isLoaded}}
        disabled={!status.isLoaded} onPress={() => seekBy(30)}
        style={[styles.skip,!status.isLoaded&&styles.disabled]}>
        <Text style={styles.skipText}>+30 秒</Text>
      </Pressable>
    </View>
    {status.isBuffering&&<Text style={styles.note}>音訊緩衝中…</Text>}
    {status.error&&<Text style={styles.error}>播放暫時無法進行，請稍後重試。</Text>}
  </View>;
}

export default function TrackDetails() {
  const { id } = useLocalSearchParams<{id:string}>();
  const trackId = typeof id === 'string' && id.length > 0 && id.length <= 200 ? id : null;
  const [hydrated,setHydrated] = useState(Platform.OS !== 'web');
  useEffect(() => { setHydrated(true); }, []);
  const trackQuery = useQuery({
    queryKey:['echo','public-track',trackId],
    queryFn:({signal})=>getPublicTrack(trackId!,signal),
    enabled:Boolean(trackId),
    retry:1,
  });
  const track = trackQuery.data;

  return <SafeAreaView style={styles.root}><View style={styles.card}>
    {!trackId ? <Text style={styles.note}>無效的音檔連結。</Text> :
     trackQuery.isPending ? <>
      <ActivityIndicator color={palette.brand}/>
      <Text style={styles.note}>載入音檔中…</Text>
    </> : trackQuery.isError ? <>
      <Text style={styles.note}>連線或資料讀取暫時失敗，請稍後重試。</Text>
      <Pressable accessibilityRole="button" style={styles.retry}
        onPress={() => void trackQuery.refetch()}>
        <Text style={styles.retryText}>重新載入</Text>
      </Pressable>
    </> : !track ? (
      <Text style={styles.note}>音檔尚未完成驗證或未獲公開授權。</Text>
    ) : <>
      <Text style={styles.title}>{track.title}</Text>
      <Pressable accessibilityRole="button" onPress={() =>
        router.push({pathname:'/speaker/[name]',params:{name:track.speaker}})}>
        <Text style={styles.speaker}>{track.speaker} ›</Text>
      </Pressable>
      <Text style={styles.body}>{track.description || '尚無介紹'}</Text>
      {track.categories.length>0&&<Text style={styles.categories}>
        {track.categories.join(' · ')}
      </Text>}
      {hydrated ? <AudioPlayback track={track}/> :
        <Text style={styles.note}>播放器準備中…</Text>}
    </>}
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:palette.paper,padding:18},
 card:{padding:24,backgroundColor:palette.white,borderRadius:20},
 title:{fontSize:24,color:palette.ink,fontWeight:'800'},
 speaker:{fontSize:16,color:palette.brand,marginTop:10},
 body:{lineHeight:23,color:palette.muted,marginVertical:24},
 categories:{color:palette.muted,marginBottom:20,fontSize:13},
 player:{marginTop:12},
 time:{textAlign:'center',color:palette.ink,fontWeight:'700',marginBottom:12},
 actions:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
 button:{backgroundColor:palette.brand,paddingHorizontal:18,paddingVertical:15,borderRadius:14,alignItems:'center',flex:1},
 buttonText:{color:palette.white,fontWeight:'800'},
 skip:{borderRadius:12,backgroundColor:palette.paper,paddingHorizontal:10,paddingVertical:15},
 skipText:{color:palette.brand,fontWeight:'800',fontSize:12},
 disabled:{opacity:0.4},
 retry:{alignSelf:'center',marginTop:18,paddingVertical:12,paddingHorizontal:20,borderRadius:12,backgroundColor:palette.brand},
 retryText:{color:palette.white,fontWeight:'700'},
 note:{color:palette.muted,marginTop:20,textAlign:'center'},
 error:{color:palette.danger,marginTop:10,textAlign:'center'}
});
