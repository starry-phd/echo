/** Build only a page link backed by the current verified-public track route.
 * This is NOT an audio URL, signed media URL, or legacy guest-preview link. */
export type PublicShareTrack={
 id:string;title:string;speaker:string;playable:boolean;
 /** The 28 curated guest metadata-only cards must not be shareable,
  * even if a caller accidentally marks a preview playable. */
 legacySnapshot?:boolean;
};
export function approvedPublicTrackShareMessage(
 track:PublicShareTrack|null|undefined,routeId:string|null,apiOrigin:string|null
):string|null{
 if(!track||track.legacySnapshot===true||track.playable!==true||typeof routeId!=='string'||track.id!==routeId)return null;
 // IDs originate from the current verified-public endpoint. Do not permit
 // path-control characters, '.', '..', encoded separators or arbitrary URLs.
 if(!/^[A-Za-z0-9_-]{1,200}$/u.test(track.id))return null;
 if(!apiOrigin)return null;
 let origin:string;
 try{
  const u=new URL(apiOrigin);
  if(u.username||u.password||u.pathname!=='/'||u.search||u.hash)return null;
  if(u.protocol!=='https:'&&!(u.protocol==='http:'&&u.hostname==='localhost'))return null;
  origin=u.origin;
 }catch{return null;}
 if(!track.title.trim()||!track.speaker.trim())return null;
 const title=track.title.replace(/[\r\n\u0000-\u001f\u007f]/gu,' ').trim().slice(0,200);
 const speaker=track.speaker.replace(/[\r\n\u0000-\u001f\u007f]/gu,' ').trim().slice(0,160);
 if(!title||!speaker)return null;
 return title+' · '+speaker+'\n'+origin+'/track/'+encodeURIComponent(track.id);
}
