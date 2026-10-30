# 2026-10-30｜PR #60：Web/PWA 公開演講資訊圖卡 PNG

## 與舊版的實際差異
舊 `yukidu/Echo-Starry/src/components/DetailView.tsx` 在「分享錄音」旁提供「匯出圖卡」，透過 `exportTrackFullCardImage(track,comments...)` 匯出含會員心得的完整 JPEG；新版沒有圖卡匯出，且目前正式公開 API **沒有**舊會員心得與知識卡原始資料，不能用私人音訊或舊 D1 冒充完整資料。

本輪補上安全、真實執行的**第一階段：公開演講資訊圖卡 PNG**。在經合法 `getPublicTrack(routeId)` 的 `/track/[id]` 詳細頁，「分享錄音」旁加入「匯出公開資訊圖卡 PNG」。用現有 Web Canvas 在本機產生 **960 × 1280 PNG 檔案**，包含 *已核准公開* 的標題、講者、簡介、前三/四種分類、時長、上架日期（如有）、公開詳情頁網址與「不含會員／私人內容」標示；無遠端圖像或背景請求，支援瀏覽器／Web PWA 下載。不會假裝這是舊版的「含評論與知識整理完整資訊圖卡」；按鈕及輔助說明皆明確區分，原生 iOS/Android 暫未提供此功能，也未宣稱真機通過。

## 授權與實作守門
- 新純函式 `buildApprovedPublicInfoCard(track,routeId,origin)` 沿用 PR #57 `approvedPublicTrackShareMessage`，必須 `playable === true`、核准 URL 的 ID 與 route 完全一致、有效 HTTPS（localhost 可 HTTP）、有效標題/講者。訪客 `/preview/[id]` **完全沒有**分享/匯出元件、音訊與私人資料。
- **匯出按下後再做 `getPublicTrack(routeId)` 正式網路公開權限重查**，用重新查得的最新合法資料建立圖片。若已撤銷核准、尚不可播放、斷網或來源缺失則拒絕並告知，不能把快取的清單當作權利憑證。
- Web Canvas 只畫公開文字，不載入遠端封面，不讀舊 D1／R2 私有資料、歷史112私人音檔、會員姓名/評論、網友關鍵字、AI、參考檔案、圖片、音訊串流。會清理控制字元、限制文字長度以避免意外巨量輸出，超長說明明確標註到公開頁查閱。
- 由使用者按鈕觸發下載檔，未在 render 或 export 之前存入本地Storage，不自動發送到任何平台；瀏覽器 PNG 支援狀態／失敗明確告知。
- `audit-private-audio.yml` 仍需業主**單獨具體授權**；本輪不執行。舊快照 `112 private/copied, 0 public+verified` 未重新驗證 D1/R2，也不因此開任何私有播放或分享。
- 新增 `src/ui/echo/publicInfoCardExport.ts`、`tests/legacy-approved-public-png-export.test.mjs`，修改 `src/ui/echo/LegacyVerifiedTrackShare.tsx`；不更動 Worker/D1/R2/Starry ID/Ads/付款/AI/會員。
- **完成狀態僅能依 PR CI 綠燈→protected merge→main CI 綠燈→唯一 GitHub 自動 Production→28/28 guest metadata/covers/no-store/private404 smoke→Cloudflare Worker version/100% 唯讀驗收後標上線**。真正可公播內容與原生裝置測試目前不足，不應宣稱已實際驗證真會員完整舊圖卡或 App Store。
