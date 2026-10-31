# 76｜Release Gate 加強：28 張訪客卡逐一 HEAD 驗證音訊不可播放

## 既有驗收缺漏
- 舊版 28 張訪客卡由 `/api/v1/previews` 白名單展示，只有 metadata/核准封面、沒有私人音訊公開播放權。
- 舊版 GitHub 部署 smoke `scripts/check-production-guest.mjs` 逐張 GET/驗證 28 張**封面圖片**，但對 **stream** 路由只測試第一張 guest ID 的 GET 404；「28張訪客卡不可播放」因此缺少**逐 ID**的即時路由拒絕覆蓋。

## 改動
- 保留原第一張 guest stream 的 GET 404/no-store 回歸測試。
- 對 28 張已通過白名單/非可播驗證的 guest ID，逐張發送 **HEAD** `/api/v1/tracks/:id/stream`；要求 404 及 no-store。HEAD 不下載、解析或播放任何媒體內容，目的僅確認伺服器拒絕與回應標頭。每張以既有 bounded retry 防傳播時差。
- 更新 `tests/production-guest-validation.test.mjs` 確保發行腳本真的覆蓋 28 張且只做 HEAD；`tests/worker.test.mjs` 使用 28 個**本機合成** ID，確保 HEAD 404/no-store、`public+verified` SQL gate、完全 **0 R2 物件讀取**。

## 限制與驗收
這不是私人音訊完整稽核，不應讀取 R2、對合法音檔進行 Range 或測試真人播放。此變更只擴充既有新版 workers.dev 測試環境發布時的安全 Gate，**不修改 Worker handler、API、資料庫或任何現役正式站**。需 exact PR CI success、normal protected merge、exact main CI success、唯一 `workflow_run` 自動部署通過，以及 Cloudflare 官方100%及舊網域未變證據才算完成。若 HEAD 在既有 Worker 不支持，必須先修正常 Handler 或調整測試方法，**不得略過測試或假稱28筆已全驗證**。
