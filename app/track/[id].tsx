import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { getPublicStreamUrl, getPublicTrack } from '../../src/api/client';
import type { EchoTrack } from '../../src/types';
import { palette } from '../../src/theme';

/** Audio hooks must not run while Expo 58 prerenders a Web page in Node. */
function AudioPlayback({track}: {track:EchoTrack}) {
  const player = useAudioPlayer(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!track.playable) return;
    if (playing) { player.pause(); setPlaying(false); return; }
    const streamUrl = getPublicStreamUrl(track.id);
    if (!streamUrl) return;
    player.replace({uri:streamUrl});
    player.play();
    setPlaying(true);
  };
  return <Pressable accessibilityRole="button" disabled={!track.playable}
    onPress={toggle} style={[styles.button,!track.playable&&styles.disabled]}>
      <Text style={styles.buttonText}>
        {!track.playable ? '媒體待驗證' : playing ? '暫停播放' : '播放音檔'}
      </Text>
    </Pressable>;
}

export default function TrackDetails() {
  const { id } = useLocalSearchParams<{id:string}>();
  const trackId = typeof id === 'string' && id.length > 0 ? id : null;
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
      <Text style={styles.speaker}>{track.speaker}</Text>
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
 button:{backgroundColor:palette.brand,padding:17,borderRadius:14,alignItems:'center'},
 buttonText:{color:palette.white,fontWeight:'800'},
 disabled:{opacity:0.4},
 retry:{alignSelf:'center',marginTop:18,paddingVertical:12,paddingHorizontal:20,borderRadius:12,backgroundColor:palette.brand},
 retryText:{color:palette.white,fontWeight:'700'},
 note:{color:palette.muted,marginTop:20,textAlign:'center'}
});
