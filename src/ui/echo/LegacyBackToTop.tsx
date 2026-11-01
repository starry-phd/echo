import {Pressable,StyleSheet,Text} from 'react-native';
import {useLegacyTheme} from './legacyTheme';

/**
 * Public metadata-only version of the original Echo floating back-to-top
 * control. The parent provides its own actual React Native ScrollView ref,
 * rather than querying DOM, audio elements or private data.
 */
export function LegacyBackToTop({onPress}:{onPress:()=>void}){
 const theme=useLegacyTheme();
 return <Pressable
  accessibilityRole="button"
  accessibilityLabel="回到頁面最前面"
  accessibilityHint="捲動至本頁頂部，不變更目前的公開篩選條件"
  onPress={onPress}
  hitSlop={4}
  style={[styles.button,{
   backgroundColor:theme.dark?'rgba(15,23,42,0.84)':'rgba(255,255,255,0.84)',
   borderColor:theme.border
  }]}>
  <Text style={[styles.arrow,{color:theme.palette.primary}]}>↑</Text>
 </Pressable>;
}
const styles=StyleSheet.create({
 button:{position:'absolute',left:'50%',bottom:24,transform:[{translateX:-29}],
  width:58,height:58,borderRadius:29,borderWidth:1,alignItems:'center',justifyContent:'center',
  zIndex:40,elevation:8,shadowColor:'#111827',shadowOffset:{width:0,height:4},
  shadowOpacity:0.2,shadowRadius:12},
 arrow:{fontSize:32,lineHeight:38,fontWeight:'900'}
});
