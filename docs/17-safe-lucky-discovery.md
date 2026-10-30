# 2026-10-30｜原版「召喚繁星解答」按鈕安全過渡版

原版 `yukidu/Echo-Starry/src/App.tsx` 的 `handleLuckyDraw` 只從使用者實際 `checkCanAccess` 且貼紙合格的非私人 VIP 音檔中抽選，原版含旋轉與音效、抽中資訊。新版目前 112/112 錄音仍 `private/copied`，0 `public+verified`，所以**不能**透過複製原版 UI 的動畫、猜測播放權限或讓前端獨立授權來恢復完整抽音與播放。

這輪實作一個**明確標示的唯讀過渡功能**：按首頁原「💫召喚繁星解答」若存在 *Worker 完成 `public + verified`* 且篩選後可播放項目，照既有受保護流程導向播放頁；否則只從當下**已被 GET /api/v1/previews 白名單允許**、`legacySnapshot=true`、`playable=false`、`description=null`、`coverUrl=/api/v1/previews/:id/cover?policy=2` 的資訊卡中隨機選一張。結果顯示「本次抽中訪客資訊卡」「僅可查看照片及資訊、不可播放」，按「查看資訊卡」只導向 `/preview/[id]`，不建立 audio player、不呼叫私人 Stream、不下載 R2。

- 承接首頁已完成的搜尋／分類／獎銜／我不喜歡排除：**抽選池就是當前 `visibleTracks`**，不會重新查詢或突破使用者篩選、卡片白名單。可選多張時不連續抽到同一張。
- 未取得資料、全部被隱藏或無可核准候選時，只顯示安全提示而不隱含存在未批准的私有音訊。網路失敗仍由首頁既有讀取錯誤區處理，不向 R2 偷抓或揭露內部路徑。
- 結果只保留在該畫面元件狀態；卡片被「我不喜歡」隱藏或改篩選後，先前結果自動不再顯示。結果頁無會員／商店／Battery 副作用。
- 本輪只處理唯讀前端、安全邊界與離線自動回歸（`tests/safe-lucky-draw.test.mjs`）。**原版動畫、貼紙權限、音效、真隨機音訊播放仍 BLOCKED**，需日後可信音訊授權與實機驗收才可真正宣稱還原。
- 現有 Cloudflare D1/R2/權限不變，不授權任何新的音檔；須 PR CI + 受保護合併 + main CI；Web UI Runtime 變更發布仍受獨立 Production Environment/手動工作流 Gate，不能把 merge 當已上線。

參考源：`yukidu/Echo-Starry/src/App.tsx` 約行 2270-2350、2800，`docs/06-legacy-feature-inventory.md`，整合《最新開發技術規範》UP-03／10／13／19。

## 2026-10-30｜補回原版視覺轉輪，但不新增私有內容權利

原版 `src/App.tsx` v148 使用 10–14 次、62–132 ms 漸緩的短週期視覺重排，最後把抽中的卡移到**第二格**，顯示「✨ 好手氣！✨」。本輪針對**已核准、仍不可播放**的 28 張訪客資訊卡補回同樣的 UI 概念：按鈕顯示「抽選中」，只在現有 `visibleTracks` 的合法 metadata 卡中輪播，抽出結果加外框、好手氣標籤和純資訊詳情入口。使用 `AccessibilityInfo.isReduceMotionEnabled`，若使用者要求減少動態效果，直接顯示結果；單一候選同樣不浪費動畫。

抽選期間再按按鈕不重複開始；切換搜尋、分類、獎銜、排序或 API 白名單導致顯示池變動，會取消未完成的定時器並清除抽選狀態。路由離開時清理定時器，避免殘留異步工作再顯示舊卡；抽選結果永不生成真實播放網址。動畫不含舊版涉及媒體權利的音效、伺服器貼紙扣款或任何音訊讀取。保留新 UI 正式部署／實機驗收的 gate。
