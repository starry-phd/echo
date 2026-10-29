import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useLegacyTheme} from './legacyTheme';
export function AdvancedCardFilters({ranks,selectedRank,onRank}:{ranks:string[];selectedRank:string|null;onRank:(rank:string|null)=>void}){
 const t=useLegacyTheme();
 return <View style={[styles.panel,{backgroundColor:t.lightPill,borderColor:t.border}]}>
  <Text style={[styles.heading,{color:t.ink}]}>講師獎銜</Text>
  <View style={styles.choices}>
   {[null,...ranks].map(rank=><Pressable key={rank??'all'} accessibilityRole="button"
    accessibilityLabel={'講師獎銜：'+(rank??'全部')} accessibilityState={{selected:selectedRank===rank}}
    onPress={()=>onRank(rank)} style={[styles.choice,{backgroundColor:selectedRank===rank?t.palette.primary:t.card,borderColor:t.border}]}>
    <Text style={[styles.label,{color:selectedRank===rank?'#fff':t.ink}]}>{rank??'全部獎銜'}</Text>
   </Pressable>)}
  </View>
  <Text style={[styles.note,{color:t.muted}]}>依作品當時的講師獎銜篩選。網友關鍵字與貼紙篩選尚未開放。</Text>
 </View>;
}
const styles=StyleSheet.create({
 panel:{borderWidth:1,borderRadius:14,padding:12,gap:10},heading:{fontSize:13,fontWeight:'800'},
 choices:{flexDirection:'row',flexWrap:'wrap',gap:6},choice:{minHeight:44,paddingHorizontal:12,borderWidth:1,borderRadius:12,justifyContent:'center'},
 label:{fontSize:12,fontWeight:'700'},note:{fontSize:11,lineHeight:17}
});
