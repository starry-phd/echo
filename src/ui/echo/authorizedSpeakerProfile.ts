import {splitSpeakerNames} from './speakerNames';
import {isLocallyHiddenCard} from './localCardVisibility';

/** A route segment is only a request, never evidence of public speaker data. */
export function publicSpeakerRouteName(value:unknown):string|null{
 if(typeof value!=='string'||!value.trim()||value.length>80||
  /[\u0000-\u001f\u007f-\u009f]/.test(value))return null;
 const names=splitSpeakerNames(value);
 // Speaker links use individual names; reject ambiguous combined routes.
 return names.length===1&&names[0].length<=80?names[0]:null;
}

/**
 * Accept only cards obtained from the CURRENT verified-public catalog or
 * approved guest-preview endpoint. Exact normalized speaker matching also
 * guards against a server filter matching a different/similar person.
 */
export function authorizedSpeakerProfileTracks<T extends {id:string;speaker:string}>(
 requestedSpeaker:string|null,
 authorizedCards:readonly T[],
 dislikedIds:readonly string[],
 hiddenSpeakers:readonly string[]
):T[]{
 if(!requestedSpeaker)return [];
 const name=publicSpeakerRouteName(requestedSpeaker);
 if(!name)return [];
 return authorizedCards.filter(card=>
  splitSpeakerNames(card.speaker).includes(name)&&
  !isLocallyHiddenCard(card,dislikedIds,hiddenSpeakers)
 );
}
