/**
 * The public UI must not mistake completed R2 copying for public release.
 * The only authoritative public state is /api/v1/health and verified catalog.
 * Never imply member registration, rank access, or VIP playback is available.
 */
export function describeEmptyPublicCatalog(
 migration:string|undefined,filtered:boolean,hasMorePublicPages=false
):{title:string;detail:string}{
 // An empty CURRENT page cannot establish that the authorized catalog is
 // empty when more verified-public pages remain. Keep BOTH copy lines honest.
 if(hasMorePublicPages)return{
  title:'目前載入的作品沒有符合條件的結果',
  detail:filtered
   ?'仍有未載入的核准公開作品，請點「載入更多公開音檔」繼續尋找；目前無結果不代表後續頁面沒有符合條件的作品。'
   :'核准公開作品尚未載入完畢，請點「載入更多公開音檔」繼續查看；目前無結果不代表公開目錄沒有作品。',
 };
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
