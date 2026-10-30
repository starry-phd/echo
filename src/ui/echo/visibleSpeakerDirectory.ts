import {isSpeakerHidden} from './hiddenSpeakers';
import {splitSpeakerNames} from './speakerNames';

/**
 * Presentation-only directory; caller supplies ONLY current, API-authorized
 * public speaker aggregates and curated guest preview tracks. This is not
 * a source of media access rights or a query over legacy/private media.
 */
export function visibleSpeakerDirectory(
 publicSpeakers:readonly {name:string;trackCount:number}[],
 guestPreviews:readonly {id:string;speaker:string;coverUrl?:string|null}[],
 dislikedIds:readonly string[],
 hiddenSpeakers:readonly string[]
):{name:string;trackCount:number;coverUrl:string|null}[]{
 const found=new Map<string,{name:string;trackCount:number;coverUrl:string|null}>();
 for(const entry of publicSpeakers){
  if(isSpeakerHidden(entry.name,hiddenSpeakers))continue;
  const count=Number.isFinite(entry.trackCount)?Math.max(0,Math.floor(entry.trackCount)):0;
  for(const name of splitSpeakerNames(entry.name)){
   const prev=found.get(name);
   found.set(name,{name,trackCount:(prev?.trackCount??0)+count,coverUrl:prev?.coverUrl??null});
  }
 }
 // Respect hidden individual guest card IDs before using cover/photo or counts.
 for(const track of guestPreviews){
  if(dislikedIds.includes(track.id)||isSpeakerHidden(track.speaker,hiddenSpeakers))continue;
  for(const name of splitSpeakerNames(track.speaker)){
   const prev=found.get(name);
   found.set(name,{name,trackCount:(prev?.trackCount??0)+1,
    coverUrl:prev?.coverUrl||track.coverUrl||null});
  }
 }
 return [...found.values()].sort((a,b)=>b.trackCount-a.trackCount||a.name.localeCompare(b.name));
}
