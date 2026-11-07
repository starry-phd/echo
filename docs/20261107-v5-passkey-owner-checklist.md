# Echo × Starry ID｜串接指令 2026-11-07.9（增量核對）

更新日期：2026-11-07（台灣）。本次增量更新；不修改 Starry ID，也不自行建會員資料庫。

## 新增範圍

- App 登入頁新增 **使用 Passkey 登入**；與既有 Apple／Google 登入並列，不替換舊流程。
- Web 使用原生 `navigator.credentials.get/create`，只在 WebAuthn 可用時顯示；`id.starry.phd` 為唯一 RP ID。
- iOS、Android 使用 `react-native-passkey@3.6.2`；須重新產生 Expo development build（Expo Go 不支援）。
- 會員頁新增 **新增 Passkey／我的 Passkey／移除 Passkey**。所有註冊、登入與管理 API 都交給正式 Starry ID；不儲存個人的 Passkey 私鑰。
- APP 啟動及每次回到前景時讀取 `/v1/apps/echo/config`；暫停／停用／低版本阻止會員操作。公告 `notices` 當純文字橫幅顯示，尊重毫秒區間及可自行關閉。
- 保留既有單檔 Battery SDK、量子電池、JWKS 快取、立即刪帳、同意條款與 Echo Owner 設定。

## 業主必須執行（尚未設定）

1. **Apple Team ID：無需逐 App 設定**。中央 Starry ID 已採 Worker 變數 `STARRY_APPLE_TEAM_ID` 管理全生態系共用 Team ID；Echo 只保留 `webcredentials:id.starry.phd`，不可自行寫入 Team ID、改中央設定或要求業主再填。實機驗收時唯讀核對 `https://id.starry.phd/.well-known/apple-app-site-association` 有 `4W7QRTXN5Y.phd.starry.echo`。
2. **Android SHA-256 指紋：業主尚未登記**。Play 正式版須在 Play Console →「測試及發布」→「應用程式完整性」→「應用程式簽署」取得 **App signing key certificate** 的 SHA-256（不是 Upload key）。EAS preview APK 須用 `eas credentials --platform android` 核對實際簽署該 APK 的 Keystore 憑證 SHA-256；本機 debug APK 須取 debug keystore 的 SHA-256。這些建置若憑證不同就各登記一組；由業主在 `https://id.starry.phd/admin/apps` → `echo` →「編輯登記資料」填寫，可先留空。確認 `https://id.starry.phd/.well-known/assetlinks.json` 的 package 與指紋吻合；未完成前 Android 原生 Passkey 不算驗收通過。
3. iOS 原生 App 的 `ios.associatedDomains` 已加入 `webcredentials:id.starry.phd`，但**需要重新建置原生二進位檔**；不能單靠網頁重新整理或 OTA 更新生效。
4. 正式手機 Passkey 在 Team ID／Android 指紋填入及原生建置完成之前不能完成登入；網頁版可先依瀏覽器支援進行。
5. 這個 PR **沒有**送審 App Store／Google Play、沒啟用新付費服務、沒有改 Cloudflare 302。

## 驗收範圍

- PR CI：TypeScript、lint、OpenAPI codegen、測試、Gitleaks、iOS／Android 靜態 bundle 與 Web bundle。
- Web：實際點選 Passkey 需要已註冊的真實會員、相容的瀏覽器和使用者本人確認；CI 無法代替真實生物辨識。
- 原有正式網域 `echo.starry.phd` 的 **302 轉址維持不變**，獨立測試網址仍為 `https://echo-api-staging.starry-phd.workers.dev`。
- 正式 Echo `main` 的版本沒有在此 PR 自動發布。必須在 CI 通過並經業主批准後合併。

## 2026-11-07.9 補充核對

- 原有 `echo-starry`（正式）及 `echo-api-staging`（隔離測試）沿用，不為名稱新建 `echo-api` Worker；既有 `echo.starry.phd` 302 指向舊站不得變動。
- 後端 `worker/vendor/starry-sdk.ts` 已與 Starry ID `sdk/starry-sdk.ts` 來源 blob SHA 一致；預留的 409/503 拒絕、JWKS `kid` 輪替、免費月額度與量子電池、Gitleaks 已在既有程式，請勿重做。
- **前端 SDK 改用中，待 CI／原生驗收**：Echo 已加入官方 `sdk/starry-client.ts`（來源 SHA 3aa9659c）作為 Token 旋轉、Passkey、會員操作的唯一執行者；原本 Apple／Google 中繼入口繼續沿用已驗收且可測的 UI/回傳邏輯，之後再將整個中繼導向步驟改由 SDK 接管。舊 Refresh Token 安全遷移到 SDK key；未完成真實登入與實機驗收前不得宣稱可用。
- 已補公開的「聯絡客服」入口（只帶 app_id、版本、裝置型號）、公告時窗前景內到期／生效更新；不開啟私人音訊。
- PR #171 未經業主核准不可合併、正式發布或送審；Passkey 真實 WebAuthn/原生驗收仍需本人操作與真正的簽章設定。
