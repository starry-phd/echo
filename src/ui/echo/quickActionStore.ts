type Storage={getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<unknown>};
export const QUICK_PIN_KEY='echo-ui-pinned-quick-actions-v1';
export const allowedQuickActions=['home','palette','speakers','stats','favorites','profile','theme'] as const;
export type QuickActionId=(typeof allowedQuickActions)[number];
export type QuickDeviceKind='mobile'|'tablet'|'desktop';
export type QuickActionChoices=Record<QuickDeviceKind,QuickActionId[]>;
export const quickLimits:Record<QuickDeviceKind,number>={mobile:3,tablet:5,desktop:7};
const defaults:QuickActionChoices={
 mobile:['home','palette','speakers'],
 tablet:['home','palette','speakers','profile'],
 desktop:['home','palette','speakers','profile']
};
/** The device viewport controls available quick-bar slots, not a member rank. */
export function quickDeviceForWidth(width:number):QuickDeviceKind{
 return width<600?'mobile':width<900?'tablet':'desktop';
}
export function normalizeQuickIds(raw:unknown,device:QuickDeviceKind):QuickActionId[]{
 if(!Array.isArray(raw))return [...defaults[device]];
 const out:QuickActionId[]=[];
 for(const item of raw){
  if(!allowedQuickActions.includes(item as QuickActionId)||out.includes(item as QuickActionId))continue;
  out.push(item as QuickActionId);
  if(out.length>=quickLimits[device])break;
 }
 return out;
}
export function normalizeQuickChoices(raw:unknown):QuickActionChoices{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {
  mobile:[...defaults.mobile],tablet:[...defaults.tablet],desktop:[...defaults.desktop]
 };
 const source=raw as Record<string,unknown>;
 return {
  mobile:normalizeQuickIds(source.mobile,'mobile'),
  tablet:normalizeQuickIds(source.tablet,'tablet'),
  desktop:normalizeQuickIds(source.desktop,'desktop')
 };
}
/** Map long-press movement to a valid pinned shortcut slot. */
export function quickDragTargetIndex(startIndex:number,dy:number,count:number,rowStep=48):number{
 if(!Number.isInteger(startIndex)||!Number.isInteger(count)||count<1||startIndex<0||startIndex>=count||
  !Number.isFinite(dy)||!Number.isFinite(rowStep)||rowStep<=0)return startIndex;
 return Math.max(0,Math.min(count-1,startIndex+Math.round(dy/rowStep)));
}
type QuickState={choices:QuickActionChoices;ready:boolean;storageError:boolean};
const initial:QuickState={choices:normalizeQuickChoices(null),ready:false,storageError:false};
/** Local UI shortcut order only: never changes access to restricted features. */
export function createQuickActionStore(storage:Storage){
 let state=initial;let hydration:Promise<void>|undefined;let writes=Promise.resolve();let writable=false;
 const listeners=new Set<()=>void>();
 const publish=(value:QuickState)=>{state=value;listeners.forEach(fn=>fn());};
 const persist=(choices:QuickActionChoices)=>{
  if(!writable)return;
  writes=writes.then(async()=>{try{await storage.setItem(QUICK_PIN_KEY,JSON.stringify(choices));}
   catch{publish({...state,storageError:true});}});
 };
 const update=(device:QuickDeviceKind,ids:QuickActionId[])=>{
  if(!state.ready)return false;
  const choices={...state.choices,[device]:ids};
  publish({...state,choices});persist(choices);return true;
 };
 return {
  getSnapshot:()=>state,getServerSnapshot:()=>initial,
  subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};},
  hydrate:()=>hydration??=storage.getItem(QUICK_PIN_KEY).then(raw=>{
   writable=true;
   let choices=normalizeQuickChoices(null),storageError=false;
   if(raw!==null){try{choices=normalizeQuickChoices(JSON.parse(raw));}catch{storageError=true;}}
   publish({choices,ready:true,storageError});
  }).catch(()=>{publish({...state,ready:true,storageError:true});}),
  togglePinned:(device:QuickDeviceKind,id:QuickActionId)=>{
   if(!state.ready||!allowedQuickActions.includes(id))return false;
   const current=state.choices[device];
   if(current.includes(id))return update(device,current.filter(x=>x!==id));
   if(current.length>=quickLimits[device])return false;
   return update(device,[...current,id]);
  },
  reorderPinned:(device:QuickDeviceKind,id:QuickActionId,targetIndex:number)=>{
   if(!state.ready||!Number.isInteger(targetIndex))return false;
   const current=state.choices[device];
   const index=current.indexOf(id);
   if(index<0||targetIndex<0||targetIndex>=current.length||index===targetIndex)return false;
   const ids=[...current];ids.splice(index,1);ids.splice(targetIndex,0,id);
   return update(device,ids);
  },
  movePinned:(device:QuickDeviceKind,id:QuickActionId,direction:-1|1)=>{
   if(!state.ready)return false;
   const current=state.choices[device];
   const index=current.indexOf(id),next=index+direction;
   if(index<0||next<0||next>=current.length)return false;
   const ids=[...current];[ids[index],ids[next]]=[ids[next],ids[index]];
   return update(device,ids);
  },
  flush:()=>writes
 };
}
