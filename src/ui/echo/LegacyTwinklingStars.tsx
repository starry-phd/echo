import {useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Platform,StyleSheet,View} from 'react-native';
import {useLegacyTheme} from './legacyTheme';
import {LEGACY_TWINKLE_CROSS_OPACITY,LEGACY_TWINKLE_PLACEMENTS,LEGACY_TWINKLE_SPEEDS,
 LEGACY_TWINKLE_STAR_WAIST,legacyTwinkleFieldOpacity,legacyTwinkleFrames,
 legacyTwinkleInputRange,legacyTwinklingStars} from './legacyTwinklingStars';
import type {LegacyTwinklePlacement,LegacyTwinkleStar} from './legacyTwinklingStars';

const percent=(value:number)=>`${value}%` as const;

/** Original 繁星閃爍特效 (TwinklingStars.tsx) as a decorative, non-interactive
 * background layer. It reads no data and never touches audio or storage.
 * Motion waits for the reduce-motion preference; when reduced, every star holds
 * its original inline opacity and centring, exactly as the old global CSS rule
 * left them after cancelling the animation.
 */
export function LegacyTwinklingStars({placement}:{placement:LegacyTwinklePlacement}){
 const {dark}=useLegacyTheme();
 const density=LEGACY_TWINKLE_PLACEMENTS[placement].density;
 const stars=useMemo(()=>legacyTwinklingStars(density),[density]);
 const clocks=useRef(LEGACY_TWINKLE_SPEEDS.map(speed=>({speed,value:new Animated.Value(0)}))).current;
 const [allowMotion,setAllowMotion]=useState(false);
 useEffect(()=>{
  let mounted=true;
  const update=(reduced:boolean)=>{if(mounted)setAllowMotion(!reduced);};
  void AccessibilityInfo.isReduceMotionEnabled().then(update,()=>update(true));
  let subscription:ReturnType<typeof AccessibilityInfo.addEventListener>|null=null;
  try{subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',update);}catch{
   // Unsupported platforms keep the initial accessibility preference.
  }
  return ()=>{mounted=false;subscription?.remove();};
 },[]);
 useEffect(()=>{
  const reset=()=>clocks.forEach(({value})=>{value.stopAnimation();value.setValue(0);});
  if(!allowMotion){reset();return;}
  const loops=clocks.map(({speed,value})=>Animated.loop(Animated.timing(value,{
   toValue:1,duration:speed.durationMs,easing:Easing.linear,useNativeDriver:Platform.OS!=='web'
  })));
  loops.forEach(loop=>loop.start());
  return ()=>{loops.forEach(loop=>loop.stop());reset();};
 },[allowMotion,clocks]);
 const motion=useMemo(()=>allowMotion?stars.map(star=>{
  const clock=clocks.find(({speed})=>speed.id===star.speed)?.value;
  if(!clock)return null;
  const frames=legacyTwinkleFrames(star);
  return {
   opacity:clock.interpolate({inputRange:legacyTwinkleInputRange,outputRange:frames.opacity}),
   scale:clock.interpolate({inputRange:legacyTwinkleInputRange,outputRange:frames.scale})
  };
 }):null,[allowMotion,stars,clocks]);

 return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
   style={[styles.field,{opacity:legacyTwinkleFieldOpacity(placement,dark)}]}>
  {stars.map((star,i)=>{
   const box={top:percent(star.top),left:percent(star.left),width:star.size,height:star.size};
   const animated=motion?.[i];
   if(!animated)return <View key={star.id} style={[styles.star,box,
    {marginLeft:-star.size/2,marginTop:-star.size/2,opacity:star.opacity}]}>
    <LegacyStarShape star={star}/>
   </View>;
   // Like the browser, the running keyframe transform replaces the inline
   // translate(-50%,-50%), so animated stars are anchored at their top-left.
   return <Animated.View key={star.id} style={[styles.star,box,
    {opacity:animated.opacity,transform:[{scale:animated.scale}]}]}>
    <LegacyStarShape star={star}/>
   </Animated.View>;
  })}
 </View>;
}

/** sparkle/cross: two crossing rhombi = the original four-point SVG polygon. */
function LegacyStarShape({star}:{star:LegacyTwinkleStar}){
 if(star.type==='dot')return <View style={[styles.fill,{borderRadius:star.size/2,
  backgroundColor:star.color,boxShadow:`0 0 ${star.size*2}px ${star.color}`}]}/>;
 const waist=LEGACY_TWINKLE_STAR_WAIST[star.type];
 const side=star.size/Math.SQRT2;
 const square=[styles.square,{width:side,height:side,left:(star.size-side)/2,top:(star.size-side)/2,
  backgroundColor:star.color},star.type==='sparkle'?styles.sparkleGlow:null];
 return <View style={[styles.fill,{opacity:star.type==='cross'?LEGACY_TWINKLE_CROSS_OPACITY:1}]}>
  <View style={[styles.fill,{transform:[{scaleX:waist}]}]}><View style={square}/></View>
  <View style={[styles.fill,{transform:[{scaleY:waist}]}]}><View style={square}/></View>
 </View>;
}

const styles=StyleSheet.create({
 field:{position:'absolute',top:0,right:0,bottom:0,left:0,overflow:'hidden',pointerEvents:'none'},
 star:{position:'absolute'},
 fill:{position:'absolute',top:0,right:0,bottom:0,left:0},
 square:{position:'absolute',transform:[{rotate:'45deg'}]},
 sparkleGlow:{boxShadow:'0 0 3px rgba(255,255,255,0.7)'}
});
