import {useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Platform,StyleSheet,View} from 'react-native';
import {legacyBrandWaveFrames,legacyBrandWaveInputRange,
 LEGACY_BRAND_WAVE_BAR_COUNT,LEGACY_BRAND_WAVE_DURATION_MS} from './legacyBrandWaveMotion';

/** Source-faithful navbar's four staggered 1.15s wave bars.
 * Unlike the old CSS-only version, reduced-motion preference is respected,
 * on native as well as Web. No animation runs during SSR or before a11y read.
 */
export function LegacyBrandWave({color}:{color:string}){
 const progress=useRef(new Animated.Value(0)).current;
 const [allowMotion,setAllowMotion]=useState(false);
 useEffect(()=>{
  let mounted=true;
  const update=(reduced:boolean)=>{if(mounted)setAllowMotion(!reduced);};
  void AccessibilityInfo.isReduceMotionEnabled().then(update,()=>update(true));
  let subscription:ReturnType<typeof AccessibilityInfo.addEventListener>|null=null;
  try{subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',update);}catch{
   // Unsupported platforms use the initial accessibility preference.
  }
  return ()=>{mounted=false;subscription?.remove();};
 },[]);
 useEffect(()=>{
  if(!allowMotion){
   progress.stopAnimation();
   progress.setValue(0);
   return;
  }
  const loop=Animated.loop(Animated.timing(progress,{
   toValue:1,duration:LEGACY_BRAND_WAVE_DURATION_MS,
   easing:Easing.linear,useNativeDriver:Platform.OS!=='web'
  }));
  loop.start();
  return ()=>{loop.stop();progress.stopAnimation();progress.setValue(0);};
 },[allowMotion,progress]);

 return <View style={styles.wave} accessible={false} accessibilityElementsHidden
   importantForAccessibility="no-hide-descendants" pointerEvents="none">
  {Array.from({length:LEGACY_BRAND_WAVE_BAR_COUNT},(_,i)=>{
   if(!allowMotion)return <View key={i} style={[styles.staticBar,{backgroundColor:color}]}/>;
   const frames=legacyBrandWaveFrames(i);
   return <Animated.View key={i} style={[styles.bar,{backgroundColor:color,
    opacity:progress.interpolate({inputRange:legacyBrandWaveInputRange,outputRange:frames.opacity}),
    transform:[{scaleY:progress.interpolate({inputRange:legacyBrandWaveInputRange,outputRange:frames.scale})}]
   }]}/>;
  })}
 </View>;
}
const styles=StyleSheet.create({
 wave:{flexDirection:'row',alignItems:'center',gap:3,height:20,marginLeft:3},
 bar:{width:3,height:14,borderRadius:2},
 staticBar:{width:3,height:4,borderRadius:2,opacity:.52}
});
