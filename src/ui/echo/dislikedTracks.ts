/**
 * Device-local '我不喜歡' preference only, not server-side member data.
 * No personal identity, billing, remote writes or cross-device promises.
 */
export const DISLIKED_STORAGE_KEY='echo-device-disliked-track-ids-v1';
export function sanitizeDislikedTrackIds(input:unknown):string[]{
 if(!Array.isArray(input))return [];
 return [...new Set(input.filter((id):id is string=>typeof id==='string'&&id.length>0&&id.length<=200))].slice(0,500);
}

/** Only resolve locally saved hidden IDs against currently authorized data.
 * Stale or newly private IDs remain hidden without metadata. This is a UI
 * lookup, not an access grant. The caller must pass ONLY the API-approved
 * public catalog and curated guest preview response.
 */
export function restorableHiddenCards<T extends {id:string}>(
 publicTracks:readonly T[],guestPreviews:readonly T[],dislikedIds:readonly string[]
):T[]{
 const authorized=new Map<string,T>();
 for(const entry of [...publicTracks,...guestPreviews]){
  if(typeof entry.id==='string'&&!authorized.has(entry.id))authorized.set(entry.id,entry);
 }
 const chosen:string[]=sanitizeDislikedTrackIds(dislikedIds);
 return chosen.flatMap(id=>{const entry=authorized.get(id);return entry?[entry]:[];});
}
