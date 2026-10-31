import {categoryFromRoute} from './publicCategoryNavigation';

/** Original Echo search suggests *only* category tags and approved community
 * keywords, not track titles. Until a moderated public-keyword API exists,
 * expose only categories supplied by the verified-public API or the 28
 * explicitly allowlisted guest previews. No legacy_* or member data access.
 */
export function publicCategorySuggestions(
 source:readonly string[],input:string,max=12
):string[]{
 const query=input.normalize('NFKC').trim().toLocaleLowerCase('zh-Hant');
 const terms=query.split(/\s+/u).filter(Boolean);
 const seen=new Set<string>();
 const out:string[]=[];
 const limit=Math.min(16,Math.max(0,Math.floor(Number.isFinite(max)?max:0)));
 if(limit===0)return [];
 for(const raw of source){
  if(typeof raw!=='string')continue;
  // Normalize only for matching/deduplication; the selected filter must
  // retain the exact category published in the approved API metadata.
  const value=categoryFromRoute(raw);
  if(!value)continue;
  const normalized=value.normalize('NFKC');
  if(!categoryFromRoute(normalized))continue;
  const key=normalized.toLocaleLowerCase('zh-Hant');
  if(seen.has(key)||!terms.every(term=>key.includes(term)))continue;
  seen.add(key);out.push(value);
  if(out.length>=limit)break;
 }
 return out;
}
