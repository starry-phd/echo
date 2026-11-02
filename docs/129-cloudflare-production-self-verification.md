# 129｜Production 部署自動加上 Cloudflare 唯讀驗收（latest＋exact 100%、舊網域不變）

## 為什麼
- 交接 SOP（`docs/CLAUDE_RELEASE_OPERATIONS_2026-11-02.md` 第 7 節）要求每批部署後以 Cloudflare 官方 API GET `echo-starry` 的 **latest** 與 **exact** deployment，確認同一 version **100%** 流量，並確認 `echo.starry.phd` 仍綁 `temp-starry-echo-bridge`。
- 2026-11-02 業主僅以手機作業，Claude 工作環境沒有可讀 deployments／domains 的 Cloudflare 連接器，也連不到 workers.dev；PR #143 因此只能拿 job log 的 Version ID 當證據。業主選擇「讓每次部署自動驗收」。

## 實作
1. `.github/workflows/deploy-worker.yml`
   - 上傳步驟改為 `set -euo pipefail` 後 `npx --yes wrangler@4 deploy 2>&1 | tee /tmp/echo-wrangler-deploy.log`：輸出照舊顯示在 log，同時保存本次上傳的 `Current Version ID`；`pipefail` 確保上傳失敗不會被 `tee` 遮蔽。
   - 兩個 HTTP smoke 之後新增 **Verify Cloudflare latest and exact deployment and legacy domain (read-only)**，執行 `node scripts/verify-cloudflare-production.mjs`。
2. `scripts/cloudflare-production-validation.mjs`（純斷言）＋`scripts/verify-cloudflare-production.mjs`（只發 GET）：
   - 從本次 wrangler 輸出取唯一 Version ID。
   - GET `/accounts/9ff1b4c261141730ac2fe0683f730062/workers/scripts/echo-starry/deployments` 取最新一筆，再 GET 該 `deployments/{id}` exact；兩者必須同 id、只路由到一個 version、`percentage=100`，且就是本次上傳的 version。否則（舊版、分流、非 100%、API 失敗）**部署工作判為失敗**。最多重試 6 次以涵蓋 API 傳播延遲。
   - GET `/workers/domains?hostname=echo.starry.phd`：仍綁 `temp-starry-echo-bridge` → 記錄「unchanged」；綁到 `echo-starry` 或其他服務 → **失敗**；Token 沒有讀取自訂網域權限（401/403）或此帳號看不到該網域 → 以 `::warning::` 標 **UNVERIFIED**，絕不當成通過。
   - 帳號固定為 Starry 帳號；不列印 Token 或部署者 e-mail；不做任何 POST/PUT/DELETE、回滾、路由、DNS 或 Secret 變更。
3. `scripts/check-release-safety.mjs`（release:guard）：新增必要標記，並強制驗收步驟在上傳之後、讀取同一份上傳 log、上傳使用 pipefail。`tests/release-safety.test.mjs` 新增 3 個反向案例；`tests/cloudflare-production-validation.test.mjs` 7 項。

## 使用方式與界線
- 之後每次合併後的唯一自動 Production，job log 會出現：
  `Cloudflare latest == exact deployment <id>: version <id> at 100% traffic, created <UTC> ...`
  以及 `Cloudflare custom domain echo.starry.phd still bound to temp-starry-echo-bridge (unchanged)` 或 `::warning:: ... UNVERIFIED: ...`。接手者把這兩行連同四段 guest 安全字樣寫入 Issue #3。
- 若網域行顯示 UNVERIFIED，代表現有 Token 權限不足或網域不在此帳號；需業主決定是否調整 Token 權限（**本 PR 不改任何 Secret**）。
- 不改觸發條件（仍只限成功的 main push CI `workflow_run` 與受確認的手動 dispatch）、Environment、SHA 雙重核對與 guest smoke。
