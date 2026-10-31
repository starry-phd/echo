/**
 * Bound small metadata-only public catalog ID batches. A saved device ID is
 * never authorization; the supplied fetcher must be the current verified-public
 * API. Guest preview records are resolved separately from their curated API.
 */
export async function loadAuthorizedSavedPublicBatches<T>(
 ids:readonly string[],
 fetchBatch:(ids:string[])=>Promise<readonly T[]>
):Promise<T[]>{
 const unique=[...new Set(ids.filter(id=>typeof id==='string'&&id.length>0&&id.length<=200))];
 const result:T[]=[];
 for(let index=0;index<unique.length;index+=16){
  const batch=unique.slice(index,index+16);
  const approved=await fetchBatch(batch);
  result.push(...approved);
 }
 return result;
}
