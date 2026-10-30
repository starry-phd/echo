type Storage={getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<unknown>};
export const FONT_ZOOM_KEY='echo-ui-font-zoom-v1';
export const FONT_ZOOM_MIN=1;
export const FONT_ZOOM_MAX=1.4;
export const FONT_ZOOM_STEP=0.1;
type ZoomState={zoom:number;ready:boolean;storageError:boolean};
const initial:ZoomState={zoom:1,ready:false,storageError:false};
/** UI appearance only: never grant media, member or billing privileges. */
export function normalizedFontZoom(value:unknown):number{
 const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;
 if(!Number.isFinite(n))return FONT_ZOOM_MIN;
 return Math.round(Math.max(FONT_ZOOM_MIN,Math.min(FONT_ZOOM_MAX,n))*10)/10;
}
export function scaledFontSize(base:number,zoom:number):number{
 return Math.round(base*normalizedFontZoom(zoom)*10)/10;
}
export function createFontZoomPreferenceStore(storage:Storage){
 let state=initial;
 let writable=false;
 let changedDuringHydration=false;
 let hydration:Promise<void>|undefined;
 let writes=Promise.resolve();
 const listeners=new Set<()=>void>();
 const publish=(next:ZoomState)=>{state=next;for(const listener of listeners)listener();};
 const persist=(value:number)=>{
  if(!writable)return;
  writes=writes.then(async()=>{
   try{await storage.setItem(FONT_ZOOM_KEY,String(value));}
   catch{publish({...state,storageError:true});}
  });
 };
 const setZoom=(value:number)=>{
  if(!Number.isFinite(value))return;
  const zoom=normalizedFontZoom(value);
  if(zoom===state.zoom)return;
  if(!state.ready)changedDuringHydration=true;
  publish({...state,zoom});
  persist(zoom);
 };
 return{
  getSnapshot:()=>state,getServerSnapshot:()=>initial,
  subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};},
  hydrate:()=>hydration??=storage.getItem(FONT_ZOOM_KEY).then(saved=>{
   writable=true;
   const value=saved===null?initial.zoom:normalizedFontZoom(saved);
   publish({...state,zoom:changedDuringHydration?state.zoom:value,ready:true,
    storageError:state.storageError||(saved!==null&&
      (!saved.trim()||!Number.isFinite(Number(saved))))});
   if(changedDuringHydration)persist(state.zoom);
  }).catch(()=>{publish({...state,ready:true,storageError:true});}),
  setZoom,
  increase:()=>setZoom(state.zoom+FONT_ZOOM_STEP),
  decrease:()=>setZoom(state.zoom-FONT_ZOOM_STEP),
  flush:()=>writes
 };
}
