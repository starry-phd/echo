# 2026-10-30｜原版「分享錄音」：僅公開且已驗證的音檔詳細頁

## 新舊版核對
- 舊版 `yukidu/Echo-Starry/src/components/DetailView.tsx` 在「演講資訊與備註」之後、「心得收穫」之前，有「分享錄音」與「匯出圖卡」操作。
- 目前新版 `src/ui/echo/LegacyTrackCard.tsx` 雖已有只限 `track.playable` 的系統分享，公開音檔詳細頁 `app/track/[id].tsx` 沒有這一顆按鈕。
- 本批新 `LegacyVerifiedTrackShare` 保留原位置與原標題，使用 React Native `Share.share()` 真正叫起裝置的分享對話框。它是分享**公開詳情頁網址**（`/track/{approvedId}`），**不是音訊串流下載連結**。如果分享 API 不可用，會顯示失敗資訊，不能虛報成功。

## fail-closed 安全規則
- 只在經 `getPublicTrack(routeId)` 確認公開的 `/track/[id]` 掛載；`/preview/[id]` 完全不匯入/渲染分享按鈕。
- `approvedPublicTrackShareMessage()` 需 `track.playable===true`、`track.id===routeId`，且 ID 只允許 1–200 字的英數、連字號與底線；避免 `..`、路徑分隔及 URL 注入。
- 使用既有受控 `getApiBaseUrl()` 作為 origin，僅允許 HTTPS 或 `localhost` HTTP，不帶用戶密碼、path、query、fragment；不使用任何私人媒體端點或非公開欄位。
- 本裝置選擇隱藏的卡片在既有 `TrackDetails` 介面中不會掛載分享。失敗及不可用狀態都是明確 UI 訊息。
- **前端 Gate 不取代後端公開驗證。** 真正收到連結的人仍需由 Worker 公開詳情與媒體授權 Gate 判斷可否讀取；請勿用舊版 private/copied ID 變成可分享音訊。

## 完成界線
- 新增 `src/ui/echo/publicTrackSharing.ts`、`LegacyVerifiedTrackShare.tsx`、`tests/legacy-verified-detail-sharing.test.mjs`，更新 `app/track/[id].tsx`。
- 「匯出圖卡」涉及原版複雜資料及圖像輸出，本輪未造假也未開放；沒有新增參考資料 URL、留言、評價 API、私有音訊、Starry ID、後台、Ads/付款。
- 須 PR CI→合法 protected merge→main CI→**唯一**由 GitHub workflow_run 自動觸發的 Production→28張核准封面/28筆 metadata-only/no-store/private404 的安全 Smoke→Cloudflare 官方唯讀核查 Workers version 100%，方可稱 Web 上線。未有可測試的 public+verified 真人音檔時，不能宣稱真實使用者的 Share sheet 或音訊播放/分享已在真機驗收。
- 112 `private/copied`、0 public+verified 是過往歷史快照，這輪未讀 D1/R2 或重新驗證；私人音訊完整性 `audit-private-audio.yml` 必須另外取得業主具體授權，**不得執行**。
