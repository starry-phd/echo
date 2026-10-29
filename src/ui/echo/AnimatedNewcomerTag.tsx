import {useEffect,useRef} from 'react';
import {Animated,Easing,StyleSheet,Text,View} from 'react-native';

/** React Native-compatible approximation of the old 2.4s moving rainbow
 * 1px category outline, only used for the exact '新人' category.
 * Inner fill stays the legacy theme's light pill background.
 */
const colors=['#ff3b30','#ff9500','#ffcc00','#34c759','#00c7be','#007aff','#af52de'];
export function AnimatedNewcomerTag({fill,textColor}:{fill:string;textColor:string}){
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  const loop=Animated.loop(Animated.timing(progress,{
   toValue:1,duration:2400,easing:Easing.linear,useNativeDriver:true
  }));
  loop.start();return()=>loop.stop();
 },[progress]);
 // 7 stripes * 12 px = one complete repeating rainbow cycle.
 const shift=progress.interpolate({inputRange:[0,1],outputRange:[0,-84]});
 return <View style={styles.outer} accessibilityLabel="分類：新人">
  <Animated.View pointerEvents="none" style={[styles.rainbow,{transform:[{translateX:shift}]}]}>
   {Array.from({length:3},(_,cycle)=>colors.map((color,i)=>
    <View key={cycle+'-'+i} style={{width:12,backgroundColor:color}}/>)}
  </Animated.View>
  <View style={[styles.inner,{backgroundColor:fill}]}>
   <Text style={[styles.text,{color:textColor}]}>新人</Text>
  </View>
 </View>;
}
const styles=StyleSheet.create({
 outer:{borderRadius:999,overflow:'hidden',alignSelf:'flex-start',
  minHeight:21,justifyContent:'center'},
 rainbow:{position:'absolute',left:0,top:0,bottom:0,width:252,
  flexDirection:'row'},
 inner:{margin:1,borderRadius:999,paddingHorizontal:7,paddingVertical:4,
  alignItems:'center',justifyContent:'center'},
 text:{fontSize:10,fontWeight:'600',lineHeight:12}
});
