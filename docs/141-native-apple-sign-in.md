# 141｜手機 App 原生 Apple 登入與安全儲存（預設關閉）

## 依據
`starry-phd/id` 串接指南 §2（iOS 原生 Apple、Token 存 expo-secure-store）、§11.3（Android Apple 中繼）。

## 內容
- `src/auth/starryId/nativeSignIn.native.tsx`（只在 iOS／Android 打包）：
  - Refresh Token 存 `expo-secure-store`（iOS 鑰匙圈、Android Keystore），`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`，不隨備份轉移到其他裝置。
  - iOS：`expo-apple-authentication` 原生登入，scope email，傳原值 nonce（SDK 自行雜湊）；使用 Apple 官方按鈕（符合 Human Interface Guidelines）。
  - Android：`expo-web-browser` 開 Starry ID 中繼，只送 `SHA-256(nonce)`（`expo-crypto`），24 bytes 隨機 state（`randomState.ts` base64url）並在回程核對，最後以原值 nonce＋中繼 redirect_uri 登入。
- `nativeSignIn.tsx`：網頁版替身，不載入任何原生模組。
- `StarryIdProvider`：原生改用 secure-store；面板在手機顯示 Apple 登入按鈕，Google 手機版顯示「即將推出」。
- `app.json` `ios.usesAppleSignIn: true`（EAS 建置時會同步 Apple App ID 的 Sign in with Apple 能力）；新增 4 個 Expo 58 套件。
- `tests/starry-id-native-sign-in.test.mjs`（4 項）。

## 仍需
- 業主設定 `EXPO_TOKEN` 並核准 EAS 內部測試建置，才能在真機驗證。
- Google 手機版登入：業主建立 iOS／Android OAuth Client（Android 需 EAS 上傳金鑰與 Play 簽署金鑰 SHA-1），再加入 `@react-native-google-signin/google-signin`。
- 與網頁版相同：未設定 Starry ID 網址前完全不啟用。
