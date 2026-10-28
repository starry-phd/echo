/**
 * The public UI must not mistake completed R2 copying for public release.
 * The only authoritative public state is /api/v1/health and verified catalog.
 * Never imply member registration, rank access, or VIP playback is available.
 */
export function describeEmptyPublicCatalog(migration:string|undefined,filtered:boolean):{
 title:string; detail:string;
}{
 if(filtered)return{
   title:'找不到符合條件的演講音檔',
   detail:'請清除搜尋或分類條件，再查看已核准公開的音檔。',
 };
 if(migration==='copied')return{
   title:'舊版音檔已安全搬遷',
   detail:'雲端檔案已複製完成，仍在核對內容及播放授權；尚無核准公開的演講音檔。',
 };
 if(migration==='verified')return{
   title:'目前沒有可公開播放的音檔',
   detail:'公開目錄只顯示完成驗證且獲准公開的音檔；請稍後再查看。',
 };
 return{
   title:'音檔整理與公開驗證中',
   detail:'目前尚無完成權限審查、核准公開的演講音檔。',
 };
}
