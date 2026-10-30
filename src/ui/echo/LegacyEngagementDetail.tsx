import {useEffect,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {EchoTrack} from '../../types';
import {useFontZoom} from './FontZoom';
import {useLegacyTheme} from './legacyTheme';
import {historicalCountLabel,readHistoricalEngagement} from './legacyEngagementSnapshot';

type Tab='ratings'|'comments';
/** Original DetailView's 評價 / 心得收穫 navigation; aggregates are strictly
 * old, approved, read-only metadata, never member reviews or mutable scores. */
export function LegacyEngagementDetail({track}:{track:EchoTrack}){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const [tab,setTab]=useState<Tab>('ratings');
 useEffect(()=>setTab('ratings'),[track.id]);
 const snapshot=readHistoricalEngagement(track);
 const count=tab==='ratings'?snapshot?.ratingCount??null:snapshot?.commentsCount??null;
 return <View style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
  <Text style={[styles.heading,{color:t.ink,fontSize:fontSize(17)}]}>評價與心得收穫</Text>
  <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="音檔評價與心得分頁">
   {([{id:'ratings',label:'評價'},{id:'comments',label:'心得收穫'}] as const)
    .map(item=><Pressable key={item.id} accessibilityRole="tab"
     accessibilityLabel={item.label} accessibilityState={{selected:tab===item.id}}
     onPress={()=>setTab(item.id)}
     style={[styles.tab,{backgroundColor:tab===item.id?t.palette.primary:t.card,
      borderColor:tab===item.id?t.palette.primary:t.border}]}>
     <Text style={[styles.tabText,{color:tab===item.id?'#fff':t.ink,fontSize:fontSize(13)}]}>
      {item.label}</Text>
    </Pressable>)}
  </View>
  <View style={[styles.panel,{backgroundColor:t.lightPill}]}>
   <Text style={[styles.value,{color:t.ink,fontSize:fontSize(15)}]}>
    {tab==='ratings'
     ? '★ '+(snapshot?.rating===null||snapshot?.rating===undefined?'未提供':snapshot.rating.toFixed(1))
       +'　評價人次：'+historicalCountLabel(count)
     : '歷史心得篇數：'+historicalCountLabel(count)}
   </Text>
   {tab==='comments'&&<Text style={[styles.meta,{color:t.muted,fontSize:fontSize(12)}]}>
    歷史按讚數：{historicalCountLabel(snapshot?.likes??null)}
   </Text>}
   <Text style={[styles.meta,{color:t.muted,fontSize:fontSize(12)}]}>
    {snapshot?'以上僅為已核准的舊版歷史統計（唯讀），不是現在的會員評價或個人心得。'
     :'目前尚無經核准公開的歷史評價／心得統計；不能判定為零筆。'}
   </Text>
  </View>
  <Text style={[styles.meta,{color:t.muted,fontSize:fontSize(12)}]}>
   真實會員評分、心得清單、回覆與按讚，須等 Starry ID 身分及 Echo 業務 API 正式授權後才能使用。
  </Text>
 </View>;
}
const styles=StyleSheet.create({
 card:{borderWidth:1,borderRadius:17,padding:13,gap:12,marginTop:12},
 heading:{fontSize:17,fontWeight:'900'},
 tabs:{flexDirection:'row',gap:8},
 tab:{flex:1,minHeight:48,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:5},
 tabText:{fontWeight:'800'},
 panel:{borderRadius:13,padding:14,gap:8,minHeight:126,justifyContent:'center'},
 value:{fontWeight:'800',lineHeight:25},
 meta:{lineHeight:20}
});
