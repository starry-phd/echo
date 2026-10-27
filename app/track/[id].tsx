import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { getPublicStreamUrl, getPublicTracks } from '../../src/api/client';
import type { EchoTrack } from '../../src/types';
import { palette } from '../../src/theme';

export default function TrackDetails() {
  const { id } = useLocalSearchParams<{id:string}>();
  const [track,setTrack] = useState<EchoTrack | null>(null);
  const [message,setMessage] = useState('載入音檔中…');
  const [playing,setPlaying] = useState(false);
  const player = useAudioPlayer(null);
  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    getPublicTracks().then(items => {
      const found = items.find(item => item.id === id);
      setTrack(found || null);
      setMessage(found ? '' : '音檔尚未完成驗證或未獲公開授權。');
    }).catch(() => setMessage('新版伺服器尚未準備完成。'));
  }, [id]);
  const toggle = () => {
    if (!track?.playable) return;
    if (playing) { player.pause();setPlaying(false);return; }
    const source=getPublicStreamUrl(track.id);
    if (!source) return;
    player.replace({uri:source});
    player.play();
    setPlaying(true);
  };
  return <SafeAreaView style={styles.root}><View style={styles.card}>
    {!track ? <><ActivityIndicator color={palette.brand}/><Text style={styles.note}>{message}</Text></> :
    <><Text style={styles.title}>{track.title}</Text><Text style={styles.speaker}>{track.speaker}</Text>
      <Text style={styles.body}>{track.description || '尚無介紹'}</Text>
      <Pressable accessibilityRole="button" disabled={!track.playable} onPress={toggle} style={[styles.button,!track.playable&&styles.disabled]}>
        <Text style={styles.buttonText}>{!track.playable ? '媒體待驗證' : playing ? '暫停播放' : '播放音檔'}</Text>
      </Pressable>
    </>}
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:palette.paper,padding:18},card:{padding:24,backgroundColor:palette.white,borderRadius:20},
 title:{fontSize:24,color:palette.ink,fontWeight:'800'},speaker:{fontSize:16,color:palette.brand,marginTop:10},
 body:{lineHeight:23,color:palette.muted,marginVertical:24},button:{backgroundColor:palette.brand,padding:17,borderRadius:14,alignItems:'center'},
 buttonText:{color:palette.white,fontWeight:'800'},disabled:{opacity:0.4},note:{color:palette.muted,marginTop:20,textAlign:'center'}});
