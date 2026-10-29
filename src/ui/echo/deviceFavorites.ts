/** Local-only favorites matching the old guest device behavior.
 * Starry ID will replace this with a verified account-backed favorite API.
 */
export const DEVICE_FAVORITES_KEY='echo-device-favorite-ids-v1';
export function cleanFavoriteIds(x:unknown):string[]{
 if(!Array.isArray(x))return [];
 return [...new Set(x.filter((v):v is string=>typeof v==='string'&&v.length>0&&v.length<=200))].slice(0,500);
}
