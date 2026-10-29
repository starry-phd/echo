import {ScrollView,StyleSheet,Text,View} from 'react-native';
import {centralMemberApiState} from '../src/auth/centralMember';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {visualMetrics} from '../packages/ui/src/tokens';
export default function ProfileScreen(){
 const t=useLegacyTheme();
 const state=centralMemberApiState();
 return <ScrollView style={[styles.root,{backgroundColor:t.bg}]}
  contentContainerStyle={styles.content}>
  <View style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
   <View style={[styles.avatar,{backgroundColor:t.lightPill}]}>
    <Text style={[styles.avatarIcon,{color:t.palette.primary}]}>♙</Text>
   </View>
   <Text style={[styles.title,{color:t.ink}]}>繁星中央會員</Text>
   <Text style={[styles.body,{color:t.muted}]}>會員基本資料由「繁星中央會員 API」統一管理，不另外儲存會員基本資料。</Text>
   <View style={[styles.statusBox,{backgroundColor:t.lightPill}]}>
    <Text style={[styles.status,{color:t.palette.primary}]}>
     {state==='not-configured'?'API 尚未設定':'會員 API 契約待驗證'}
    </Text>
   </View>
   <Text style={[styles.body,{color:t.muted}]}>預定中央資料庫：id-starry。跨生態系綁定需要雙方的身分驗證及正式授權。</Text>
   <Text style={styles.warning}>登入、會員收藏同步及購買尚未開放；本裝置收藏可由主選單查看。</Text>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1},content:{paddingHorizontal:12,paddingTop:18,paddingBottom:30,alignItems:'center'},
 card:{maxWidth:visualMetrics.contentMaxWidth,width:'100%',borderWidth:1,padding:20,borderRadius:21,alignItems:'center'},
 avatar:{width:76,height:76,borderRadius:38,alignItems:'center',justifyContent:'center'},
 avatarIcon:{fontSize:40},title:{fontSize:22,fontWeight:'900',marginTop:12,marginBottom:17},
 body:{fontSize:14,lineHeight:23,marginBottom:18,alignSelf:'stretch'},
 statusBox:{borderRadius:12,padding:12,alignSelf:'stretch',marginBottom:16},
 status:{fontSize:14,fontWeight:'900'},
 warning:{color:'#b8324e',fontWeight:'800',lineHeight:22,fontSize:13,alignSelf:'stretch'}
});
