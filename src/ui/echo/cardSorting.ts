export type SortOrder='newest'|'oldest'|'rating'|'rating-asc'|'likes'|'likes-asc'|'comments'|'comments-asc';
type HistoricalCounts={id:string;uploadDate?:string|null;rating?:number|null;likes?:number|null;commentsCount?:number|null};
export function sortEchoCards<T extends HistoricalCounts>(items:readonly T[],order:SortOrder):T[]{
 const byDate=(a:T,b:T)=>(b.uploadDate??'').localeCompare(a.uploadDate??'');
 if(order==='newest')return [...items].sort((a,b)=>byDate(a,b)||a.id.localeCompare(b.id));
 if(order==='oldest')return [...items].sort((a,b)=>-byDate(a,b)||a.id.localeCompare(b.id));
 const metric=order.replace('-asc','');
 const value=(t:T)=>metric==='rating'?(t.rating??0):metric==='likes'?(t.likes??0):(t.commentsCount??0);
 const direction=order.endsWith('-asc')?1:-1;
 return [...items].sort((a,b)=>direction*(value(a)-value(b))||byDate(a,b)||a.id.localeCompare(b.id));
}
