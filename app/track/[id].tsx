import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { getPublicStreamUrl, getPublicTracks } from '../../src/api/client';
import type { EchoTrack } from '../../src/types';
import { palette } from '../../src/theme';

/**
 * Audio players require native/browser APIs. Expo SDK 58 prerenders Web routes
 * in Node, so never instantiate useAudioPlayer during server rendering.
 */
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
  const [track,setTrack] = useState<EchoTrack | null>(null);
  const [message,setMessage] = useState('載入音檔中…');
  const [hydrated,setHydrated] = useState(Platform.OS !== 'web');

  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    let active = true;
    getPublicTracks().then(items => {
      if (!active) return;
      const found = items.find(item => item.id === id);
      setTrack(found || null);
      setMessage(found ? '' : '音檔尚未完成驗證或未獲公開授權。');
    }).catch(() => { if (active) setMessage('新版伺服器尚未準備完成。'); });
    return () => { active = false; };
  }, [id]);

  return <SafeAreaView style={styles.root}><View style={styles.card}>
    {!track ? <>
      <ActivityIndicator color={palette.brand}/>
      <Text style={styles.note}>{message}</Text>
    </> : <>
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.speaker}>{track.speaker}</Text>
      <Text style={styles.body}>{track.description || '尚無介紹'}</Text>
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
 button:{backgroundColor:palette.brand,padding:17,borderRadius:14,alignItems:'center'},
 buttonText:{color:palette.white,fontWeight:'800'},
 disabled:{opacity:0.4},
 note:{color:palette.muted,marginTop:20,textAlign:'center'}
});
