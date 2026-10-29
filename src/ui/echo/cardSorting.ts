export type SortOrder='newest'|'oldest'|'rating'|'likes'|'comments';
type HistoricalCounts={id:string;uploadDate?:string|null;rating?:number|null;likes?:number|null;commentsCount?:number|null};
export function sortEchoCards<T extends HistoricalCounts>(items:readonly T[],order:SortOrder):T[]{
 const byDate=(a:T,b:T)=>(b.uploadDate??'').localeCompare(a.uploadDate??'');
 if(order==='newest')return [...items].sort(byDate);
 if(order==='oldest')return [...items].sort((a,b)=>-byDate(a,b));
 const value=(t:T)=>order==='rating'?(t.rating??0):order==='likes'?(t.likes??0):(t.commentsCount??0);
 return [...items].sort((a,b)=>value(b)-value(a)||byDate(a,b)||a.id.localeCompare(b.id));
}
