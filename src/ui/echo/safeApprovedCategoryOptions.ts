import {categoryFromRoute} from './publicCategoryNavigation';

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
  if(typeof raw!=='string')continue;
  const safe=categoryFromRoute(raw);
  if(!safe||safe!==raw)continue;
  // NFKC search matching must not turn full-width punctuation into an
  // unsafe deep link; keep the original approved label for exact matching.
  if(!categoryFromRoute(raw.normalize('NFKC')))continue;
  if(seen.has(raw))continue;
  seen.add(raw);
  options.push(raw);
 }
 return options;
}
