import type {EchoTrack} from '../../types';

export type HistoricalEngagement={
 rating:number|null;
 ratingCount:number|null;
 commentsCount:number|null;
 likes:number|null;
};
function count(value:unknown):number|null{
 return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:null;
}
/** Aggregates are from an explicitly marked legacy public snapshot, never live members. */
export function readHistoricalEngagement(track:EchoTrack):HistoricalEngagement|null{
 if(track.legacySnapshot!==true)return null;
 const rating=typeof track.rating==='number'&&Number.isFinite(track.rating)
  &&track.rating>=0&&track.rating<=5?track.rating:null;
 return {
  rating,
  ratingCount:count(track.ratingCount),
  commentsCount:count(track.commentsCount),
  likes:count(track.likes)
 };
}
export function historicalCountLabel(value:number|null):string{
 return value===null?'未提供':String(value);
}
