# 2026-10-30｜已核准公開音檔詳情：共同講師的個別連結

## 遺漏
`app/track/[id].tsx` 原本將整個 `track.speaker`（例如「王小明 & 林美麗」）送至 `/speaker/[name]`，但 PR #37 的 `publicSpeakerRouteName` **正確拒絕多個講師的合併網址**，結果是點擊共同講師後出現「講師連結不正確」，使用者無法查看這兩人的作品；單一講師不受影響。

`app/preview/[id].tsx` 與作品卡片此前已採 `splitSpeakerNames` 拆分合法來源中的共同講師，本輪讓真正的 verified-public `track/[id]` 詳情使用同一做法。

## 修復
- 只對目前由 `getPublicTrack` 經 Worker verified-public 詳情 API 取得、已通過原本裝置隱藏檢查的 `track`，顯示 `splitSpeakerNames(track.speaker)` 個別講師連結。每個 `Pressable` 都指向同一合法姓名 `params:{name}`，不再直接送合併字串。
- 以既有講師姓名顯示順序排列、對每一個連結提供獨立可存取標籤與44px最小點擊高度；共同講師兩名均可從音檔頁開啟個人作品頁。若回傳空講者欄，顯示「講師資料待補」，不建立無效路由。
- **不**改公開音訊 detail fetch、`AudioPlayback`/server streaming、裝置藏卡及欲用舊 R2 的任何條件，絕不以網址或舊資料推論播放授權。
- 新增 `tests/public-track-individual-speaker-links.test.mjs`：核對合併名字不可作路由、全形/半形＆分隔及同名去重、畫面個別連結、播放控制 Gate 不變。

## 發版與安全
純 Expo 前端 UX 修改，沒有新公開私人錄音、沒有讀取/下載/解碼112筆 private/copied、沒有修改28 approved preview allowlist、Workers/D1/R2/Starry ID、Ads OFF或付費。GitHub PR CI + 合併 ≠ Production；正式發版仍需確認當下 main push CI、無同時進行 Production、使用 `.github/workflows/deploy-worker.yml` 精確 SHA workflow_dispatch 與 Environment 人工審批，驗收28封面/no-store、private stream 404、手機/桌面連結與公開播放 Gate。GitHub Issue #3 保留最新交接。
