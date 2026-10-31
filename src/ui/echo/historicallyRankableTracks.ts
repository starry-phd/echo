import type {EchoTrack} from '../../types';
import {readHistoricalEngagement} from './legacyEngagementSnapshot';

/**
 * Hot-recording rankings must never invent a zero for absent historic data.
 * Only the currently approved catalog / guest metadata provided by the caller
 * may be ranked, and only when the selected metric was explicitly published.
 * An actual recorded zero is valid; an absent metric is NOT a zero.
 */
export type HistoricalRankMetric='rating'|'likes'|'comments';
export function historicallyRankableTracks<T extends EchoTrack>(
 tracks:readonly T[],metric:HistoricalRankMetric
):T[]{
 return tracks.filter(track=>{
  const snapshot=readHistoricalEngagement(track);
  if(!snapshot)return false;
  if(metric==='rating')return snapshot.rating!==null;
  if(metric==='likes')return snapshot.likes!==null;
  return snapshot.commentsCount!==null;
 });
}
