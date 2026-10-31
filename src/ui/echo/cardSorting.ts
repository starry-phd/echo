export type SortOrder='newest'|'oldest'|'rating'|'rating-asc'|'likes'|'likes-asc'|'comments'|'comments-asc';
type HistoricalCounts={id:string;uploadDate?:string|null;rating?:number|null;likes?:number|null;commentsCount?:number|null};
export function sortEchoCards<T extends HistoricalCounts>(items:readonly T[],order:SortOrder):T[]{
 // Verified-public API cards do not currently expose uploadDate. They arrive
 // in the server's authorized, stable order (updated_at DESC/id ASC). Never
 // mistake their IDs for chronology or reverse them as though dates existed.
 const dateOf=(item:T)=>typeof item.uploadDate==='string'?item.uploadDate.trim():'';
 const byDate=(a:T,b:T)=>{
  const first=dateOf(a),second=dateOf(b);
  if(!first)return second?1:0; // Unknown dates are always last.
  if(!second)return -1;
  return second.localeCompare(first);
 };
 const datedTie=(a:T,b:T)=>dateOf(a)&&dateOf(b)?a.id.localeCompare(b.id):0;
 if(order==='newest')return [...items].sort((a,b)=>byDate(a,b)||datedTie(a,b));
 if(order==='oldest')return [...items].sort((a,b)=>{
  const first=dateOf(a),second=dateOf(b);
  return (first&&second?-byDate(a,b):byDate(a,b))||datedTie(a,b);
 });
 const metric=order.replace('-asc','');
 const value=(t:T)=>metric==='rating'?(t.rating??0):metric==='likes'?(t.likes??0):(t.commentsCount??0);
 const direction=order.endsWith('-asc')?1:-1;
 return [...items].sort((a,b)=>direction*(value(a)-value(b))||byDate(a,b)||a.id.localeCompare(b.id));
}
