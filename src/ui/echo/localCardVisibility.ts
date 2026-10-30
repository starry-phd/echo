import {isSpeakerHidden} from './hiddenSpeakers';

/**
 * Presentation-only local preference, never a media permission check.
 * Caller must first obtain the track through a currently authorized API.
 * The same rule applies to direct URLs, not only the catalog grid.
 */
export function isLocallyHiddenCard(
 track:{id:string;speaker:string}|null|undefined,
 dislikedIds:readonly string[],
 hiddenSpeakers:readonly string[]
):boolean{
 if(!track)return false;
 return dislikedIds.includes(track.id)||isSpeakerHidden(track.speaker,hiddenSpeakers);
}
