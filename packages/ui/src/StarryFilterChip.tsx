import {Pressable,StyleSheet,Text} from 'react-native';
import {palette} from './tokens';

export function StarryFilterChip(props:{
 label:string;selected:boolean;onPress:()=>void;
}) {
 return (
  <Pressable accessibilityRole="button" accessibilityState={{selected:props.selected}}
    onPress={props.onPress}
    style={[styles.chip,props.selected&&styles.chipSelected]}>
    <Text style={[styles.text,props.selected&&styles.textSelected]}>{props.label}</Text>
  </Pressable>
 );
}
const styles=StyleSheet.create({
 chip:{borderRadius:18,paddingHorizontal:16,paddingVertical:8,borderWidth:1,borderColor:palette.border,backgroundColor:palette.white},
 chipSelected:{backgroundColor:palette.brand,borderColor:palette.brand},
 text:{color:palette.muted,fontSize:13,fontWeight:'700'},
 textSelected:{color:palette.white},
});
