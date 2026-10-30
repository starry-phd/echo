/** A device preference never grants an audio/member right. Only tracks
 * already obtained from the matching currently authorized detail source may
 * offer local collection/hide operations. */
export type AuthorizedDetailSource='public'|'preview';
export type DetailPreferenceTrack={
 id:string;
 playable:boolean;
 legacySnapshot?:boolean;
};
export function mayChangeLocalDetailPreference(
 track:DetailPreferenceTrack|null|undefined,routeId:string|null,source:AuthorizedDetailSource
):boolean{
 if(!track||!routeId||track.id!==routeId)return false;
 if(source==='public')return track.playable===true;
 return source==='preview'&&track.playable===false&&track.legacySnapshot===true;
}
