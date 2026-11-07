# Echo × Starry ID｜串接指令 2026-11-07.9（增量核對）

更新日期：2026-11-07（台灣）。本次增量更新；不修改 Starry ID，也不自行建會員資料庫。

## 新增範圍

- App 登入頁新增 **使用 Passkey 登入**；與既有 Apple／Google 登入並列，不替換舊流程。
- Web 使用原生 `navigator.credentials.get/create`，僅在 WebAuthn 可用且網域已登記於 Echo 白名單時顯示；`id.starry.phd` 為唯一 RP ID。
- iOS、Android 使用 `react-native-passkey@3.6.2`；須重新產生 Expo development build（Expo Go 不支援）。
- 會員頁新增 **新增 Passkey／我的 Passkey／移除 Passkey**。所有註冊、登入與管理 API 都交給正式 Starry ID；不儲存個人的 Passkey 私鑰。
- APP 啟動及每次回到前景時讀取 `/v1/apps/echo/config`；暫停／停用／低版本阻止會員操作。公告 `notices` 當純文字橫幅顯示，尊重毫秒區間及可自行關閉。
- 保留既有單檔 Battery SDK、量子電池、JWKS 快取、立即刪帳、同意條款與 Echo Owner 設定。

## 目前設定與待辦事項（Android SHA-256 已完成）

1. **Apple Team ID：無需逐 App 設定**。中央 Starry ID 已採 Worker 變數 `STARRY_APPLE_TEAM_ID` 管理全生態系共用 Team ID；Echo 只保留 `webcredentials:id.starry.phd`，不可自行寫入 Team ID、改中央設定或要求業主再填。實機驗收時唯讀核對 `https://id.starry.phd/.well-known/apple-app-site-association` 有 `4W7QRTXN5Y.phd.starry.echo`。
2. **Android SHA-256 指紋：已由業主登記並唯讀查證成功（2026-11-07）**。已獨立解析業主上傳的 EAS 內部測試 APK `application-80334ed0-90ac-48d8-bd2d-aa46b75d1701.apk` 的 Android v2 簽章憑證，SHA-256 為 `04:10:CC:35:A5:79:A9:CF:EF:4E:33:1C:F1:06:AE:70:64:00:6B:11:01:4A:FA:FB:B4:FB:51:36:A6:AD:AC:6C`，且 Cloudflare D1 `starry-identity` 的 `registered_apps` 中 `echo` 登記值完全一致，套件名稱 `phd.starry.echo`、登入回傳 `echostarry://auth/apple`、狀態 `active` 均一致；**僅唯讀查核，未修改 Starry ID**。PR staging workflow 現已新增唯讀 GET 驗證 `/.well-known/assetlinks.json` 是否已公開同一指紋，以及 iOS AASA 和 WebAuthn 網域。**注意：該 APK 建立於 2026-11-03，比 PR #171 Passkey 原生程式碼更早，因此不能用這個舊 APK 驗收 Passkey；需要以相同 EAS 簽章金鑰從此 PR 之後的版本重新建置。**未來 Google Play 正式版仍須另外核對 Play Console → 應用程式簽署的 **App signing key certificate** SHA-256（不是 Upload key）；如果其他 APK 使用不同憑證，則另加一行登記。
3. iOS 原生 App 的 `ios.associatedDomains` 已加入 `webcredentials:id.starry.phd`，但**需要重新建置原生二進位檔**；不能單靠網頁重新整理或 OTA 更新生效。
4. Android 指紋已完成；但 **iOS／Android 使用者仍需重新安裝包含 Passkey 模組的已簽署新版測試 App 並由本人實際操作**，才能宣稱 Passkey、Apple／Google 登入及回登驗收成功。現有 2026-11-03 內測 APK 不含本 PR 新功能；網頁版可先用相容瀏覽器由本人測試。
5. 這個 PR **沒有**送審 App Store／Google Play、沒啟用新付費服務、沒有改 Cloudflare 302。

## 驗收範圍

- PR CI：TypeScript、lint、OpenAPI codegen、測試、Gitleaks、iOS／Android 靜態 bundle 與 Web bundle。
- Web：實際點選 Passkey 需要已註冊的真實會員、相容的瀏覽器和使用者本人確認；CI 無法代替真實生物辨識。
- 原有正式網域 `echo.starry.phd` 的 **302 轉址維持不變**，獨立測試網址仍為 `https://echo-api-staging.starry-phd.workers.dev`。
- 正式 Echo `main` 的版本沒有在此 PR 自動發布。必須在 CI 通過並經業主批准後合併。

## 2026-11-07.9 補充核對

- 原有 `echo-starry`（正式）及 `echo-api-staging`（隔離測試）沿用，不為名稱新建 `echo-api` Worker；既有 `echo.starry.phd` 302 指向舊站不得變動。
- 後端 `worker/vendor/starry-sdk.ts` 已與 Starry ID `sdk/starry-sdk.ts` 來源 blob SHA 一致；預留的 409/503 拒絕、JWKS `kid` 輪替、免費月額度與量子電池、Gitleaks 已在既有程式，請勿重做。
- **官方前端 SDK 已接管程式流程，且 exact HEAD CI 550/550 全綠；仍待原生實機驗收**：Echo 已加入官方 `sdk/starry-client.ts`（來源 SHA 3aa9659c）作為 Token 旋轉、Passkey、會員操作的唯一執行者；Web 及 iOS／Android Apple／Google 中繼亦改由 SDK 接管，保留原本 Callback 白名單及 Passkey RP 防護。舊 Refresh Token 安全遷移到 SDK key；**CI 不代表真實登入或生物辨識成功**。
- 已補公開的「聯絡客服」入口（只帶 app_id、版本、裝置型號）、公告時窗前景內到期／生效更新；不開啟私人音訊。
- PR #171 未經業主核准不可合併、正式發布或送審；Passkey 真實 WebAuthn/原生驗收仍需本人操作與真正的簽章設定。

## 取得新內測 APK 的安全門檻

- 原來的 GitHub Actions `eas-android-preview.yml` **只允許 `main` 手動觸發**；目前 PR #171 尚未獲業主批准合併，因此不得誤以為從 `main` 建出的 APK 包含這次 Passkey 開發。
- **本次沒有觸發任何 EAS 付費／簽章建置**，也沒有變更既有工作流程的「main-only、手動確認」安全限制。
- 業主核准後，應選擇含本 PR 程式碼、使用既有 EAS Keystore 的新版內測 APK，安裝於 Android 手機再測；不可更換套件名稱，也不要將 Keystore、EXPO_TOKEN 或 Refresh Token 傳入聊天。
- iOS 開發版亦需以現有 Team ID 簽署並在真機驗證 Associated Domains／AASA。完成真機驗收前，Passkey 尚屬 **BLOCKED — device E2E not verified**。
