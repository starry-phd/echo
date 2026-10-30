# 2026-10-30｜首頁即時搜尋與抽選的舊結果競態修復

## 問題
首頁 `query` 為輸入框即時內容，但 API `tracksQuery` 與本機結果過濾都以 250ms 後的 `debouncedQuery` 為準。使用者剛輸入或清除搜尋時，UI 會短暫渲染上一次查詢的卡片和數字，而「召喚繁星解答」仍啟用，可能抽中不符合**目前輸入**的上一輪卡片。如果公開來源尚在載入，當時亦可能抽到只有部分來源的結果或顯示誤導的沒有卡片提醒。

## 實作
- 新增純函式 `currentCatalogDisplayState`：本機裝置偏好 `ready=false`、`query!==debouncedQuery` 或來源 API 載入中都視為 `loading`。等目前的 API queryKey 回應就緒，才將結果放到畫面。保留來源失敗 `failed` 與真正 `empty` 的既有語意。
- 新增 `canDrawFromCurrentCatalog`：禁止在 `loading`、`failed` 或正在旋轉時抽選。真正空結果仍可使用原本的「目前條件無合法卡片」提示，不謊稱私人資料已可抽選。
- `app/index.tsx` 的列表、計數、半成功 warning、抽選按鈕、已抽中的名稱/照片相關卡片資訊，皆採**同一個** current catalog 狀態；新的輸入尚未完成讀取時隱藏上一輪標題和抽選結果。原有 `query` 改變時清除計時器的 useEffect 保持，避免過時 timer 接續抽選。
- 新增 `tests/current-catalog-display-state.test.mjs`，涵蓋搜尋輸入與 debounce 不同步、偏好 hydration、載入/失敗/空結果、抽選狀態及首頁 UI Gate。已有 `safeLuckyDraw` 白名單/播放拒絕測試保持。

## 安全／未完成
**純 UI UX 修復**，不是媒體權利檢查；正式能播放的只有 Worker verified-public API 認可資料，28核准訪客卡仍僅顯示照片與唯讀 metadata。沒有讀取/下載/解碼/公開私人錄音，也沒有改 Worker、D1/R2、Starry ID、H-Global、廣告/付費或保護規則。

PR CI 成功與 main 合併不代表 Production 已上線。部署仍須重新核對 latest main push CI、沒有正在等待／執行的 Production run，依 `.github/workflows/deploy-worker.yml` 一次性精確 SHA 手動 workflow_dispatch + `DEPLOY-ECHO-STARRY-PRODUCTION` + Environment 人工審批，再實測28張封面/no-store、私人 stream 404、手機/桌機搜尋、清除搜尋、抽選切換。
