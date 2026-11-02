/** Verified public-only Echo migration milestones. This is a static
 * visitor-facing excerpt, NOT the old v3.x changelog or a live admin feed.
 * Every entry refers to a source-reviewed and production-validated PR.
 */
export type PublicReleaseHistoryItem={
 id:string;
 date:string;
 title:string;
 changes:readonly string[];
};
export const PUBLIC_RELEASE_HISTORY_AS_OF='2026/11/02';
export const publicReleaseHistory:readonly PublicReleaseHistoryItem[]=[
 {
  id:'PR #139',date:'2026/11/02',title:'訪客暱稱與動物頭像',
  changes:[
   '右上角主選單恢復正面形容詞與動物組成的訪客暱稱。',
   '只在本機記住上一個顯示名稱；不建立會員或裝置識別碼。'
  ]
 },
 {
  id:'PR #137–#138',date:'2026/11/02',title:'新手教學定位更精準',
  changes:[
   '聚焦框只標示真正的品牌圖示與名稱，不包含伸縮空白。',
   '公開資訊卡重新排序或替換時，可重新定位第一張卡片的教學提示。'
  ]
 },
 {
  id:'PR #135–#136',date:'2026/11/02',title:'訪客主選單與快捷列',
  changes:[
   '新手教學新增右上角主選單的實際操作提示。',
   '主選單可一鍵恢復目前版型的字體、主題快捷按鈕，不更動其他版型。'
  ]
 },
 {
  id:'PR #132–#134',date:'2026/11/02',title:'首次進站的新手導覽',
  changes:[
   '首頁標誌與已核准公開資訊卡新增逐步教學。',
   '「不再提醒」的本機選擇在操作時立即儲存，支援取消選取。'
  ]
 },
 {
  id:'公開訪客基座',date:'2026/10/29',title:'公開資訊與本機個人化',
  changes:[
   '顯示28筆核准的公開訪客資訊卡及對應封面。',
   '可搜尋、篩選、查看公開講者資訊，並使用本裝置收藏與隱藏功能。'
  ]
 }
];
