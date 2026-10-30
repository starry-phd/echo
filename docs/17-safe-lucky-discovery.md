# 2026-10-30｜原版「召喚繁星解答」按鈕安全過渡版

原版 `yukidu/Echo-Starry/src/App.tsx` 的 `handleLuckyDraw` 只從使用者實際 `checkCanAccess` 且貼紙合格的非私人 VIP 音檔中抽選，原版含旋轉與音效、抽中資訊。新版目前 112/112 錄音仍 `private/copied`，0 `public+verified`，所以**不能**透過複製原版 UI 的動畫、猜測播放權限或讓前端獨立授權來恢復完整抽音與播放。

這輪實作一個**明確標示的唯讀過渡功能**：按首頁原「💫召喚繁星解答」若存在 *Worker 完成 `public + verified`* 且篩選後可播放項目，照既有受保護流程導向播放頁；否則只從當下**已被 GET /api/v1/previews 白名單允許**、`legacySnapshot=true`、`playable=false`、`description=null`、`coverUrl=/api/v1/previews/:id/cover?policy=2` 的資訊卡中隨機選一張。結果顯示「本次抽中訪客資訊卡」「僅可查看照片及資訊、不可播放」，按「查看資訊卡」只導向 `/preview/[id]`，不建立 audio player、不呼叫私人 Stream、不下載 R2。

- 承接首頁已完成的搜尋／分類／獎銜／我不喜歡排除：**抽選池就是當前 `visibleTracks`**，不會重新查詢或突破使用者篩選、卡片白名單。可選多張時不連續抽到同一張。
- 未取得資料、全部被隱藏或無可核准候選時，只顯示安全提示而不隱含存在未批准的私有音訊。網路失敗仍由首頁既有讀取錯誤區處理，不向 R2 偷抓或揭露內部路徑。
- 結果只保留在該畫面元件狀態；卡片被「我不喜歡」隱藏或改篩選後，先前結果自動不再顯示。結果頁無會員／商店／Battery 副作用。
- 本輪只處理唯讀前端、安全邊界與離線自動回歸（`tests/safe-lucky-draw.test.mjs`）。**原版動畫、貼紙權限、音效、真隨機音訊播放仍 BLOCKED**，需日後可信音訊授權與實機驗收才可真正宣稱還原。
- 現有 Cloudflare D1/R2/權限不變，不授權任何新的音檔；須 PR CI + 受保護合併 + main CI；Web UI Runtime 變更發布仍受獨立 Production Environment/手動工作流 Gate，不能把 merge 當已上線。

參考源：`yukidu/Echo-Starry/src/App.tsx` 約行 2270-2350、2800，`docs/06-legacy-feature-inventory.md`，整合《最新開發技術規範》UP-03／10／13／19。
