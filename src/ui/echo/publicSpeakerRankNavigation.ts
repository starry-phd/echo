import {baseSpeakerRank} from './cardFilters';

/** Route values are filters of already-authorized metadata, never access grants.
 * Match the rank normalization used by the existing AdvancedCardFilters UI.
 */
export function speakerRankFromRoute(value:unknown):string|null{
 // Reject malicious route control characters BEFORE trim can erase them.
 if(typeof value!=='string'||/[\x00-\x1f\x7f<>\/?#&%\\]/u.test(value))return null;
 const clean=value.trim();
 if(!clean||clean.length>80)return null;
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

/** This helper is ONLY called with the current verified-public detail response
 * from getPublicTrack(). A route/name or saved ID does not authorize a track.
 * Keep guest-only and public-verified cases separate to fail closed.
 */
export function approvedVerifiedSpeakerRank(track:{
 playable:boolean;speakerRank?:string|null;
}|null|undefined):string|null{
 return track?.playable===true?speakerRankFromRoute(track.speakerRank):null;
}
