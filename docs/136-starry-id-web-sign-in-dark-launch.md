# 136｜網頁版繁星會員登入（預先建置、預設關閉）

## 來源
`starry-phd/id` `c62bef3` 串接指南第 2～4 節、第 11.2 節（網頁版 GIS／Apple JS、CORS、Token 存放）、`docs/fixtures`。建立在 #151 的連線核心上。

## 內容
- `src/auth/starryId/memberApi.ts`：App 設定、nonce、`POST /v1/auth/{google|apple}`（app_id `echo`、原值 nonce；Apple 另帶 `authorization_code` 與 `redirect_uri`）、`GET /v1/me`、`POST /v1/me/consents`、登出／登出所有裝置（伺服器失敗也一定清除本機）、`POST /v1/me/deletion {confirm:true}`（成功後清除本機 Token）、`DELETE /v1/me/deletion` 撤回。
- `memberFlow.ts`／`memberSession.ts`（純邏輯）：顯示狀態 disabled／checking／signed-out／consent-required／signed-in／pending-deletion／suspended／maintenance／update-required／unavailable，依 fixtures 錯誤碼表轉換；開啟面板時先查 App 設定，**沒有已存登入就不送任何 Token 請求**；App 設定關閉時不碰 Token。
- `webSignIn.ts`：只允許注入兩支腳本（Google GIS、Apple JS），只在瀏覽器、只在登入畫面顯示時載入。Google 用 Starry「Starry ID Web」Client；Apple 用 Services ID `phd.starry.id.web`、popup、redirectURI 精確等於 `https://echo-starry.starry-phd.workers.dev/`（其他來源例如本機預覽不顯示 Apple 按鈕）。nonce 每 9 分鐘更新（Starry nonce 10 分鐘到期）。
- `StarryIdProvider.tsx`：掛在根版面；**`EXPO_PUBLIC_STARRY_ID_API_BASE_URL` 不是白名單網址時直接回傳停用狀態**，不建立 Session、不發任何請求。網頁 Refresh Token 存 sessionStorage，原生暫存記憶體（secure-store 隨原生登入加入）；fetch 一律 `credentials:'omit'`。
- `src/ui/echo/StarryMemberPanel.tsx`：會員頁面板 — 登入按鈕、條款／隱私權政策連結（Starry ID 的 /terms、/privacy）、同意流程、會員名稱與頭像（沒有頭像顯示名稱第一個字）、帳號中心連結、登出、登出所有裝置、刪除帳號（兩段確認，說明 7 天撤回期與「不會自動取消商店訂閱」）、刪除倒數與撤回、停權／維護／需更新／無法連線訊息。手機 App 顯示「登入即將推出」。

## 為什麼線上版不變（Dark launch）
- CI、Production（deploy-worker）與 EAS 設定都沒有 `EXPO_PUBLIC_STARRY_ID_API_BASE_URL` → Provider 停用 → 會員頁仍顯示原本的「API 尚未設定」，不載入任何第三方腳本、不連 Starry ID。測試鎖定這一點。
- 新增守門測試：任何建置設定加入 Starry ID 網址時，App 隱私權政策若仍寫「不需要註冊或登入」，CI 就失敗 → 開放前必須先改政策。

## 開放前還需要（業主決定／操作）
1. 業主核准開放會員登入。
2. Google Cloud「Starry ID Web」Client 的 Authorized JavaScript origins 加入 `https://echo-starry.starry-phd.workers.dev`（GIS 要求；CORS 已由 Starry ID 開放）。
3. Apple Services ID `phd.starry.id.web` 的網域與 Return URL 加入 `echo-starry.starry-phd.workers.dev` 與 `https://echo-starry.starry-phd.workers.dev/`。
4. 更新 App 隱私權政策（會員資料由 Starry ID 處理、連到 Starry ID 隱私權政策）。
5. 建議同時為網站加上 CSP（Starry ID 建議），只允許 Google／Apple 登入腳本。
6. 先以 staging 網址做內部測試，再切 production。

## 測試
`tests/starry-id-web-sign-in.test.mjs`（11 項）：Client／Services ID／redirect 固定值、腳本白名單、請求內容、App 設定與 nonce、開面板只查一次設定、回訪換發、同意／刪除倒數／停權／nonce 失敗、各帳號操作端點、刪帳清除 Token、Dark launch 與隱私權政策守門。
