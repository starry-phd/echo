# Cloudflare Workers Static Assets 發布說明

> **2026-10-31 正式主網址：https://echo.starry.phd。** 舊 `https://echo-starry.starry-phd.workers.dev` 為技術網址，**不得再當正式主網址**。Cloudflare Custom Domain 已由原暫時 `temp-starry-echo-bridge` 改綁 `echo-starry` Worker，未重建DNS/憑證。最新保護流程是 PR exact HEAD CI success → protected merge → main CI success → **唯一自動** `workflow_run` Production（無須手動重啟）→ 正式主網址的 HTTP / private-media 拒絕 / 28核准封面不可播 smoke → Cloudflare 100% 官方查驗。本文下方包含舊歷史快照，如有衝突以本段及 Issue #3 頂端優先。未核准私人媒體、Starry ID、商店上架不可藉主網址變更解鎖。

## 目標

唯一應用程式：`echo-starry` Worker；Cloudflare Account ID：`9ff1b4c261141730ac2fe0683f730062`。
`wrangler.toml` 同時定義 `worker/index.ts`、Expo Web 的 `dist/` 靜態檔、D1 `DB` 與 R2 `MEDIA`。
Cloudflare Pages 不使用，先前空專案已刪除。

## 已完成

- SDK 58 Expo Web `web.output=static` 可產生網頁版建置產物，CI 驗證成功。
- GitHub Actions 會執行 typecheck、Worker API 權限測試及 Web 打包。
- `.github/workflows/deploy-worker.yml` 支援正式授權後使用 `workflow_dispatch` 明確發布。
- 2026-10-29：舊音檔已複製至新 R2，Echo D1 112 筆為 `migration_status='copied'`、`visibility='private'`；`verified=0`，不代表可公開播放。

## 首次部署條件

GitHub `starry-phd/echo` 的 `Settings > Secrets and variables > Actions` 需有
`CLOUDFLARE_API_TOKEN`，權限最小化為 Starry 帳號的 Workers Scripts Write
（首次配置 Static Assets、D1、R2 綁定時也需權限檢查）。
不要將 Token 貼入 issue、commit 或 README。

取得安全授權並經程式、帳號安全審閱後，手動執行
`Actions > Deploy Echo public Web shell to Cloudflare Workers > Run workflow`。
可在同一 Worker 網域檢查 `/`、`/profile`、`/api/health`、`/api/catalog`，
並確認新 R2 媒體尚未驗證時，不會公開音檔。

## 限制

此部署流程不會自動刪除舊服務、移轉 DNS，亦不會將 `id-starry` 視為現有可用 API。
iOS 與 Android 仍須另行執行 EAS／實機驗收。

## 2026-10-29 v1.3 正式發布證據與阻擋條件

- 使用者 2026-10-28 已在對話要求繼續開發及正式部署；此為操作授權，不是授權、資料、測試與商店資格已完成的證明。
- 完整 Web 靜態資產部署需要 GitHub Actions Secret CLOUDFLARE_API_TOKEN；不能透過 API-only Worker 腳本替代 Expo Web assets。
- R2 來源 598 物件（含兩個空佔位）；目標已複製 596 個有內容物件，經 key/size/ETag 核對；D1 112 筆全為 `copied/private`，`verified=0`。未完成播放與權利驗收前不得公開。
- 中央 id-starry 的正式 API 契約和身分驗證仍待對接；登入、收藏、上傳、VIP、購買必須 fail closed。
- iOS／Android 的 Expo Project、EAS Build、簽署與 App Store / Google Play 送審還需要真實驗證證據；CI Web build 不能代替。
- 發布後要核對首頁、健康 API、分類、講師、音檔搜尋與未核准音檔 404；不得宣稱未經 HTTP 驗收已上線。
- Ads Provider 仍選 Google AdMob Mediation，但 Ads OFF，不啟動 SDK、不產生廣告請求。

## 2026-10-29 安全發布規則（候選 PR，合併後才生效）

- Cloudflare Production 工作流改為 **workflow_dispatch 唯一入口**；移除 release branch push 自動部署。
- GitHub Actions 執行時必須選 main、輸入 40 字元核准 SHA，以及 DEPLOY-ECHO-STARRY-PRODUCTION 確認字串；Worker 上傳前檢查 event/ref/HEAD SHA。
- 經核准的 main SHA 會於啟動時及 Wrangler bundle dry-run 後、真正上傳 Worker 前**再次比對遠端 main HEAD**；若有新提交則中止部署，不自動改用最新提交。這是程式安全 Gate，**不取代** GitHub Environment required reviewers 的人工設定與檢查。
- 現在 starry.app.json 的 lifecycle.productionAuthorized=false，故無法部署。此旗標只有獲得當次業主正式授權、獨立 PR 核准才可改成 true。
- 此工作流使用 production Environment，但 GitHub 的 Environment 必要審閱者及機密存取設定仍須另行人工檢查；不能只憑 YAML 宣稱已受保護。
- 私人 R2 解碼抽樣改為手動，不再因修改該 workflow 而自動讀取音檔。
- CI 新增 release:guard 靜態檢查，不能取代實際 HTTP、原生 EAS 或權利驗收。
