# 144｜正式網域 echo.starry.phd

## 業主決定（2026-11-04）
網頁與 API 改用 `https://echo.starry.phd`，不再使用 workers.dev 對外。Starry ID（`starry-phd/id` main `8d70d82`，integration-guide §11.1）已登記 `web_origins=["https://echo.starry.phd"]`，iOS／Android 識別碼皆為 `phd.starry.echo`。

## 變更
- `wrangler.toml`：`routes=[{pattern="echo.starry.phd",custom_domain=true}]`（Cloudflare 帳號 starry.phd@gmail.com、zone starry.phd）。`workers_dev` 先保留 true，待網域驗證通過後另一批關閉。
- `worker/index.ts` CORS 只允許 `https://echo.starry.phd`（與本機 localhost 開發）。
- `src/auth/starryId/webRelay.ts`：`APP_WEB_ORIGIN`、登入返回頁 `https://echo.starry.phd/auth/done`。
- `eas.json`（development／preview）、CI 的 `EXPO_PUBLIC_ECHO_API_BASE_URL`、Production 部署與所有驗收腳本（guest 檢查、截圖、無障礙）改指向新網域。
- `scripts/verify-cloudflare-production.mjs`：原本「echo.starry.phd 不得移到 echo-starry」改為「必須綁在 echo-starry」；綁在其他服務（含舊橋接 Worker）即失敗；token 無權限讀取網域時仍只標示 UNVERIFIED。
- 商店隱私權政策網址：`https://echo.starry.phd/privacy`。

## 未動
Starry ID 專案、Secrets、D1／R2、廣告（OFF）、RevenueCat（未初始化）、112 份私人音訊。
