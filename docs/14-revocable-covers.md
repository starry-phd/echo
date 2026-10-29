# 2026-10-29｜訪客封面撤銷快取修復與公開資訊文案

- 現有 R2 與 Echo D1 完全不修改；只有 28 筆白名單的封面可由 `/api/v1/previews/:id/cover` 讀取，私人音檔仍 112 `private/copied`。
- 風險：原封面端點 `Cache-Control: public,max-age=3600`；在刪除白名單後，已快取影像可能維持最多一小時，與預期撤銷行為不符。改為每次重新檢查 D1 的 `no-store`；資料列移除時下一次非快取請求 404，並且不觸及 R2。使用 `?policy=2` 跳過先前的同 URL 瀏覽器快取。已被第三方另存的圖片不會自動銷毀。
- 如未來正式上線可播放之 public+verified 音訊，HTTP Range 音訊亦改 `no-store`；撤銷後不得從 Worker 自有快取繼續提供，但需單獨評估合法播放器的流量與中斷續播影響。
- UI 首頁不再誤稱全部「已驗證公開內容」；明確標示「訪客資訊卡（唯讀）／播放須另經授權」，播放數採篩選後的真正可播放曲目數。
- 自動測試包含白名單撤銷、快取標頭、白名單 cover URL 版本、非公開音訊的安全門檻；應在正式部署後用 URL／權限測試再次驗證。此 PR 不執行私人音訊稽核、不部署、也不變更 R2 公開狀態。

## 2026-10-30｜續作：正式部署必須實測封面撤銷安全標頭

- `deploy-worker.yml` 原本只驗證 28 張照片的 200 與 MIME，**無法辨別 PR #22 的 `no-store` 變更是否實際生效**。已增添 HTTP smoke：清單 `/api/v1/previews`、全部28張圖片，都必須回傳 `Cache-Control: no-store`；清單中的圖片路徑必須有 `policy=2`；對從未列入白名單的測試 ID 要得到 404 且 `no-store`。
- 不變更白名單、D1/R2、音訊 private/copied 或 Environment；沒有對真正已撤銷ID做寫入操作。這個驗收只證明工作流實際收到的標頭，不能保證第三方在先前已另存的圖片可被遠端刪除。
- 首頁修復雙來源故障狀態：若 verified public catalog 為0、但28張 metadata 的 API 暫時失敗，現在會顯示「讀取失敗／重試」，而非錯誤判斷為「沒有音檔」。若部分 API 失敗但仍有另一個可用清單，保留可瀏覽卡片並清楚提示部分資訊未完整更新。本行為有純函式回歸測試。

## 2026-10-30｜驗收失敗根因分析與改進（run #40911155585）

- 2026-10-29 16:25:45 UTC Worker 真正發布成功，首頁與基本 API smoke 皆 success；但 16:25:47 UTC 的 28 張資訊卡延伸驗收 `exit 1`，原 shell 腳本所有 `grep/test/node -e` 都不顯示錯誤屬於哪一條件，GitHub run 標為 failure。不可因此誤稱 Wrangler 發布失敗。
- 已使用 [PR #24 初步診斷 CI #40912322983](https://github.com/starry-phd/echo/actions/runs/40912322983) **從 GitHub Runner 唯讀測試當前 Cloudflare Production**：`/api/v1/previews` status 200、`Cache-Control: no-store`、28 筆、policy=2/description=null/playable=false 皆正確；28/28 張圖片都回 200、image/*、no-store、內容長度 > 1KB，沒有任何失敗；未白名單封面與音訊拒絕 404、no-store。**當初單次失敗不能從舊 log 唯一定位；最可能是發布後立即測試期間的短暫邊緣傳播／暫時性回應差異，尚不能當作已證實的根因。**
- 以 `scripts/check-production-guest.mjs` 取代不具診斷性的 Bash，保留完整**嚴格**驗收要求且新增有限重試：初次清單 10 次、每張封面最多 4 次、私人 stream 404 5 次、非白名單封面 404 5 次。輸出失敗條件與序號（不輸出音檔ID、講者、封面路徑、私人資料），全部成功才回 success。
- `scripts/production-guest-validation.mjs` 純函式及 `tests/production-guest-validation.test.mjs` 回歸涵蓋 28 張名單數量、類型/大小/權限/白名單 URL/no-store、未授權 404/no-store。**原音檔不下載、不解碼、不公開；未變更任何 Worker/R2/D1/封面公開政策**。
- 本補丁只加強**未來**正式部署的後置健康檢查，不聲稱舊的 GitHub run #40911155585 變成成功；Cloudflare Worker 新版上線與 28 張封面實際已通過獨立 CI 現場驗證，兩者應分開記錄。
