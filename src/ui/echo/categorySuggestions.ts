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
 for(const raw of source){
  if(typeof raw!=='string')continue;
  const value=raw.normalize('NFKC').trim();
  if(!value||value.length>80||/[\x00-\x1f\x7f]/u.test(value))continue;
  const key=value.toLocaleLowerCase('zh-Hant');
  if(seen.has(key)||!terms.every(term=>key.includes(term)))continue;
  seen.add(key);out.push(value);
  if(out.length>=limit)break;
 }
 return out;
}
