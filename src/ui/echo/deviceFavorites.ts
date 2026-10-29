/** Local-only favorites matching the old guest device behavior.
 * Starry ID will replace this with a verified account-backed favorite API.
 */
export const DEVICE_FAVORITES_KEY='echo-device-favorite-ids-v1';
export function cleanFavoriteIds(x:unknown):string[]{
 if(!Array.isArray(x))return [];
 return [...new Set(x.filter((v):v is string=>typeof v==='string'&&v.length>0&&v.length<=200))].slice(0,500);
}
export function readDeviceFavorites():string[]{
 if(typeof window==='undefined')return [];
 try{return cleanFavoriteIds(JSON.parse(window.localStorage.getItem(DEVICE_FAVORITES_KEY)||'[]'));}
 catch{return [];}
}
export function saveDeviceFavorites(ids:string[]):void{
 if(typeof window==='undefined')return;
 try{window.localStorage.setItem(DEVICE_FAVORITES_KEY,JSON.stringify(cleanFavoriteIds(ids)));}
 catch{/* Limited storage: still keep local component state. */}
}
