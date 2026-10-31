import {isLocallyHiddenCard} from './localCardVisibility';
import {approvedGuestSpeakerRank,approvedVerifiedSpeakerRank} from './publicSpeakerRankNavigation';

type ApprovedRankCard={
 id:string;
 speaker:string;
 speakerRank?:string|null;
 playable:boolean;
 legacySnapshot?:boolean;
};

/**
 * Offer a rank filter only if it was present on a currently authorized API
 * response. The caller passes the current verified-public catalog and curated
 * guest-preview API results, never saved IDs or legacy/private media.
 *
 * A playable verified-public track and a nonplayable allowlisted guest preview
 * have different authorization gates; keep them separate. Hiding/disliking a
 * card removes its rank hint unless another approved visible card has it.
 * This is a filter UI only and grants no audio access.
 */
export function visibleAuthorizedRankFacets(
 verifiedPublicCards:readonly ApprovedRankCard[],
 approvedGuestCards:readonly ApprovedRankCard[],
 dislikedIds:readonly string[],
 hiddenSpeakers:readonly string[]
):string[]{
 const seen=new Set<string>();
 const ranks=new Set<string>();
 const collect=(cards:readonly ApprovedRankCard[],kind:'public'|'guest')=>{
  for(const card of cards){
   if(!card||typeof card.id!=='string'||!card.id||seen.has(card.id))continue;
   // A verified-public response takes precedence over a guest preview if an
   // ID transitions to genuine publication, exactly like mergeAuthorizedCards.
   seen.add(card.id);
   if(isLocallyHiddenCard(card,dislikedIds,hiddenSpeakers))continue;
   const rank=kind==='public'
    ?approvedVerifiedSpeakerRank(card)
    :approvedGuestSpeakerRank(card);
   if(rank)ranks.add(rank);
  }
 };
 collect(verifiedPublicCards,'public');
 collect(approvedGuestCards,'guest');
 return [...ranks].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
}
