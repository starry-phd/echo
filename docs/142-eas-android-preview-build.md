# 142｜Android 內部測試版建置（業主手動觸發）

## 做什麼
`.github/workflows/eas-android-preview.yml`：業主在 GitHub 手動執行、輸入確認字串後，以 EAS `preview` profile 建置**內部測試用 APK**（`eas.json` preview `android.buildType: apk`、`distribution: internal`、公開 API 網址）。不送 Google Play、不發 OTA、不建 iOS、不用 production profile；只能從 main 執行；workflow 只有 `contents: read`；唯一使用的 Secret 是業主自己放的 `EXPO_TOKEN`（Claude 不經手）。

第一次執行時，EAS 會為 `phd.starry.echo` 產生並託管 **Android 上傳金鑰**；之後在 expo.dev 可看到它的 SHA-1，交給 Google Cloud 建立 Android OAuth Client（Starry ID 需要）。

## 業主手機操作步驟
1. expo.dev → 右上頭像 → Account settings → Access tokens → Create token（名稱例如 `github-echo`），複製。
2. GitHub App 或網頁 → `starry-phd/echo` → Settings → Secrets and variables → Actions → New repository secret → Name `EXPO_TOKEN`、Value 貼上 → Add secret。
3. GitHub → Actions → 「EAS Android internal preview build (manual)」→ Run workflow → 分支 `main` → confirmation 輸入 `BUILD-ANDROID-INTERNAL-PREVIEW` → Run。
4. 約 10–20 分鐘後到 expo.dev → starryphd / echo-starry → Builds，用 Android 手機開啟連結安裝 APK（需允許安裝未知來源 App）。
5. SHA-1：expo.dev → 專案 → Credentials → Android → `phd.starry.echo` → Keystore 的 SHA-1 fingerprint。

## 注意
- EAS CLI 使用 `eas-cli@latest`（Expo 官方建議隨 SDK 更新）；若未來 CLI 改版導致失敗，Log 會顯示原因。
- 每次執行會用掉 Expo 方案的建置額度。
- iOS 內部測試需 Apple Developer 憑證與裝置註冊，另行處理。
