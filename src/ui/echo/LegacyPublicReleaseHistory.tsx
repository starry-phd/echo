import {useState} from 'react';
import {Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useLegacyTheme} from './legacyTheme';
import {useFontZoom} from './FontZoom';
import {PUBLIC_RELEASE_HISTORY_AS_OF,publicReleaseHistory} from './publicReleaseHistory';

/** Original App.tsx footer's small "!" opens the version history.
 * The old editable changelog contains private/member features, so the
 * migration shows ONLY explicitly verified public guest UI milestones.
 * No remote changelog read, member identity, or admin editing exists here.
 */
export function LegacyPublicReleaseHistory(){
 const [open,setOpen]=useState(false);
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const close=()=>setOpen(false);
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel="查看版本改版紀錄"
   accessibilityHint="查看目前繁星回聲已推出的公開訪客功能節錄"
   onPress={()=>setOpen(true)} hitSlop={9}
   style={[styles.trigger,{backgroundColor:t.lightPill,borderColor:t.border}]}>
   <Text style={[styles.triggerText,{color:t.palette.primary,fontSize:fontSize(12)}]}>!</Text>
  </Pressable>
  <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
   <View style={styles.overlay} accessibilityViewIsModal onAccessibilityEscape={close}>
    <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button"
     accessibilityLabel="關閉改版紀錄背景" onPress={close}/>
    <View style={[styles.dialog,{backgroundColor:t.card,borderColor:t.border}]}>
     <Text style={[styles.heading,{color:t.ink,fontSize:fontSize(19)}]}>繁星回聲 · 改版歷程</Text>
     <Text style={[styles.intro,{color:t.muted,fontSize:fontSize(12)}]}>
      僅節錄新版已完成驗收的公開訪客功能（截至 {PUBLIC_RELEASE_HISTORY_AS_OF}），不是舊網站的完整版本紀錄。
     </Text>
     <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyContent}
      accessibilityLabel="公開訪客功能改版紀錄">
      {publicReleaseHistory.map(item=><View key={item.id}
       style={[styles.release,{borderColor:t.border,backgroundColor:t.lightPill}]}>
       <Text style={[styles.releaseDate,{color:t.muted,fontSize:fontSize(11)}]}>{item.date}　{item.id}</Text>
       <Text style={[styles.releaseTitle,{color:t.ink,fontSize:fontSize(15)}]}>{item.title}</Text>
       {item.changes.map((change,index)=><Text key={index}
        style={[styles.change,{color:t.ink,fontSize:fontSize(12)}]}>• {change}</Text>)}
      </View>)}
     </ScrollView>
     <Text style={[styles.notice,{color:t.muted,fontSize:fontSize(12)}]}>
      公開封面及資訊卡不代表錄音有播放授權；中央會員登入、付費與私人媒體功能尚未開放。
     </Text>
     <Pressable accessibilityRole="button" accessibilityLabel="關閉版本改版紀錄"
      onPress={close} style={[styles.close,{backgroundColor:t.palette.primary}]}>
      <Text style={[styles.closeText,{fontSize:fontSize(14)}]}>關閉</Text>
     </Pressable>
    </View>
   </View>
  </Modal>
 </>;
}

const styles=StyleSheet.create({
 trigger:{width:27,height:27,borderWidth:1,borderRadius:14,justifyContent:'center',alignItems:'center'},
 triggerText:{fontWeight:'900'},
 overlay:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.55)',padding:14},
 dialog:{width:'100%',maxWidth:510,maxHeight:'88%',padding:16,borderWidth:1,borderRadius:20,gap:11},
 heading:{fontSize:19,fontWeight:'900'},
 intro:{fontSize:12,lineHeight:20},
 historyScroll:{flexShrink:1,minHeight:0},
 historyContent:{gap:10,paddingBottom:6},
 release:{borderWidth:1,borderRadius:13,padding:12,gap:5},
 releaseDate:{fontSize:11,fontWeight:'700'},
 releaseTitle:{fontSize:15,fontWeight:'900'},
 change:{fontSize:12,lineHeight:20},
 notice:{fontSize:12,lineHeight:19},
 close:{minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:12},
 closeText:{color:'#fff',fontWeight:'900'}
});
