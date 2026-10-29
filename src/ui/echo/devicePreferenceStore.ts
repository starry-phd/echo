import {cleanFavoriteIds,DEVICE_FAVORITES_KEY} from './deviceFavorites';
import {sanitizeDislikedTrackIds,DISLIKED_STORAGE_KEY} from './dislikedTracks';

type Storage={getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<unknown>};
export type DevicePreferences={favoriteIds:string[];dislikedIds:string[];ready:boolean;storageError:boolean};
const initial:DevicePreferences={favoriteIds:[],dislikedIds:[],ready:false,storageError:false};
/** Device IDs only. Never stores account, authorization, audio or billing data. */
export function createDevicePreferenceStore(storage:Storage){
 let state=initial;
 let hydration:Promise<void>|undefined;
 let writes=Promise.resolve();
 let writable=false;
 const listeners=new Set<()=>void>();
 const publish=(next:DevicePreferences)=>{state=next;listeners.forEach(fn=>fn());};
 const persist=(key:string,ids:string[])=>{
  if(!writable)return;
  // Serialize rapid taps so an earlier asynchronous save cannot win last.
  writes=writes.then(async()=>{try{await storage.setItem(key,JSON.stringify(ids));}
   catch{publish({...state,storageError:true});}});
 };
 const parse=(value:string|null):unknown=>{try{return JSON.parse(value??'[]');}catch{return [];}};
 return {
  getSnapshot:()=>state,
  getServerSnapshot:()=>initial,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  hydrate:()=>hydration??=Promise.all([storage.getItem(DEVICE_FAVORITES_KEY),storage.getItem(DISLIKED_STORAGE_KEY)])
   .then(([favorites,disliked])=>{
    writable=true;
    publish({favoriteIds:cleanFavoriteIds(parse(favorites)),dislikedIds:sanitizeDislikedTrackIds(parse(disliked)),ready:true,storageError:false});
   }).catch(()=>{
    // If reads fail, do not overwrite unknown existing preferences in storage.
    publish({...initial,ready:true,storageError:true});
   }),
  toggleFavorite:(id:string)=>{
   if(!state.ready||!cleanFavoriteIds([id]).length)return false;
   const chosen=!state.favoriteIds.includes(id);
   const favoriteIds=chosen?cleanFavoriteIds([...state.favoriteIds,id]):state.favoriteIds.filter(x=>x!==id);
   publish({...state,favoriteIds});persist(DEVICE_FAVORITES_KEY,favoriteIds);
   return favoriteIds.includes(id);
  },
  dislike:(id:string)=>{
   if(!state.ready||!sanitizeDislikedTrackIds([id]).length)return;
   const dislikedIds=sanitizeDislikedTrackIds([...state.dislikedIds,id]);
   publish({...state,dislikedIds});persist(DISLIKED_STORAGE_KEY,dislikedIds);
  },
  restoreHidden:()=>{
   if(!state.ready)return;
   publish({...state,dislikedIds:[]});persist(DISLIKED_STORAGE_KEY,[]);
  },
  flush:()=>writes,
 };
}
