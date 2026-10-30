import {useRef} from 'react';
import type {LayoutChangeEvent,ScrollView} from 'react-native';

export type DetailSectionId='playback'|'notes'|'engagement'|'device';

export function detailJumpScrollOffset(shellY:number,cardY:number,sectionY:number):number|null{
 if(![shellY,cardY,sectionY].every(v=>Number.isFinite(v)&&v>=0))return null;
 return Math.max(0,Math.floor(shellY+cardY+sectionY-12));
}

/** All three onLayout coordinates are from authorized visible React Native UI.
 * No DOM, URL fragment, private catalog query or persistent route storage. */
export function useDetailSectionJump(){
 const scrollRef=useRef<ScrollView>(null);
 const shellY=useRef<number|null>(null);
 const cardY=useRef<number|null>(null);
 const sectionY=useRef<Partial<Record<DetailSectionId,number>>>({});
 const onShellLayout=(event:LayoutChangeEvent)=>{shellY.current=event.nativeEvent.layout.y;};
 const onCardLayout=(event:LayoutChangeEvent)=>{cardY.current=event.nativeEvent.layout.y;};
 const onSectionLayout=(section:DetailSectionId)=>(event:LayoutChangeEvent)=>{
  sectionY.current[section]=event.nativeEvent.layout.y;
 };
 const jumpTo=(section:DetailSectionId)=>{
  const shell=shellY.current,card=cardY.current,sectionOffset=sectionY.current[section];
  if(shell===null||card===null||typeof sectionOffset!=='number')return;
  const y=detailJumpScrollOffset(shell,card,sectionOffset);
  if(y!==null)scrollRef.current?.scrollTo({y,animated:true});
 };
 return {scrollRef,onShellLayout,onCardLayout,onSectionLayout,jumpTo};
}
