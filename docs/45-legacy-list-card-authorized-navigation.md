# 2026-10-30｜音檔清單分類導航、分享權限一致性、歷史數字正確性

## 實際修復（適用所有 LegacyTrackCard 清單）
- 舊版的音檔卡分類標籤在新版 `src/ui/echo/LegacyTrackCard.tsx` 是靜態 `View`，無法像詳細頁那樣點選進入同分類作品。本次把**前三個已核准公開分類標籤**變成可按 `Pressable`，統一 `categoryFromRoute` 安全過濾，點擊後導航至首頁 `/?category=名稱`，繼續使用既有 `getPublicTracks` / 28 張核准 `getGuestPreviewTracks` / `matchesCardFilters`；只是現有**已核准資料的本地篩選**，不會查舊私人資料。含「新人」動畫分類亦可點選且保留色帶，手機觸控至少44px。首頁、講師清單、收藏頁共用此元件，故效果一致。
- 列表更多選單以前用 `track.playable` 直接拼 URL 分享，與 PR#57 詳細頁使用的安全 `approvedPublicTrackShareMessage` 不一致。本次列表**共用既有精確安全 URL 驗證**，要求 `playable===true`、有效公開 ID、HTTPS origin；無合法連結時只顯示不開放並提示，不輸出音訊串流或私人 URL。真實收件者仍需公開 Worker 的 `getTrack` / stream Gate，**快取的列表不構成現時公開權證明**。訪客 `/preview/[id]` 不新增分享功能。
- 原卡片在缺歷史 `ratingCount/commentsCount/likes` 時用 `??0` 補成假0，和 PR#56 詳細頁的「未提供」規則衝突。本次列表直接共用 `readHistoricalEngagement` 及 `historicalCountLabel`，只接受 `legacySnapshot===true` 的已核准彙總，合法真0顯示0、缺欄位或非法數值顯示「未提供」；未開放則 `—`。沒有讀任何個別會員評論。
- 舊列表公開卡角標寫「寫心得可得獎勵」，但會員心得/電池獎勵 API 尚未實作，本次改為不誤導的「已核准公開」。不開啟心得寫入或電池發放。

## 技術、安全及驗收
- 僅更新 `src/ui/echo/LegacyTrackCard.tsx`，新增 `tests/legacy-list-card-authorized-navigation.test.mjs`，沿用現存 category helper/share helper/歷史彙總 reader，不改 Worker、D1/R2、音訊或 Starry ID 及會員資料。
- 28張批准 metadata-only 訪客卡仍不可播放/分享；112筆歷史 `private/copied`、0 `public+verified` 為先前快照，本輪未讀取/下載/解碼/稽核私有音訊，`audit-private-audio.yml` 仍須業主另行具體授權。
- 須通過 PR CI、受保護 branch 合併、main CI、唯一 GitHub 自動 Production、28/28 approved covers/no-store/private404 HTTP smoke、Cloudflare 官方 Worker 最新 version/100% 才能稱正式 Web 上線。原生 iOS/Android 真機及整體1:1 仍未驗收。
