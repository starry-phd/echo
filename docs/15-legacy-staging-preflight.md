# 舊 Echo D1 → 同一 Starry echo-starry D1：非覆寫遷移盤點（2026-10-30）

## 現況與禁止事項
此文件根據 Issue #3 的最近一次**實際讀回快照**製作；數量不是持續監測。舊來源 `echoes_db` 有 50 張應用資料表、合計 2,534 筆。目的地僅使用**已存在**的 `echo-starry` D1。既有 `echo_*` 正式表不覆寫、不還原整庫、不另建第二個 D1。前一次跨 Cloudflare 帳戶搬移已觸發平台安全限制，**不能在本對話重試或換 API 繞過**。

已存在的 `legacy_*` 表是私有隔離的暫存資料，不是任何新會員、VIP、評論、分享或播放 API 的授權來源。使用者對私人音訊 Runner 下載／解碼／雜湊及 artifact 的**特定授權仍待取得**，本工具完全不碰 R2 或音訊位元組。

## 本次新增
- `database/legacy-staging-status.json`：只保存表名與**已查核的列數**，不知道舊來源數量的表以 `null` 表示，避免編造。舊 `legacy_ai_story_facts` 是 **70/264**、`legacy_tracks` 是 **28/112**，尚未完成；其他部分目的列數不等於已核實來源完整。
- `scripts/check-legacy-staging.mjs`：**完全離線、唯讀**的 CI 前置檢查，核對 `echo-starry` 名稱、來源 `echoes_db`、表名 `legacy_*` 隔離、禁止憑證及中央會員主資料表、重複表、負數/異常超額列數。掃描 `worker/` 和 `src/api/`，若公開程式碼直接引用 `legacy_*` 則 CI **失敗**。
- `scripts/legacy-staging-reconciliation.mjs` 與 `tests/legacy-staging.test.mjs`：單元測試包含不同數量、缺來源列數、重複表、越界與舊 `users`／`auth_sessions`／`external_app_auth_codes`／`vip_share_access` 的拒絕；即使行數相等也只標為 `row-count-match-only`，永不自動稱為內容／授權已驗證。

## 未來合法續作（不在本 PR 執行）
1. 由**已獲准**的官方 D1 匯出／匯入程序或有雙帳戶授權的 Work/本機可靠工具，先從兩個帳戶個別做**只讀的表名／列數**重新盤點，並重新檢查已存在的 `legacy_*`（有可能只匯入了半批）。
2. 經過欄位安全分類：**不搬運**舊登入 session/tokenHash、外部登入 code、VIP 分享密碼，也不把舊 `users` 當新 Starry ID；對個資、評論、可識別資料與音訊權利各自評估合法使用界線。
3. 僅在事前備妥目標 Time Travel bookmark、獨立正式授權與可審核交易時，在現有 D1 的私有隔離暫存表做非覆寫、可重入、以主鍵為準的有限補齊；每批記錄成功／失敗並唯讀確認目標狀態，不以重試掩蓋可能已寫入的副作用。
4. 補完後也必須逐表比較主鍵集合、行數、允許欄位的資料一致性與權利策略；**數量相等不是媒體完整性，也不是發布權利**。絕不讓公開 Worker 或 App 查詢舊 `legacy_*`。
5. `echo_tracks` 既有 112 件保持 `private/copied`；28 張訪客資訊卡白名單是另一個已核准的顯示契約，不能視為播放授權。要開放音訊需另外逐曲權利與內容稽核。

執行 `npm run staging:check` 只讀本 Repo 的 JSON 與公開 API 程式檔案，不需要 Cloudflare Token、連線、音檔或會員密碼，也不會修改 D1/R2。
