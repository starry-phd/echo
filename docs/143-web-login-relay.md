# 143｜網頁版登入改用 Starry 登入中繼

## 依據
`starry-phd/id` main `c53fc39`：`docs/integration-guide.md` §11.2（2026-11-03 更新）、`src/web/login-relay.ts`、changelog #33。網頁版不再自己載入 Google Identity Services／Sign in with Apple JS，也不必向 Apple、Google 登記本網站。

## 流程
1. 會員頁按「使用 Google／Apple 帳號登入」→ `POST /v1/auth/nonce`。
2. `webRelay.prepareWebRelay`：原值 nonce 與 24 bytes 隨機 state 存 `sessionStorage`（單次、10 分鐘），以 WebCrypto 算 SHA-256；整頁前往 `https://<Starry ID>/auth/{google|apple}/start?app_id=echo&nonce=<雜湊>&return=https://echo.starry.phd/auth/done&state=<state>`。
3. 回到 `/auth/done#id_token=…&state=…`（Apple 另有 `code`）。`app/auth/done.tsx` **先用 `history.replaceState` 清掉 `#`**，再取出並刪除暫存、核對 state 與時效，呼叫 `POST /v1/auth/{provider}`（原值 nonce；Apple 帶 `authorization_code` 與 `redirect_uri=<Starry ID>/auth/apple/callback`），完成後回會員頁。
4. 只有 `https://echo.starry.phd`（Starry ID `web_origins`，2026-11-04 起取代 workers.dev）顯示登入按鈕；本機預覽顯示「此網址不支援」。

## 程式
- `src/auth/starryId/starryRelay.ts`：Google／Apple 通用中繼（深層連結用 `?`、網頁用 `#`）；`appleRelay.ts` 改為包裝（Android Apple 不變）。
- `src/auth/starryId/webRelay.ts`、`app/auth/done.tsx`（新路由）；刪除 `webSignIn.ts`（GIS／Apple JS 載入器）。
- 登入版 CSP 只多 `connect-src`／`img-src` 的 Starry ID 網址；不再有任何 Google／Apple 來源。
- 登入版隱私權政策補充：網頁登入會整頁前往 Starry ID、暫存一次性驗證資訊。
- 測試：`tests/starry-id-web-sign-in.test.mjs`（中繼 3 項取代舊 2 項）、`tests/web-security-headers.test.mjs` 更新。

## 手機 Google 登入的建議
Starry ID 目前規劃 Android Google 用原生套件（需要 Android OAuth Client 與簽章 SHA-1）。同一套中繼也支援 Google：若 Starry ID 把 `echostarry://auth/google` 加入 `return_urls`，iOS 與 Android 都可用系統瀏覽器（ASWebAuthenticationSession／Custom Tabs）走中繼，**不需要 Google iOS／Android Client，也不需要 SHA-1**。待與 Starry ID 確認。
