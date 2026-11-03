import {ScrollView,StyleSheet,Text,View} from 'react-native';
import {useLegacyTheme} from '../src/ui/echo/legacyTheme';
import {useFontZoom} from '../src/ui/echo/FontZoom';
import {visualMetrics} from '../packages/ui/src/tokens';
import {PRIVACY_APP_NAME,PRIVACY_POLICY_SECTIONS,PRIVACY_POLICY_UPDATED} from '../src/legal/privacyPolicy';

/** Public privacy policy, statically exported to /privacy for App Store / Google Play. */
export default function PrivacyScreen(){
 const t=useLegacyTheme();
 const {fontSize}=useFontZoom();
 return <ScrollView focusable accessibilityLabel="隱私權政策全文" style={[styles.root,{backgroundColor:t.bg}]} contentContainerStyle={styles.page}>
  <View style={styles.shell}>
   <Text accessibilityRole="header" style={[styles.title,{color:t.ink,fontSize:fontSize(24)}]}>隱私權政策</Text>
   <Text style={[styles.meta,{color:t.muted,fontSize:fontSize(13)}]}>{PRIVACY_APP_NAME}｜最後更新：{PRIVACY_POLICY_UPDATED}</Text>
   <View style={[styles.card,{backgroundColor:t.card,borderColor:t.border}]}>
    {PRIVACY_POLICY_SECTIONS.map(section=><View key={section.heading} style={styles.section}>
     <Text accessibilityRole="header" style={[styles.heading,{color:t.accentText,fontSize:fontSize(17)}]}>{section.heading}</Text>
     {section.paragraphs.map((paragraph,index)=><Text key={index} selectable
      style={[styles.copy,{color:t.ink,fontSize:fontSize(14)}]}>{paragraph}</Text>)}
    </View>)}
   </View>
  </View>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1},page:{alignItems:'center',paddingHorizontal:12,paddingTop:18,paddingBottom:40},
 shell:{width:'100%',maxWidth:visualMetrics.contentMaxWidth},
 title:{fontWeight:'900'},
 meta:{lineHeight:21,marginTop:6,marginBottom:12},
 card:{padding:20,borderRadius:19,borderWidth:1,gap:20},
 section:{gap:8},
 heading:{fontWeight:'900'},
 copy:{lineHeight:24}
});
