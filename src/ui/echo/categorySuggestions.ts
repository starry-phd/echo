import {approvedExactCategoryLink} from './safeApprovedCategoryOptions';

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
  // The homepage currently passes pre-vetted options, but this exported
  // helper must not trim an unvetted label into a broken exact-match chip.
  const value=approvedExactCategoryLink(raw);
  if(!value)continue;
  // Unicode normalization affects search only. Distinct published labels
  // such as "AI" and "ＡＩ" are distinct exact category filters and must
  // each remain independently selectable from suggestions.
  const searchKey=value.normalize('NFKC').toLocaleLowerCase('zh-Hant');
  if(seen.has(value)||!terms.every(term=>searchKey.includes(term)))continue;
  seen.add(value);out.push(value);
  if(out.length>=limit)break;
 }
 return out;
}
