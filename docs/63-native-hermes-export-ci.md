# 63｜Expo 58 iOS / Android Hermes 無簽章匯出 CI 閘門

## 目的與來源

舊版搬遷的 Native 目標為 Expo SDK 58、RN 0.88.1，iOS / Android 共同功能仍需要逐步驗收。之前 PR #20 有過 iOS/Android Hermes 靜態匯出的成功紀錄，但日常 PR/main CI 僅做 Expo Doctor、TypeScript、Lint、單測與 Web export，可能讓跨平台程式回歸錯誤在合併後才出現。

Expo CLI 官方文件 <https://docs.expo.dev/more/expo-cli/> 明確支援 `npx expo export --platform ios|android --output-dir <dir>`，並說明 Hermes 預設會為原生平台產生 bytecode <https://docs.expo.dev/guides/using-hermes/>。

## 修復

在既有 `.github/workflows/ci.yml` 的所有單元測試後、Web build 前，連續執行 iOS 與 Android **無簽章** Expo Hermes 靜態 bundle export 至 runner 暫存資料夾 `/tmp/echo-native-ios`、`/tmp/echo-native-android`，每個原生步驟都只注入公開環境變數 \`EXPO_PUBLIC_ECHO_API_BASE_URL=https://echo-starry.starry-phd.workers.dev\`，確保原生匯出包實際包含已核准新版 API 入口，且避免使用沒有 API URL 的假通過。Web 建置不注入此值、仍使用自身 origin。若 CLI 失敗或目錄為空，CI 必須拒絕合併。加入 `tests/native-hermes-export-ci.test.mjs` 防止未來刪掉任一端的檢查。

保留 Production `.github/workflows/deploy-worker.yml` **只發布 Web Worker + Assets**；原生 export 不上傳為對外 artifact，不做 EAS Build、簽章、裝置安裝、Google/Apple Sandbox、商店提交。Web 28 核准訪客封面與私人音訊拒絕測試不受影響。

## 待辦界線

本 PR **不能**視為 iOS/Android 真機、原生 EAS signed build、背景播放、離線媒體、商店上架的完成證據。私人音訊和 Starry ID 尚有獨立權利/契約門檻。新 Worker 僅部署 `workers.dev`；舊站 `echo.starry.phd` 保持 `temp-starry-echo-bridge`。Ref #3。
