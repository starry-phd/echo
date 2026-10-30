import {useRef,useState} from 'react';
import {PanResponder,StyleSheet,View} from 'react-native';
import type {GestureResponderEvent} from 'react-native';
import {canBeginPlaybackScrub,scrubTimeFromDelta} from '../../media/legacyPlaybackControls';
import {clampSeekTime} from '../../media/playback';

/** Thumb-only drag for verified public audio. The preview route never mounts this control. */
export function LegacyPlaybackTimeline({currentTime,duration,enabled,color,trackColor,onSeek}:{
 currentTime:number;duration:number;enabled:boolean;color:string;trackColor:string;
 onSeek:(seconds:number)=>void;
}){
 const [width,setWidth]=useState(0);
 const [dragTime,setDragTime]=useState<number|null>(null);
 const live=useRef({currentTime,duration,enabled,width,onSeek});
 live.current={currentTime,duration,enabled,width,onSeek};
 const dragStart=useRef<number|null>(null);
 const pan=useRef(PanResponder.create({
  onStartShouldSetPanResponder:(event:GestureResponderEvent)=>{
   const v=live.current;
   const allowed=v.enabled&&canBeginPlaybackScrub(event.nativeEvent.locationX,v.currentTime,v.duration,v.width);
   dragStart.current=allowed?v.currentTime:null;
   return allowed;
  },
  onMoveShouldSetPanResponder:()=>dragStart.current!==null,
  onPanResponderMove:(_event,gesture)=>{
   const start=dragStart.current,v=live.current;
   if(start!==null&&v.enabled)setDragTime(scrubTimeFromDelta(start,gesture.dx,v.duration,v.width));
  },
  onPanResponderRelease:(_event,gesture)=>{
   const start=dragStart.current,v=live.current;
   dragStart.current=null;
   setDragTime(null);
   if(start!==null&&v.enabled)v.onSeek(scrubTimeFromDelta(start,gesture.dx,v.duration,v.width));
  },
  onPanResponderTerminate:()=>{dragStart.current=null;setDragTime(null);},
  onPanResponderTerminationRequest:()=>false
 })).current;
 const safeDuration=Number.isFinite(duration)&&duration>0?duration:0;
 const shown=clampSeekTime(dragTime??currentTime,safeDuration);
 const fraction=safeDuration>0?shown/safeDuration:0;
 return <View accessible accessibilityRole="adjustable"
   accessibilityLabel="播放進度，按住目前播放位置的圓點拖曳"
   accessibilityState={{disabled:!enabled}}
   accessibilityValue={{min:0,max:Math.ceil(safeDuration),now:Math.floor(shown)}}
   accessibilityActions={[{name:'increment',label:'快進10秒'},{name:'decrement',label:'倒退10秒'}]}
   onAccessibilityAction={event=>{
    if(!enabled)return;
    const next=event.nativeEvent.actionName==='increment'?10:
     event.nativeEvent.actionName==='decrement'?-10:0;
    if(next!==0)onSeek(clampSeekTime(currentTime+next,safeDuration));
   }}
   onLayout={event=>setWidth(event.nativeEvent.layout.width)}
   {...pan.panHandlers} style={styles.hitArea}>
  <View style={[styles.track,{backgroundColor:trackColor}]}>
   <View style={[styles.fill,{width:Math.max(0,width*fraction),backgroundColor:color}]}/>
  </View>
  <View style={[styles.thumb,{left:Math.max(0,Math.min(Math.max(0,width-16),width*fraction-8)),
   backgroundColor:enabled?color:trackColor}]}/>
 </View>;
}
const styles=StyleSheet.create({
 hitArea:{height:38,width:'100%',justifyContent:'center'},
 track:{height:6,width:'100%',borderRadius:4,overflow:'hidden'},
 fill:{height:6,borderRadius:4},
 thumb:{position:'absolute',top:11,height:16,width:16,borderRadius:8,
  borderWidth:2,borderColor:'#fff',elevation:1}
});
