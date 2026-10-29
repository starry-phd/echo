/** Public guest-metadata-only Production smoke assertions.
 * Deliberately neither downloads nor decodes any private recording.
 */
export const expectedGuestCount=28;
export const isNoStore=value=>typeof value==='string'&&
 value.split(',').some(part=>part.trim().toLowerCase()==='no-store');
export function validateGuestList(status,headers,payload){
 if(status!==200)throw Error('preview list status '+status);
 if(!isNoStore(headers.get('cache-control')))throw Error('preview list is missing no-store');
 const tracks=payload?.tracks;
 if(!Array.isArray(tracks)||tracks.length!==expectedGuestCount)
  throw Error('guest card count '+(Array.isArray(tracks)?tracks.length:'invalid')+', expected 28');
 const seen=new Set();
 for(let i=0;i<tracks.length;i++){
  const x=tracks[i];
  if(x.playable!==false||x.description!==null)throw Error('guest card '+(i+1)+' permission violation');
  if(typeof x.id!=='string'||!x.id.length||seen.has(x.id))throw Error('guest card '+(i+1)+' invalid/duplicate ID');
  seen.add(x.id);
  if(typeof x.coverUrl!=='string'||!/^\/api\/v1\/previews\/[^/?#]+\/cover\?policy=2$/.test(x.coverUrl))
   throw Error('guest card '+(i+1)+' missing scoped policy=2 cover URL');
 }
 return tracks;
}
export function validateCover(status,headers,bytes){
 if(status!==200)throw Error('cover HTTP '+status);
 const type=(headers.get('content-type')||'').toLowerCase().split(';')[0].trim();
 if(!['image/png','image/jpeg','image/webp'].includes(type))throw Error('cover MIME '+type);
 if(!isNoStore(headers.get('cache-control')))throw Error('cover missing no-store');
 if(!Number.isInteger(bytes)||bytes<=1000||bytes>5_000_000)
  throw Error('cover invalid content length '+bytes);
}
export function validateRefusal(status,headers,label){
 if(status!==404)throw Error(label+' allowed unexpectedly (HTTP '+status+')');
 if(!isNoStore(headers.get('cache-control')))throw Error(label+' missing no-store');
}
