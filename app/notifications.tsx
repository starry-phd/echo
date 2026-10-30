import {useState} from 'react';
import {router} from 'expo-router';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {useFontZoom} from '../src/ui/echo/FontZoom';
import {notificationGateCopy,visibleNotificationTabs} from '../src/ui/echo/legacyNotifications';
import type {NotificationTab} from '../src/ui/echo/legacyNotifications';
import {visualMetrics} from '../packages/ui/src/tokens';

/**
 * Safe original notifications navigation: identity/reviewer claims must only
 * come from a verified Starry ID session, never old D1 or a client setting.
 * Until that API is ready, all notification payloads remain unavailable.
 */
export default function NotificationsScreen(){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 const [tab,setTab]=useState<NotificationTab>('messages');
 const hasVerifiedReviewerScope=false; // Fail closed until central authorization is connected.
 const tabs=visibleNotificationTabs(hasVerifiedReviewerScope);
 return <ScrollView style={[styles.root,{backgroundColor:t.bg}]} contentContainerStyle={styles.page}>
  <View style={styles.shell}>
   <Text style={[styles.title,{color:t.ink,fontSize:fontSize(24)}]}>通知中心</Text>
   <Text style={[styles.explain,{color:t.muted,fontSize:fontSize(13)}]}>依原版提供「我的訊息／新會員」分頁導覽。「未審核」僅在身分與審核職務獲正式驗證後才會顯示，訪客沒有審核權限。</Text>
   <View accessibilityRole="tablist" style={styles.tabs}>
    {tabs.map(item=><Pressable key={item.id} accessibilityRole="tab"
     accessibilityLabel={item.label} accessibilityState={{selected:tab===item.id}}
     onPress={()=>setTab(item.id)}
     style={[styles.tab,{borderColor:tab===item.id?t.palette.primary:t.border,
      backgroundColor:tab===item.id?t.card:t.lightPill}]}>
     <Text style={[styles.tabLabel,{color:tab===item.id?t.palette.primary:t.ink,fontSize:fontSize(14)}]}>{item.label}</Text>
    </Pressable>)}
   </View>
   <View accessibilityRole="summary" style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
    <Text style={[styles.cardTitle,{color:t.palette.primary,fontSize:fontSize(18)}]}>
     {tabs.find(item=>item.id===tab)?.label}
    </Text>
    <Text style={[styles.copy,{color:t.ink,fontSize:fontSize(14)}]}>{notificationGateCopy[tab]}</Text>
    <Text style={[styles.warning,{color:t.muted,fontSize:fontSize(12)}]}>尚未連接正式通知服務：此處不是「目前沒有通知」，也不提供模擬的已讀、審核或回覆操作。</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="前往中央會員登入說明"
     onPress={()=>router.push('/profile')}
     style={[styles.action,{backgroundColor:t.palette.primary}]}>
     <Text style={[styles.actionLabel,{fontSize:fontSize(14)}]}>查看會員登入進度</Text>
    </Pressable>
   </View>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1},page:{alignItems:'center',paddingHorizontal:12,paddingTop:18,paddingBottom:40},
 shell:{width:'100%',maxWidth:visualMetrics.contentMaxWidth},
 title:{fontSize:24,fontWeight:'900'},
 explain:{fontSize:13,lineHeight:21,marginTop:9,marginBottom:12},
 tabs:{flexDirection:'row',gap:9,flexWrap:'wrap',marginVertical:10},
 tab:{flex:1,minWidth:135,minHeight:48,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
 tabLabel:{fontWeight:'800',textAlign:'center'},
 card:{padding:20,borderRadius:19,borderWidth:1,marginTop:8,gap:14},
 cardTitle:{fontWeight:'900'},copy:{lineHeight:23},
 warning:{lineHeight:21},
 action:{minHeight:48,paddingHorizontal:18,borderRadius:13,alignItems:'center',justifyContent:'center',alignSelf:'flex-start'},
 actionLabel:{fontWeight:'800',color:'#fff'}
});
