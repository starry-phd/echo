import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { centralMemberApiState } from '../src/auth/centralMember';
import { palette } from '../src/theme';

export default function ProfileScreen() {
  const state = centralMemberApiState();
  return <SafeAreaView style={styles.root}><View style={styles.card}>
    <Text style={styles.title}>繁星中央會員</Text>
    <Text style={styles.body}>新版繁星回聲的會員基本資料由「繁星中央會員 API」管理，不保留獨立的會員基本資料庫。</Text>
    <Text style={styles.status}>目前狀態：{state === 'not-configured' ? 'API 網址待提供' : 'API 契約待驗證'}</Text>
    <Text style={styles.body}>預定中央 D1 名稱：id-starry。跨 H-Global 帳號綁定將由中央會員服務，在雙方身分驗證與授權完成後處理。</Text>
    <Text style={styles.warning}>串接完成前不開放登入，避免錯誤綁定或顯示錯誤個資。</Text>
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:palette.paper,padding:20},card:{padding:24,borderRadius:20,backgroundColor:palette.white},
 title:{fontSize:24,fontWeight:'800',color:palette.ink,marginBottom:16},
 body:{lineHeight:24,color:palette.muted,marginBottom:18},
 status:{color:palette.brand,fontWeight:'800',marginBottom:18},
 warning:{color:palette.danger,fontWeight:'700',lineHeight:22}
});
