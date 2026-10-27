# Cloudflare Workers Static Assets 發布說明

## 目標

唯一應用程式：`echo-starry` Worker；Cloudflare Account ID：`9ff1b4c261141730ac2fe0683f730062`。
`wrangler.toml` 同時定義 `worker/index.mjs`、Expo Web 的 `dist/` 靜態檔、D1 `DB` 與 R2 `MEDIA`。
Cloudflare Pages 不使用，先前空專案已刪除。

## 已完成

- SDK 57 Expo SPA `web.output=single` 可產生網頁版建置產物，CI 驗證成功。
- GitHub Actions 會執行 typecheck、Worker API 權限測試及 Web 打包。
- `/.github/workflows/deploy-worker.yml` 支援正式授權後使用 `workflow_dispatch` 明確發布。
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
