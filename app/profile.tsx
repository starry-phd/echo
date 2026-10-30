import {useState} from 'react';
import {router} from 'expo-router';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {centralMemberApiState} from '../src/auth/centralMember';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {useFontZoom} from '../src/ui/echo/FontZoom';
import {legacyProfileTabs,profileGateCopy} from '../src/ui/echo/legacyProfileTabs';
import type {LegacyProfileTab} from '../src/ui/echo/legacyProfileTabs';
import {visualMetrics} from '../packages/ui/src/tokens';

/** Public navigation parity only. No old member credentials, profile or playback history. */
export default function ProfileScreen(){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const state=centralMemberApiState();
 const [tab,setTab]=useState<LegacyProfileTab>('profile');
 return <ScrollView style={[styles.root,{backgroundColor:t.bg}]}
  contentContainerStyle={styles.content}>
  <View style={styles.shell}>
   <View style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
    <View style={[styles.avatar,{backgroundColor:t.lightPill}]}>
     <Text style={[styles.avatarIcon,{color:t.palette.primary}]}>♙</Text>
    </View>
    <Text style={[styles.title,{color:t.ink,fontSize:fontSize(22)}]}>繁星中央會員</Text>
    <Text style={[styles.body,{color:t.muted,fontSize:fontSize(14)}]}>會員基本資料由「繁星中央會員 API」統一管理，不另外儲存會員基本資料。</Text>
    <View style={[styles.statusBox,{backgroundColor:t.lightPill}]}>
     <Text style={[styles.status,{color:t.palette.primary,fontSize:fontSize(14)}]}>
      {state==='not-configured'?'API 尚未設定':'會員 API 契約待驗證'}
     </Text>
    </View>
    <Text style={[styles.body,{color:t.muted,fontSize:fontSize(13)}]}>預定中央資料庫：id-starry。跨生態系綁定需要雙方的身分驗證及正式授權。</Text>
    <Text style={[styles.warning,{fontSize:fontSize(13)}]}>登入、會員收藏同步及購買尚未開放。以下分頁只是原版介面入口，尚未讀取個人紀錄。</Text>
   </View>
   <View accessibilityRole="tablist" style={styles.tabs}>
    {legacyProfileTabs.map(item=><Pressable key={item.id}
     accessibilityRole="tab" accessibilityLabel={item.label}
     accessibilityState={{selected:tab===item.id}} onPress={()=>setTab(item.id)}
     style={[styles.tab,{borderColor:tab===item.id?t.palette.primary:t.border,
      backgroundColor:tab===item.id?t.card:t.lightPill}]}>
     <Text style={[styles.tabLabel,{color:tab===item.id?t.palette.primary:t.ink,fontSize:fontSize(13)}]}>{item.label}</Text>
    </Pressable>)}
   </View>
   <View style={[styles.section,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.sectionTitle,{color:t.palette.primary,fontSize:fontSize(18)}]}>
     {legacyProfileTabs.find(item=>item.id===tab)?.label}
    </Text>
    <Text style={[styles.sectionText,{color:t.ink,fontSize:fontSize(14)}]}>{profileGateCopy[tab]}</Text>
    {tab==='profile'&&<Text style={[styles.sectionText,{color:t.muted,fontSize:fontSize(12)}]}>
     原版的個人資料編輯、頭像與生命靈數九宮格須先取得本人已驗證且准許顯示的資料，不能從舊站直接移入。
    </Text>}
    {tab==='listening'&&<Text style={[styles.sectionText,{color:t.muted,fontSize:fontSize(12)}]}>
     本裝置收藏目前仍可使用，但不代表已聆聽，也不會授權私人音訊播放。
    </Text>}
    {(tab==='profile'||tab==='listening')&&<Pressable
     accessibilityRole="button" accessibilityLabel="查看我的收藏（僅本裝置）"
     onPress={()=>router.push('/favorites')}
     style={[styles.action,{backgroundColor:t.palette.primary}]}>
     <Text style={[styles.actionLabel,{fontSize:fontSize(13)}]}>查看我的收藏（本裝置）</Text>
    </Pressable>}
    <Text style={[styles.sectionText,{color:t.muted,fontSize:fontSize(12)}]}>
     尚未接通會員 API，不能以「目前沒有紀錄」取代真實查詢結果。
    </Text>
   </View>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1},content:{paddingHorizontal:12,paddingTop:18,paddingBottom:30,alignItems:'center'},
 shell:{width:'100%',maxWidth:visualMetrics.contentMaxWidth},
 card:{width:'100%',borderWidth:1,padding:18,borderRadius:21,alignItems:'center'},
 avatar:{width:76,height:76,borderRadius:38,alignItems:'center',justifyContent:'center'},
 avatarIcon:{fontSize:40},title:{fontSize:22,fontWeight:'900',marginTop:12,marginBottom:14},
 body:{fontSize:14,lineHeight:23,marginBottom:12,alignSelf:'stretch'},
 statusBox:{borderRadius:12,padding:12,alignSelf:'stretch',marginBottom:12},
 status:{fontSize:14,fontWeight:'900'},
 warning:{color:'#b8324e',fontWeight:'800',lineHeight:22,fontSize:13,alignSelf:'stretch'},
 tabs:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14,marginBottom:9},
 tab:{flexGrow:1,flexBasis:'45%',minHeight:48,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
 tabLabel:{fontWeight:'800',textAlign:'center'},
 section:{borderWidth:1,borderRadius:19,padding:18,gap:13},
 sectionTitle:{fontSize:18,fontWeight:'900'},sectionText:{fontSize:14,lineHeight:22},
 action:{minHeight:48,paddingHorizontal:17,borderRadius:12,alignItems:'center',justifyContent:'center',alignSelf:'flex-start'},
 actionLabel:{color:'#fff',fontWeight:'900'}
});
