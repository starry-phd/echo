# 134｜連接業主 Expo 專案與遠端更新（健檢 A5）

## 背景
2026-11-02 業主已用 starry.phd@gmail.com 註冊 Expo、Apple Developer、Google Play Console；Expo 帳號 `starryphd`，於 expo.dev 建立專案 `echo-starry`，Project ID `e124ab5b-1a32-4a5b-8553-327f11946909`（非機密）。Expo 頁面建議的 `npx create-expo-app … && eas init --id …` 指令**不執行**（會另建空白 App）；改以設定檔連接，結果等同 `eas init --id`。

## 實作
- `app.json`：`owner=starryphd`、`extra.eas.projectId`、`updates.url=https://u.expo.dev/<projectId>`、`runtimeVersion={policy:appVersion}`（只把 OTA 更新推給同一 App 版本，原生程式變更必須重新建置）。
- `package.json`：`expo-updates ~58.0.0`（eas.json 既有的 development／preview／production channel 才有作用）。
- `eas.json`：`cli.appVersionSource=remote`（build number 由 EAS 伺服器管理，搭配 production `autoIncrement`）。
- 測試 `tests/eas-project-and-updates.test.mjs`（3 項）：帳號／專案連結、OTA 設定、且**不**代表授權上架／廣告／付費，CI 與 Production workflow 不含 `eas build|submit|update` 或 `EXPO_TOKEN`。

## 界線
- 本批只連結，不建置、不發 OTA、不送審。`storeSubmissionAuthorized=false` 不變。
- 之後 EAS 建置需 `EXPO_TOKEN`：由業主本人建立並放入 GitHub Secret（或本機），Claude 不經手 Token；每次建置／OTA／送審需業主個別核准。
- Web 不受影響（expo-updates 在 Web 無作用）。
