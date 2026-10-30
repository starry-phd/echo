/**
 * UI reconciliation only. Both inputs must already come from the CURRENT,
 * individually authorized public catalog and curated guest-preview APIs.
 * A locally saved ID is NEVER an authorization source.
 *
 * Public+verified metadata wins over a preview with the same ID: a recording
 * transitioning to legitimate publication must appear once, with only the
 * permissions returned by the verified public API. Never combine fields,
 * synthesize playable=true, or infer permission from preview membership.
 */
export function mergeAuthorizedCards<T extends {id:string}>(
 publicCards:readonly T[], guestCards:readonly T[]
):T[]{
 const seen=new Set<string>();
 const merged:T[]=[];
 for(const card of [...publicCards,...guestCards]){
  if(typeof card.id!=='string'||!card.id||seen.has(card.id))continue;
  seen.add(card.id);
  merged.push(card);
 }
 return merged;
}
