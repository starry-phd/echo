# 140｜會員登入開放準備：登入版隱私權政策＋依建置產生 CSP

## 目的
讓「開放網頁版繁星會員登入」只剩業主後台設定、業主核准與一個建置變數，不再需要臨時改政策或安全標頭。

## 內容
1. **登入版隱私權政策**（`src/legal/privacyPolicy.ts` `PRIVACY_POLICY_MEMBER_SECTIONS`）：依 `src/auth/starryId/*` 與 `starry-phd/id` 指南撰寫 — Starry ID 管理會員帳號、Google／Apple 登入憑證交給 Starry ID 驗證、本 App 只讀取會員編號／顯示名稱／頭像／狀態／同意狀態、不讀不存 Email 等欄位、網頁憑證存放方式（記憶體＋sessionStorage）、手機 App 的安全儲存區、刪除帳號（App 內或 `https://id.starry.phd/account/delete`，7 天撤回、不自動取消商店訂閱）、連到 Starry ID 隱私權政策與服務條款、英文摘要。
   - `app/privacy.tsx` 以 `privacyPolicyFor(centralMemberApiState()!=='not-configured')` 選擇：**只有建置開啟 Starry ID 時才顯示登入版**，目前線上仍是訪客版。
2. **依建置產生的安全標頭**：`npm run build:web` = `expo export` ＋ `node scripts/write-web-headers.mjs dist`。
   - 未設定 Starry ID → 產生與 `public/_headers` 完全相同的訪客版（測試保證一致）。
   - 設定為白名單 Starry ID 網址 → CSP 只多放行 `connect-src <Starry ID>`（API）與 `img-src <Starry ID>`（會員頭像）；不放行任何 Google／Apple 來源（#165 起）。
   - 非白名單網址 → 建置失敗。Production smoke 以同一函式、依同一變數驗證標頭。

## 開放網頁登入的步驟（2026-11-03 起改用 Starry 登入中繼，#165）
網頁版改為整頁前往 Starry ID 的登入中繼（`starry-phd/id` 指南 §11.2 更新），**業主不必再到 Google Cloud 或 Apple Developer 登記本網站**，本網站也不載入 Google／Apple 的程式。
1. 業主核准開放會員登入。
2. Claude：PR 在 `.github/workflows/deploy-worker.yml`（build 與 smoke 步驟）及 `ci.yml` 設定 `EXPO_PUBLIC_STARRY_ID_API_BASE_URL=https://starry-id-staging.starry-phd.workers.dev`（先 staging），並把 `PRIVACY_POLICY_MEMBER_UPDATED` 改成實際上線日期。
3. 部署後檢查：smoke 驗登入版 CSP（只多 Starry ID 網址）、自動截圖 CSP 違規 0、會員頁出現兩顆登入按鈕；業主實際用 Google／Apple 登入、同意條款、登出、刪除帳號。
4. 都正常後，另一個 PR 改成 production `https://id.starry.phd`。
5. 網頁版日後換網域（例如 `echo.starry.phd`）時，請 Starry ID 更新 `web_origins`，並同步修改 `src/auth/starryId/webRelay.ts` 的 `APP_WEB_ORIGIN`。

## 未包含
手機 App 原生登入（需 `EXPO_TOKEN`、Android 簽章 SHA-1、iOS Google Client）。
