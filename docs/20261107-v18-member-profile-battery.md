# Echo × Starry ID｜串接增量 2026-11-07.18

- 沿用已合併 PR #172 的登入、SSO、Passkey、後端 Battery 與安全規則；只補新版頭像、會員編號、邀請網址、電池圖示及 OpenAPI 型別。
- `GET /v1/me`：只使用中央的 `profile.avatar_url` 一小時有效簽章網址與 `profile.initials`（不依姓名自己計算），會員頁進入及回前景重新讀取；沒有自行上傳／複製圖片。
- `member_no` 為可變更的公開號碼（國家兩位大寫字母＋7～10 位數字），公開頁 `https://id.starry.phd/{member_no}`，邀請頁 `https://id.starry.phd/Invite/{member_no}`。不當資料主鍵或檔名，分享前重新呼叫 GET /v1/me。
- 普通電池固定 🔋，量子電池固定 ⚛️，畫面／Owner 任務文字一併修正。未啟用任何商品／付款。
- **文件差異**：目前 Starry ID 的 `integration-guide.md` §9.5 舊敘述仍寫會員編號永久不變；本次依業主提供的新版 2026-11-07.18（可修改）與中央最新 OpenAPI 實作，沒有更動 Starry ID。
- 保留正式 `echo-starry` 與獨立 `echo-api-staging`，不改 `echo.starry.phd` 既有 302、不讀取私人音訊、不建立 APK、不改中央資料／機密；PR 合併需另外明確核准。
