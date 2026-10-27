import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getPublicTracks } from '../src/api/client';
import type { EchoTrack } from '../src/types';
import { palette } from '../src/theme';

export default function CatalogScreen() {
  const [tracks, setTracks] = useState<EchoTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctrl = new AbortController();
    getPublicTracks(ctrl.signal).then(setTracks)
      .catch(err => { if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : '讀取失敗'); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>STARRY · ECHO</Text>
        <Text style={styles.title}>好聲音，值得再聽一次。</Text>
        <Text style={styles.subtitle}>讓一段精彩分享，陪你走得更遠。</Text>
        <Pressable style={styles.member} onPress={() => router.push('/profile')}>
          <Text style={styles.memberText}>中央會員入口  ›</Text>
        </Pressable>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>音檔探索</Text>
        <Text style={styles.note}>目前只顯示完成媒體驗證並核准公開的音檔。</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={palette.brand} /> : error ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>新版建置中</Text><Text style={styles.emptyText}>{error}</Text></View>
      ) : (
        <FlatList data={tracks} keyExtractor={item => item.id} contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>音檔尚未開放</Text><Text style={styles.emptyText}>舊資料將在完成備份與核對後逐步上線。</Text></View>}
          renderItem={({item}) => <Pressable style={styles.card} onPress={() => router.push({pathname:'/track/[id]',params:{id:item.id}})}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.speaker} · {Math.max(1,Math.round(item.durationSeconds/60))} 分鐘</Text>
          </Pressable>} />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
 root:{flex:1,backgroundColor:palette.paper},hero:{backgroundColor:palette.brand,paddingHorizontal:24,paddingTop:28,paddingBottom:26},
 eyebrow:{color:palette.accent,fontWeight:'800',letterSpacing:2,fontSize:12,marginBottom:10},
 title:{color:palette.white,fontSize:25,fontWeight:'800',marginBottom:8},
 subtitle:{color:'#ececff',fontSize:14,marginBottom:24},member:{alignSelf:'flex-start',backgroundColor:palette.white,borderRadius:24,paddingHorizontal:16,paddingVertical:11},
 memberText:{color:palette.brand,fontWeight:'800'},section:{marginHorizontal:20,marginTop:25,marginBottom:12},
 sectionTitle:{fontSize:20,fontWeight:'800',color:palette.ink},note:{color:palette.muted,marginTop:8,lineHeight:20},
 list:{padding:20,paddingTop:0},card:{backgroundColor:palette.white,borderRadius:18,padding:20,marginVertical:7,borderColor:palette.border,borderWidth:1},
 cardTitle:{fontSize:16,fontWeight:'700',color:palette.ink},cardMeta:{color:palette.muted,marginTop:8},
 empty:{margin:20,padding:26,backgroundColor:palette.white,borderRadius:18},
 emptyTitle:{fontWeight:'800',fontSize:18,color:palette.ink,marginBottom:10},
 emptyText:{color:palette.muted,lineHeight:22}
});
