/** Exact five navigation sections of original StatisticsView.tsx. */
export const legacyRankingTabs=[
 {id:'model',label:'模範生排行榜'},
 {id:'hot-tracks',label:'熱門音檔排行榜'},
 {id:'members',label:'會員排行榜'},
 {id:'stickers',label:'貼紙排位賽'},
 {id:'hot-keywords',label:'熱門關鍵字'}
] as const;
export type RankingTab=(typeof legacyRankingTabs)[number]['id'];

export const gatedRankingCopy:Record<Exclude<RankingTab,'hot-tracks'>,string>={
 model:'模範生排名需要真實會員聆聽與學習進度。中央會員和學習 API 尚未開放，無法展示個人排名。',
 members:'會員排名需要已核准且具適當公開權限的中央會員資料，不能從舊站複製私人會員名單。',
 stickers:'貼紙排位賽需要正式的 Starry ID／Battery 帳本與公開範圍。尚未接入，不能以歷史數字當新餘額。',
 'hot-keywords':'網友關鍵字排名需要授權的關鍵字關聯與可信統計 API，目前不能根據私人逐字稿推導。'
};

/** Empty hot rankings mean the selected metric is missing from APPROVED
 * visible metadata, not that unseen pages have no historic values.
 * Only offer to load more when that API actually reports another page.
 */
export function missingHistoricalMetricCopy(hasNextPage:boolean):string{
 return '目前已載入的核准作品尚無這項已公開的歷史統計，因此不顯示推測名次；'+
  (hasNextPage?'可嘗試其他指標或繼續載入公開作品。':'可嘗試其他指標。');
}
