import {baseSpeakerRank} from './cardFilters';

/** Route values are filters of already-authorized metadata, never access grants.
 * Match the rank normalization used by the existing AdvancedCardFilters UI.
 */
export function speakerRankFromRoute(value:unknown):string|null{
 if(typeof value!=='string')return null;
 const clean=value.trim();
 if(!clean||clean.length>80||/[\x00-\x1f\x7f<>/?#&%\\]/u.test(clean))return null;
 const normalized=baseSpeakerRank(clean);
 return normalized&&normalized.length<=80?normalized:null;
}

/** Rank links can be shown ONLY for metadata received through the current
 * approved guest-preview API, never on an inferred private audio record. */
export function approvedGuestSpeakerRank(track:{
 playable:boolean;legacySnapshot?:boolean;speakerRank?:string|null;
}|null|undefined):string|null{
 return track?.legacySnapshot===true&&track.playable===false
  ?speakerRankFromRoute(track.speakerRank):null;
}
