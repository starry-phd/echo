/**
 * Device-local '我不喜歡' preference only, not server-side member data.
 * No personal identity, billing, remote writes or cross-device promises.
 */
export const DISLIKED_STORAGE_KEY='echo-device-disliked-track-ids-v1';
export function sanitizeDislikedTrackIds(input:unknown):string[]{
 if(!Array.isArray(input))return [];
 return [...new Set(input.filter((id):id is string=>typeof id==='string'&&id.length>0&&id.length<=200))].slice(0,500);
}
