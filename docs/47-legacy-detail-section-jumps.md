# 2026-10-30｜舊版詳細頁第二層快捷跳轉（真實 ScrollView 區塊定位）

## 原版和新版差異
- 原始 `yukidu/Echo-Starry/src/components/DetailView.tsx` 有 `navigation.target` 配合 `scrollIntoView()`，從音訊頂端／心得區在長內容詳細頁中快捷移動；新版公開 `app/track/[id].tsx` 及合法訪客 `app/preview/[id].tsx` 先前只能長距離手動捲動。
- 本批為兩種詳細頁加上 **「快速前往本頁內容」真實可點擊導覽**：公開詳情可跳「播放區／演講資訊／評價與心得／我的收藏」，metadata-only 訪客預覽則只跳「演講資訊／評價與心得／我的收藏」，**絕對不顯示播放快捷或播放器**。
- 使用原生 RN `ScrollView.ref.scrollTo({y,animated:true})` 和實際 `onLayout` 取得 shell、card、區塊各自座標，計入卡片與標題偏移；同一套 API 支援 Web/PWA 及 React Native。未知、失效或非有限的位置直接忽略，不導向私人API或不明外部URL。
- 可使用 A±字級、深淺主題、手機至少44px點擊區、accessibilityRole/button；調整字體重新布局後 `onLayout` 自動更新區塊位置，避免硬編固定像素；沒有假做會員評論、評價寫入或私人 audio。
- 新 `src/ui/echo/detailSectionScroll.ts`、`src/ui/echo/LegacyDetailSectionNavigation.tsx`、`tests/legacy-approved-detail-section-jumps.test.mjs`；更新兩種 details，**不改 Worker/D1/R2、Starry ID、Ads、金流或任何音訊資料來源**。舊版 deep-link 到特定個別會員評論仍待其合法會員/評論 API，不能冒充已完成。
- 本批部署驗收需 PR CI + protected merge + main CI + **唯一**自動 Production，正式 HTTP smoke 28/28核准訪客封面、no-store、私人stream/unlisted cover 404 + Cloudflare 官方新 version 100%。原生真機／真有授權的音訊真測尚未完成，不能宣稱舊版 1:1。
- 私人媒體 `audit-private-audio.yml` 仍需**業主另行具體授權**，本批完全不執行/讀取/下載/解碼/雜湊私人音訊。歷史 112 `private/copied`、0 `public+verified` 為過去快照，本輪未進 D1/R2 重查。
