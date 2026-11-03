# 135｜Starry ID 連線核心（登入畫面尚未開放）

## 來源
`starry-phd/id` main `c62bef3`（#32）：`docs/integration-guide.md` 第 1～4、8、11 節、`docs/fixtures/`、`docs/api-changelog.md`。對接單與回覆紀錄見 Issue #3。

## 內容（`src/auth/starryId/`，全部為純模組，可離線測試）
| 檔案 | 作用 |
|---|---|
| `env.ts` | 只接受 `https://id.starry.phd`（iss `starry-id:production`）與 staging `https://starry-id-staging.starry-phd.workers.dev`；其他網址一律視為未設定。Token 只送往相對 `/v1/` 路徑。 |
| `errors.ts` | 錯誤格式 `{"error":{code,message,request_id}}` → 依對方錯誤碼表決定動作（refresh、回登入、停權、刪除倒數、維護中…）；無法解析一律 fail closed。 |
| `member.ts` | `GET /v1/me` 寬鬆解析（容忍新增欄位）；只保留畫面要用的 user_id、狀態、顯示名稱（null → 「繁星會員」）、頭像相對路徑、profile.version、同意狀態；**不複製 Email、電話、生日、地點等個資**。 |
| `appConfig.ts` | `GET /v1/apps/echo/config`：active／paused／killed／需更新；Starry ID 連不上時公開畫面照常、會員功能關閉。 |
| `tokens.ts` | 登入與換發回應解析（Bearer、Token 不含空白）。 |
| `session.ts` | Access Token 只在記憶體；401 → **單一飛行鎖**只換發一次，新 refresh_token 先覆蓋舊的再重送；`REFRESH_REUSED`／`INVALID_REFRESH`／停權 → 清除並登出；網路或 5xx → 保留 Token、fail closed；不帶 Cookie。 |
| `storage.ts` | Refresh Token 存放：記憶體、網頁 sessionStorage（依 Starry ID 建議，不用 localStorage）；原生 `expo-secure-store` 於登入畫面那批加入。 |
| `appleRelay.ts` | Android 的 Apple 登入中繼：只把 nonce 的 SHA-256 送給 Apple、驗證 state、回傳網址只接受 `echostarry://auth/apple`、以原值 nonce 與中繼 redirect_uri 呼叫 `POST /v1/auth/apple`。不用 RN 不完整的 URL polyfill。 |

## 取代舊契約
`src/auth/centralMemberContract.ts`（v1.0 嚴格五欄位 DTO）依對方指南第 8 節已被取代，刪除；`src/auth/centralMember.ts` 改為 Starry ID 轉接層，`EXPO_PUBLIC_STARRY_ID_API_BASE_URL` 只有白名單網址才算「已設定」。

## 不變的事
- **沒有任何畫面使用這些模組**（測試確認 `app/`、`src/ui/` 不建立會員 Session），CI 與 Production 沒有設定 Starry ID 網址 → 線上版行為完全不變；隱私權政策不需改版。
- 未新增相依套件；`starry.app.json` 的 `identity.apiContract` 仍為 pending，等登入畫面上線那批再改。

## 測試
`tests/starry-id-client-core.test.mjs`（12 項）使用 `tests/fixtures/starry-id/`（複製自對方 c62bef3，假資料）：白名單、錯誤動作、/v1/me 個資最小化、App 狀態、Token 解析、並發 401 只換發一次與輪替、重用撤銷登出、網路失敗保留 Token、sessionStorage 降級、Apple 中繼 state／nonce 雜湊。

## 下一批（登入畫面）需要
`expo-secure-store`、`expo-apple-authentication`、Google Sign-In、`expo-web-browser`、`expo-crypto`；網頁版 GIS／Apple JS 與 CSP；App 隱私權政策改版並連到 Starry ID 條款；刪帳入口。原生部分需 EAS 建置（待業主設定 `EXPO_TOKEN` 並核准 Android 簽章）。
