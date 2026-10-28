import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { getCategories, getPublicTracks } from '../src/api/client';
import type { EchoTrack } from '../src/types';
import { palette } from '../src/theme';
import { StarryFilterChip } from '../packages/ui/src';

export default function CatalogScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const tracksQuery = useQuery({
    queryKey: ['echo', 'public-tracks', query, category],
    queryFn: ({ signal }) => getPublicTracks(signal, { query, category: category ?? undefined }),
    retry: 1,
  });
  const categoriesQuery = useQuery({
    queryKey: ['echo', 'categories'],
    queryFn: ({ signal }) => getCategories(signal),
    retry: 1,
  });
  const tracks = tracksQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const loading = tracksQuery.isPending;
  const error = tracksQuery.error instanceof Error ? tracksQuery.error.message : null;

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
        <TextInput
          accessibilityLabel="搜尋講座或講師"
          style={styles.search} placeholder="搜尋講座或講師名稱"
          placeholderTextColor={palette.muted}
          value={query} onChangeText={setQuery} autoCapitalize="none"
          returnKeyType="search" maxLength={100}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}
          contentContainerStyle={styles.filterItems}>
          {[null, ...categories].map(value => (
            <StarryFilterChip key={value ?? 'all'} label={value ?? '全部'}
              selected={category === value} onPress={() => setCategory(value)} />
          ))}
        </ScrollView>
        <Text style={styles.note}>目前只顯示完成媒體驗證並核准公開的音檔。</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={palette.brand} /> : error ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>新版建置中</Text><Text style={styles.emptyText}>{error}</Text></View>
      ) : (
        <FlatList data={tracks} keyExtractor={item => item.id} contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>目前沒有可公開的音檔</Text><Text style={styles.emptyText}>媒體與會員授權驗收完成後，內容將在這裡出現。</Text></View>}
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
 memberText:{color:palette.brand,fontWeight:'800'},
 section:{marginHorizontal:20,marginTop:22,marginBottom:12},
 sectionTitle:{fontSize:20,fontWeight:'800',color:palette.ink},
 search:{marginTop:14,borderColor:palette.border,borderWidth:1,backgroundColor:palette.white,borderRadius:14,padding:13,color:palette.ink,fontSize:15},
 filters:{marginTop:12},filterItems:{alignItems:'center',gap:8,paddingVertical:3},
 chip:{borderRadius:18,paddingHorizontal:16,paddingVertical:8,borderWidth:1,borderColor:palette.border,backgroundColor:palette.white},
 chipSelected:{backgroundColor:palette.brand,borderColor:palette.brand},
 chipText:{color:palette.muted,fontSize:13,fontWeight:'700'},
 chipTextSelected:{color:palette.white},
 note:{color:palette.muted,marginTop:10,lineHeight:20},
 list:{padding:20,paddingTop:0},card:{backgroundColor:palette.white,borderRadius:18,padding:20,marginVertical:7,borderColor:palette.border,borderWidth:1},
 cardTitle:{fontSize:16,fontWeight:'700',color:palette.ink},cardMeta:{color:palette.muted,marginTop:8},
 empty:{margin:20,padding:26,backgroundColor:palette.white,borderRadius:18},
 emptyTitle:{fontWeight:'800',fontSize:18,color:palette.ink,marginBottom:10},
 emptyText:{color:palette.muted,lineHeight:22}
});
