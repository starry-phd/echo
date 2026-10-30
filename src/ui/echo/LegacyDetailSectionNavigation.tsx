import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';
import type {DetailSectionId} from './detailSectionScroll';

const entries:readonly {id:DetailSectionId;label:string}[]=[
 {id:'playback',label:'▶ 播放區'},
 {id:'notes',label:'▤ 演講資訊'},
 {id:'engagement',label:'★ 評價與心得'},
 {id:'device',label:'♡ 我的收藏'}
];

/** Compact quick links for actual on-screen sections, not private audio
 * or user-generated comment anchors. Guest preview excludes playback. */
export function LegacyDetailSectionNavigation({showPlayback,onJump}:{
 showPlayback:boolean;onJump:(section:DetailSectionId)=>void;
}){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 return <View style={[styles.container,{borderColor:t.border,backgroundColor:t.lightPill}]}>
  <Text style={[styles.heading,{color:t.ink,fontSize:fontSize(14)}]}>快速前往本頁內容</Text>
  <View style={styles.links}>
   {entries.filter(item=>showPlayback||item.id!=='playback').map(item=>
    <Pressable key={item.id} accessibilityRole="button"
     accessibilityLabel={'跳至'+item.label.replace(/^[^\p{L}\p{N}]+/u,'')+'區塊'}
     onPress={()=>onJump(item.id)}
     style={[styles.button,{borderColor:t.border,backgroundColor:t.card}]}>
     <Text style={[styles.label,{color:t.palette.primary,fontSize:fontSize(12)}]}>{item.label}</Text>
    </Pressable>)}
  </View>
  {!showPlayback&&<Text style={[styles.note,{color:t.muted,fontSize:fontSize(11)}]}>
   這張卡片只展示已核准的演講資訊，不提供音訊播放。
  </Text>}
 </View>;
}
const styles=StyleSheet.create({
 container:{padding:11,borderWidth:1,borderRadius:14,marginBottom:12,gap:8},
 heading:{fontWeight:'900'},
 links:{flexDirection:'row',flexWrap:'wrap',gap:7},
 button:{minHeight:44,paddingHorizontal:12,borderWidth:1,borderRadius:11,alignItems:'center',justifyContent:'center'},
 label:{fontWeight:'800'},
 note:{lineHeight:18}
});
