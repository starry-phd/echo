import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {useFontZoom} from './FontZoom';
import {useLegacyTheme} from './legacyTheme';
import {historicalCountLabel,readHistoricalEngagement} from './legacyEngagementSnapshot';

/** Original DetailView's compact rating / comments / likes strip.
 * Only an explicitly approved legacy snapshot is rendered. Every value is
 * read-only; the comments affordance only jumps to the historical summary. */
export function LegacyDetailEngagementSummary({track,onViewEngagement}:{
 track:EchoTrack;onViewEngagement:()=>void;
}){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const snapshot=readHistoricalEngagement(track);
 if(!snapshot)return null;
 const rounded=snapshot.rating===null?0:Math.max(0,Math.min(5,Math.round(snapshot.rating)));
 const stars=snapshot.rating===null?'—':'★'.repeat(rounded)+'☆'.repeat(5-rounded);
 const rating=snapshot.rating===null?'未提供':snapshot.rating.toFixed(1);
 return <View style={styles.container} accessibilityLabel="舊版歷史互動統計，僅供唯讀">
  <View style={styles.row}>
   <View style={styles.rating} accessibilityLabel={'歷史評價 '+rating+'，評價人次 '+historicalCountLabel(snapshot.ratingCount)}>
    <Text style={[styles.stars,{fontSize:fontSize(16)}]}>{stars}</Text>
    <Text style={[styles.value,{color:t.ink,fontSize:fontSize(11)}]}>
     {rating} ({historicalCountLabel(snapshot.ratingCount)})
    </Text>
   </View>
   <Text style={[styles.separator,{color:t.border}]}>|</Text>
   <Pressable accessibilityRole="button"
    accessibilityLabel={'查看歷史心得統計，共 '+historicalCountLabel(snapshot.commentsCount)+' 篇'}
    onPress={onViewEngagement} style={styles.action}>
    <Text style={[styles.value,{color:t.muted,fontSize:fontSize(12)}]}>
     ▤ {historicalCountLabel(snapshot.commentsCount)}
    </Text>
   </Pressable>
   <Text style={[styles.separator,{color:t.border}]}>|</Text>
   <View style={styles.action} accessibilityLabel={'歷史按讚 '+historicalCountLabel(snapshot.likes)}>
    <Text style={[styles.value,{color:t.muted,fontSize:fontSize(12)}]}>
     ♡ {historicalCountLabel(snapshot.likes)}
    </Text>
   </View>
  </View>
  <Text style={[styles.caption,{color:t.muted,fontSize:fontSize(9)}]}>
   舊版統計（唯讀）
  </Text>
 </View>;
}
const styles=StyleSheet.create({
 container:{alignItems:'center',gap:3,paddingTop:2,paddingBottom:3},
 row:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:8,minHeight:28},
 rating:{flexDirection:'row',alignItems:'center',gap:4,minHeight:32},
 stars:{color:'#d69e25',letterSpacing:0.3},
 value:{fontWeight:'700',fontVariant:['tabular-nums']},
 separator:{fontSize:11},
 action:{minHeight:40,justifyContent:'center',paddingHorizontal:2},
 caption:{lineHeight:14}
});
