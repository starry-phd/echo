# 繁星回聲｜第三階段：真實媒體搬遷狀態與手機 UI 發布
正式授權範圍：已核准 Web Worker / v1.3 D-08 行動裝置 UI；音檔私有權限不得放寬。

## 已驗證
- PR #10 https://github.com/starry-phd/echo/pull/10 已合併 main。
- main CI https://github.com/starry-phd/echo/actions/runs/40749742413 成功：Expo 58、Native StyleSheet/Design Tokens、TypeScript、Lint、OpenAPI、Ads OFF、單元測試、Web Build、Wrangler dry-run。
- 私有 R2 音訊解碼 https://github.com/starry-phd/echo/actions/runs/40749742453 成功：M4A(AAC)、MP3(MP3)、舊 .aac(MP4/AAC) 皆從新 R2 私下取樣、ffprobe 音軌檢測、ffmpeg 解碼前 8 秒。
- 首頁顯示 API 真正 legacyMediaMigration=copied 進度，與沒有公開音檔的事實；未開放會員功能時不再使用「註冊會員解鎖」誤導性 CTA。
- 公開分類 API 僅列出 public + verified 音檔使用的分類，不洩漏私人分類標籤。

## 無權限放寬
- Echo D1 112 筆 copied，全部 private，0 verified、0 public。
- R2 的 managed public access 停用，來源不刪除。只有核准公開且驗證的音檔才可能進入目錄及播放。
- 廣告 OFF，Billing / Starry ID / Battery SDK 未啟用； iOS/Android 原生上架未完成。
- 三筆檔案解碼抽樣不等於所有 112 筆都能在 iOS/Android 播放，也不是內容權利核准。
