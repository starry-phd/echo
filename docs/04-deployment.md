# Cloudflare Workers Static Assets 發布說明

## 目標

唯一應用程式：`echo-starry` Worker；Cloudflare Account ID：`9ff1b4c261141730ac2fe0683f730062`。
`wrangler.toml` 同時定義 `worker/index.ts`、Expo Web 的 `dist/` 靜態檔、D1 `DB` 與 R2 `MEDIA`。
Cloudflare Pages 不使用，先前空專案已刪除。

## 已完成

- SDK 58 Expo Web `web.output=static` 可產生網頁版建置產物，CI 驗證成功。
- GitHub Actions 會執行 typecheck、Worker API 權限測試及 Web 打包。
- `.github/workflows/deploy-worker.yml` 支援正式授權後使用 `workflow_dispatch` 明確發布。
- 舊資料尚未切換，必須保持 `visibility='private'`、`migration_status='pending'`。

## 首次部署條件

GitHub `starry-phd/echo` 的 `Settings > Secrets and variables > Actions` 需有
`CLOUDFLARE_API_TOKEN`，權限最小化為 Starry 帳號的 Workers Scripts Write
（首次配置 Static Assets、D1、R2 綁定時也需權限檢查）。
不要將 Token 貼入 issue、commit 或 README。

取得安全授權並經程式、帳號安全審閱後，手動執行
`Actions > Deploy Expo Web to Cloudflare Workers Static Assets > Run workflow`。
可在同一 Worker 網域檢查 `/`、`/profile`、`/api/health`、`/api/catalog`，
並確認新 R2 媒體尚未驗證時，不會公開音檔。

## 限制

此部署流程不會自動刪除舊服務、移轉 DNS，亦不會將 `id-starry` 視為現有可用 API。
iOS 與 Android 仍須另行執行 EAS／實機驗收。

## 2026-10-29 v1.3 正式發布證據與阻擋條件

- 使用者 2026-10-28 已在對話要求繼續開發及正式部署；此為操作授權，不是授權、資料、測試與商店資格已完成的證明。
- 完整 Web 靜態資產部署需要 GitHub Actions Secret CLOUDFLARE_API_TOKEN；不能透過 API-only Worker 腳本替代 Expo Web assets。
- R2 來源 598 物件、目標 R2，目前尚未完成跨帳號遷移；新 D1 112 筆中 verified=0。沒有授權核對不可一鍵全部公開。
- 中央 id-starry 的正式 API 契約和身分驗證仍待對接；登入、收藏、上傳、VIP、購買必須 fail closed。
- iOS／Android 的 Expo Project、EAS Build、簽署與 App Store / Google Play 送審還需要真實驗證證據；CI Web build 不能代替。
- 發布後要核對首頁、健康 API、分類、講師、音檔搜尋與未核准音檔 404；不得宣稱未經 HTTP 驗收已上線。
- Ads Provider 仍選 Google AdMob Mediation，但 Ads OFF，不啟動 SDK、不產生廣告請求。
