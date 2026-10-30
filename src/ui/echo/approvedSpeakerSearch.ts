/**
 * Search ONLY the already-authorized, locally visible speaker directory.
 * Never query the old private database, infer people, or use the search text
 * as a permission token. Preserve card identities/counts/portrait provenance.
 */
export function filterApprovedSpeakerDirectory<T extends {name:string}>(
 speakers:readonly T[],input:unknown
):T[]{
 if(typeof input!=='string'||input.length>80||
  /[\u0000-\u001f\u007f-\u009f]/u.test(input))return [];
 const normalize=(value:string)=>value.normalize('NFKC').replace(/\s+/gu,'').toLocaleLowerCase('zh-Hant');
 const query=normalize(input);
 if(!query)return [...speakers];
 return speakers.filter(item=>normalize(item.name).includes(query));
}
