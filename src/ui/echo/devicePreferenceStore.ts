import {cleanFavoriteIds,DEVICE_FAVORITES_KEY} from './deviceFavorites';
import {sanitizeDislikedTrackIds,DISLIKED_STORAGE_KEY} from './dislikedTracks';
import {sanitizeHiddenSpeakers,HIDDEN_SPEAKERS_KEY} from './hiddenSpeakers';

type Storage={getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<unknown>};
export type DevicePreferences={favoriteIds:string[];dislikedIds:string[];hiddenSpeakers:string[];ready:boolean;storageError:boolean};
const initial:DevicePreferences={favoriteIds:[],dislikedIds:[],hiddenSpeakers:[],ready:false,storageError:false};
/** Device IDs only. Never stores account, authorization, audio or billing data. */
export function createDevicePreferenceStore(storage:Storage){
 let state=initial;
 let hydration:Promise<void>|undefined;
 let writes=Promise.resolve();
 const writableKeys=new Set<string>();
 const listeners=new Set<()=>void>();
 const publish=(next:DevicePreferences)=>{state=next;listeners.forEach(fn=>fn());};
 const persist=(key:string,ids:string[])=>{
  if(!writableKeys.has(key))return;
  // Serialize rapid taps so an earlier asynchronous save cannot win last.
  writes=writes.then(async()=>{try{await storage.setItem(key,JSON.stringify(ids));}
   catch{publish({...state,storageError:true});}});
 };
 /**
  * A new preference key must not erase older favorites when its read fails.
  * Never write back a key whose stored value couldn't be read and parsed.
  */
 const readKey=(result:PromiseSettledResult<string|null>,key:string,markError:()=>void):unknown=>{
  if(result.status==='rejected'){markError();return [];}
  if(result.value===null){writableKeys.add(key);return [];}
  try{
   const parsed:unknown=JSON.parse(result.value);
   if(!Array.isArray(parsed)){markError();return [];}
   writableKeys.add(key);
   return parsed;
  }catch{markError();return [];}
 };
 return {
  getSnapshot:()=>state,
  getServerSnapshot:()=>initial,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  hydrate:()=>hydration??=Promise.allSettled([
    storage.getItem(DEVICE_FAVORITES_KEY),
    storage.getItem(DISLIKED_STORAGE_KEY),
    storage.getItem(HIDDEN_SPEAKERS_KEY)
   ]).then(([favoriteResult,dislikeResult,speakerResult])=>{
    let hadReadError=false;
    const markError=()=>{hadReadError=true;};
    const favoriteIds=cleanFavoriteIds(readKey(favoriteResult,DEVICE_FAVORITES_KEY,markError));
    const dislikedIds=sanitizeDislikedTrackIds(readKey(dislikeResult,DISLIKED_STORAGE_KEY,markError));
    const hiddenSpeakers=sanitizeHiddenSpeakers(readKey(speakerResult,HIDDEN_SPEAKERS_KEY,markError));
    publish({favoriteIds,dislikedIds,hiddenSpeakers,ready:true,storageError:hadReadError});
   }).catch(()=>{
    // Unexpected failure also stays fail-closed for all preference writes.
    writableKeys.clear();
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
  hideSpeaker:(name:string):boolean=>{
   if(!state.ready||!sanitizeHiddenSpeakers([name]).length)return false;
   const hiddenSpeakers=sanitizeHiddenSpeakers([...state.hiddenSpeakers,name]);
   if(hiddenSpeakers.length===state.hiddenSpeakers.length)return false;
   publish({...state,hiddenSpeakers});persist(HIDDEN_SPEAKERS_KEY,hiddenSpeakers);
   return true;
  },
  restoreHiddenSpeaker:(name:string):boolean=>{
   if(!state.ready||!sanitizeHiddenSpeakers([name]).length)return false;
   const target=sanitizeHiddenSpeakers([name])[0];
   const hiddenSpeakers=state.hiddenSpeakers.filter(value=>value!==target);
   if(hiddenSpeakers.length===state.hiddenSpeakers.length)return false;
   publish({...state,hiddenSpeakers});persist(HIDDEN_SPEAKERS_KEY,hiddenSpeakers);
   return true;
  },
  restoreAllSpeakers:()=>{
   if(!state.ready)return;
   publish({...state,hiddenSpeakers:[]});persist(HIDDEN_SPEAKERS_KEY,[]);
  },
  restoreHiddenTrack:(id:string):boolean=>{
   // A local preference can be undone individually without touching any
   // central member, D1 row, server access control or private media path.
   if(!state.ready||!sanitizeDislikedTrackIds([id]).length||!state.dislikedIds.includes(id))return false;
   const dislikedIds=state.dislikedIds.filter(value=>value!==id);
   publish({...state,dislikedIds});persist(DISLIKED_STORAGE_KEY,dislikedIds);
   return true;
  },
  restoreHidden:()=>{
   if(!state.ready)return;
   publish({...state,dislikedIds:[]});persist(DISLIKED_STORAGE_KEY,[]);
  },
  flush:()=>writes,
 };
}
