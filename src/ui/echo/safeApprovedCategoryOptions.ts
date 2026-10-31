import {categoryFromRoute} from './publicCategoryNavigation';

/**
 * Card and detail links must use the exact currently approved category.
 * External route parsing can trim; a card chip cannot, because exact-match
 * catalog filters would otherwise silently return no matching source card.
 */
export function approvedExactCategoryLink(raw:unknown):string|null{
 if(typeof raw!=='string')return null;
 const safe=categoryFromRoute(raw);
 if(!safe||safe!==raw)return null;
 if(!categoryFromRoute(raw.normalize('NFKC')))return null;
 return safe;
}

/**
 * Category menus must offer only labels that can actually be used as exact
 * filters against currently authorized API metadata. The caller passes
 * getCategories() (verified-public only) plus device-visible curated guest
 * category labels; saved IDs/private archives are NOT sources.
 *
 * Preserve every approved label's exact spelling (including full-width
 * characters). A leading/trailing-space label is intentionally omitted
 * instead of silently changing it to a value the catalog cannot match.
 */
export function safeApprovedCategoryOptions(source:readonly unknown[]):string[]{
 const seen=new Set<string>();
 const options:string[]=[];
 for(const raw of source){
  const safe=approvedExactCategoryLink(raw);
  if(!safe||seen.has(safe))continue;
  seen.add(safe);
  options.push(safe);
 }
 return options;
}
