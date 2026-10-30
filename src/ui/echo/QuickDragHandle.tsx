import {useEffect,useMemo,useRef,useState} from 'react';
import {PanResponder,StyleSheet,Text,View} from 'react-native';
import {quickDragTargetIndex} from './quickActionStore';
import type {QuickActionId} from './quickActionStore';

type Props={
 id:QuickActionId;index:number;count:number;enabled:boolean;color:string;
 onMove:(id:QuickActionId,targetIndex:number)=>void;
 onDragging:(id:QuickActionId|null)=>void;
};
const HOLD_MS=260;
const CANCEL_DISTANCE=10;

/** A dedicated grab handle keeps the checkbox and keyboard arrow actions independent. */
export function QuickDragHandle(props:Props){
 const current=useRef(props);current.current=props;
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const active=useRef(false);
 const start=useRef(0);
 const lastTarget=useRef(-1);
 const [dragging,setDragging]=useState(false);
 const clearTimer=()=>{
  if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}
 };
 const stop=()=>{
  clearTimer();
  if(active.current){
   active.current=false;
   setDragging(false);
   current.current.onDragging(null);
  }
 };
 const pan=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>current.current.enabled,
  onMoveShouldSetPanResponder:()=>false,
  onPanResponderGrant:()=>{
   clearTimer();start.current=current.current.index;lastTarget.current=start.current;
   timer.current=setTimeout(()=>{
    timer.current=null;
    if(!current.current.enabled)return;
    active.current=true;setDragging(true);
    current.current.onDragging(current.current.id);
   },HOLD_MS);
  },
  onPanResponderMove:(_event,gesture)=>{
   if(!active.current){
    if(Math.hypot(gesture.dx,gesture.dy)>CANCEL_DISTANCE)clearTimer();
    return;
   }
   const target=quickDragTargetIndex(start.current,gesture.dy,current.current.count);
   if(target!==lastTarget.current){
    current.current.onMove(current.current.id,target);
    lastTarget.current=target;
   }
  },
  onPanResponderRelease:stop,
  onPanResponderTerminate:stop,
  onPanResponderTerminationRequest:()=>!active.current
 }),[]);
 useEffect(()=>()=>{clearTimer();},[]);
 return <View {...pan.panHandlers} accessible accessibilityRole="button"
  accessibilityLabel={'長按拖曳調整快捷功能：'+props.id}
  accessibilityHint="長按約0.26秒後上下滑動；也可以使用旁邊的上移、下移按鈕"
  accessibilityState={{disabled:!props.enabled,selected:dragging}}
  style={[styles.handle,dragging&&styles.active]}>
  <Text selectable={false} style={[styles.glyph,{color:props.color}]}>{dragging?'↕':'☰'}</Text>
 </View>;
}
const styles=StyleSheet.create({
 handle:{minWidth:38,minHeight:44,alignItems:'center',justifyContent:'center'},
 active:{borderWidth:1,borderColor:'#888',borderRadius:8},
 glyph:{fontSize:19,fontWeight:'900'}
});
