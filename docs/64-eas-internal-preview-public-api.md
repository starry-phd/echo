# 64｜EAS 原生內部測試版公開 API 入口

## 發現缺口

`src/api/client.ts` 在 iOS/Android 依賴 `process.env.EXPO_PUBLIC_ECHO_API_BASE_URL`。Web 可自動退回頁面的來源網址，但原生無瀏覽器 origin。原本的 `eas.json` development/preview 只有 internal distribution 與 channel，沒有公開 API 位址；即使 Expo native Hermes JavaScript 編譯成功，未來建立內部預覽包也可能顯示「API 尚未設定」，無法取得 28 張核准訪客資訊卡。

官方 EAS 文件 <https://docs.expo.dev/build/eas-json/> 與 Expo Environment Variables <https://docs.expo.dev/guides/environment-variables/> 支援在 profile 的 `env` 內加入**非秘密** `EXPO_PUBLIC_*` 值，打包期間會編入 JavaScript。

## 本批

只在 EAS `development`、`preview` 兩個**內部發行** profile 設定 `EXPO_PUBLIC_ECHO_API_BASE_URL=https://echo-starry.starry-phd.workers.dev`；保留 `production` 原樣，絕不可提前假設舊版正式網域已切換，亦不啟動 EAS signed builds、iOS TestFlight、Google Play 或商店審核。

`tests/internal-eas-public-api-profile.test.mjs` 確認內部 profile API URL、正式 profile 不額外注入候選 API、所有商店／廣告／付費禁用狀態與 native client 安全行為。

## 實際完成與阻塞

只有 EAS 設定與單元測試已準備，**未產生任何簽章 iOS/Android 包、未真機安裝、未做播放/離線/商店測試**。保護現役舊站 `echo.starry.phd`、私人 112 錄音及中央 ID 邊界；任何正式上架須獨立核准。Ref #3。
