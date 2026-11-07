# Echo × Starry ID｜串接指令 2026-11-07.5

更新日期：2026-11-07（台灣）。本次增量更新；不修改 Starry ID，也不自行建會員資料庫。

## 新增範圍

- App 登入頁新增 **使用 Passkey 登入**；與既有 Apple／Google 登入並列，不替換舊流程。
- Web 使用原生 `navigator.credentials.get/create`，只在 WebAuthn 可用時顯示；`id.starry.phd` 為唯一 RP ID。
- iOS、Android 使用 `react-native-passkey@3.6.2`；須重新產生 Expo development build（Expo Go 不支援）。
- 會員頁新增 **新增 Passkey／我的 Passkey／移除 Passkey**。所有註冊、登入與管理 API 都交給正式 Starry ID；不儲存個人的 Passkey 私鑰。
- APP 啟動及每次回到前景時讀取 `/v1/apps/echo/config`；暫停／停用／低版本阻止會員操作。公告 `notices` 當純文字橫幅顯示，尊重毫秒區間及可自行關閉。
- 保留既有單檔 Battery SDK、量子電池、JWKS 快取、立即刪帳、同意條款與 Echo Owner 設定。

## 業主必須執行（尚未設定）

1. **Apple Team ID**：在 Apple Developer 帳號確認團隊 ID（10 位英數）。開啟 `https://id.starry.phd/admin/apps` → `echo` →「編輯登記資料」→ Apple Team ID，貼上該值並儲存。不要在此聊天傳任何私人金鑰。確認 `https://id.starry.phd/.well-known/apple-app-site-association` 有此 App 的 `TeamID.phd.starry.echo`。
2. **Android SHA-256 指紋**：Google Play Console →「測試及發布」→「應用程式完整性」→「應用程式簽署」的 **App signing key certificate** → SHA-256 指紋（介面名稱可能變動）。到同一個 Starry ID Admin Lite `echo`「編輯登記資料」填入並儲存。確認 `https://id.starry.phd/.well-known/assetlinks.json` 有 `phd.starry.echo` 與 SHA-256。Dev build 需要對應測試簽章指紋。
3. iOS 原生 App 的 `ios.associatedDomains` 已加入 `webcredentials:id.starry.phd`，但**需要重新建置原生二進位檔**；不能單靠網頁重新整理或 OTA 更新生效。
4. 正式手機 Passkey 在 Team ID／Android 指紋填入及原生建置完成之前不能完成登入；網頁版可先依瀏覽器支援進行。
5. 這個 PR **沒有**送審 App Store／Google Play、沒啟用新付費服務、沒有改 Cloudflare 302。

## 驗收範圍

- PR CI：TypeScript、lint、OpenAPI codegen、測試、Gitleaks、iOS／Android 靜態 bundle 與 Web bundle。
- Web：實際點選 Passkey 需要已註冊的真實會員、相容的瀏覽器和使用者本人確認；CI 無法代替真實生物辨識。
- 原有正式網域 `echo.starry.phd` 的 **302 轉址維持不變**，獨立測試網址仍為 `https://echo-api-staging.starry-phd.workers.dev`。
- 正式 Echo `main` 的版本沒有在此 PR 自動發布。必須在 CI 通過並經業主批准後合併。
