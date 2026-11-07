# Echo × Starry ID｜2026-11-07 測試站驗收與阻擋清單

## 本次安全界線

- **網站**：`https://echo-api-staging.starry-phd.workers.dev`
- **中央會員**：`https://id.starry.phd`（只呼叫正式公開 API，不改其程式、設定或資料庫）
- **正式網域**：`echo.starry.phd` 仍維持 302 暫時轉址到舊站，絕不修改。
- **GitHub**：增量更新在 Echo 原有開發 PR #168，未合併到 main。
- **正式 Echo Worker**：不發布、不執行正式資料庫遷移、不變更金鑰。
- **測試網站**：使用自己的 Cloudflare Worker `echo-api-staging`，僅公開 Echo 清單唯讀代理；禁止讀取私有音檔或向正式 Echo D1 寫入。

## 已可自動驗證（無會員密碼、無 Battery 扣款）

1. `GET /v1/apps/echo/config`：HTTP 200 且 `status: active`。
2. `OPTIONS /v1/auth/nonce`：測試網域的 POST 預檢獲准（含 content-type）。此測試不建立 nonce。
3. `GET /auth/google/start`：Starry 中繼接受已登記的預覽網址，導往 Google OAuth；不模擬使用者本人登入。
4. `GET /api/battery/balance`：未提供合法 Access Token 必須 HTTP 401。
5. `POST /api/battery/smoke`：未登入必須 HTTP 401，且不能預留或扣抵。
6. `GET /api/v1/battery/task-settings`：在獨立 staging 尚無 Echo D1 時必須 HTTP 404，而不是不小心直通正式資料。
7. `GET /api/v1/previews`：只顯示既有公開核准卡片；私人音訊不可讀取。

## 尚未啟用與必要的業主決策

### A. 手動驗證會員登入（業主本人操作）

1. 開啟 `https://echo-api-staging.starry-phd.workers.dev/profile`。
2. 點「使用 Google 帳號登入」，完成 Google 身分驗證，確認回到同一個測試網域。
3. 確認顯示 Starry ID 會員資料，再按「檢查繁星電池艙餘額」，檢查免費月額度與此 App 量子電池。不同意條款時，先完成 Starry 同意流程。
4. 如有錯誤，只提供**錯誤畫面**；不要傳任何 Token、Cookie、服務金鑰或網址的 `#id_token` 片段。

### B. Battery 實際預留與釋放（尚未執行）

`echo-api-staging` 尚未設 `STARRY_BATTERY_KEY`。業主只能透過 Cloudflare Worker **Secret** 設定；不要貼在 GitHub、App、聊天或日誌。正式 `echo-starry` 已有此金鑰，但 Cloudflare 無法向開發者提供其值，也不可不經評估便重新產生金鑰，避免使原本正式服務失效。

- 測試只允許已驗證 `staff_role=owner` 的會員操作預留並立即釋放，**不得**用假 AI 任務實際扣款。
- 若需實際扣款，必須另有真實 AI 任務與業主核准；服務離線、409 `BATTERY_APP_CAP`、503 `SERVICE_UNAVAILABLE` 一律不開始任務。

### C. Owner 任務價格持久化（尚未執行）

- 既有 `database/migrations/20261107_echo_battery_task_prices.sql` 已備妥，但**沒有套用**。
- 獨立 staging Worker 尚無自己的 Echo D1。**請先取得業主核准**建立隔離的 staging D1，以及任何可能產生費用的資源，再把資料庫綁到 `echo-api-staging` 並實作專用的 Owner endpoints。
- 絕不拿正式 `echo-starry` 的 D1 當測試庫。
- 程式必須在後端再次呼叫 `GET /v1/me` 驗證 `staff_role=owner`，不能憑前端是否顯示按鈕判斷權限。

### D. 正式發行

未經業主明確同意，不合併 main、不部署 `echo-starry` 正式 Worker、不套正式 D1 遷移、不提交 App Store／Google Play、不開 RevenueCat 商品。

## 相關紀錄

- 既有 Echo 登入與測試 PR：#168
- 2026-11-07 SDK／量子電池／立即刪帳／Owner 價格增量更新：#169（已合併至 PR #168 開發分支）
- 這次新增的是 staging **唯讀／未授權保護**實測，不是正式會員登入或 Battery 實際扣抵驗收。
