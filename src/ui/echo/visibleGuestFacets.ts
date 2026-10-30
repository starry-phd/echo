import {baseSpeakerRank} from './cardFilters';
import {isLocallyHiddenCard} from './localCardVisibility';

/**
 * Local UI facet hints only. Callers pass the CURRENT authorized guest-preview
 * API response; neither local storage nor filters grant access to private media.
 * Keep the set independent of active query/category/rank so controls stay stable
 * while searching, but exclude disliked cards and hidden speakers.
 */
export function visibleGuestFacets<T extends {
 id:string;speaker:string;speakerRank?:string|null;categories:readonly string[]
}>(
 approvedGuestCards:readonly T[],
 dislikedIds:readonly string[],
 hiddenSpeakers:readonly string[]
):{categories:string[];ranks:string[]}{
 const seen=new Set<string>();
 const categories=new Set<string>();
 const ranks=new Set<string>();
 for(const card of approvedGuestCards){
  if(seen.has(card.id)||isLocallyHiddenCard(card,dislikedIds,hiddenSpeakers))continue;
  seen.add(card.id);
  for(const category of card.categories){
   if(typeof category==='string'&&category.trim())categories.add(category);
  }
  const rank=baseSpeakerRank(card.speakerRank??'');
  if(rank)ranks.add(rank);
 }
 return {categories:[...categories],ranks:[...ranks].sort()};
}
