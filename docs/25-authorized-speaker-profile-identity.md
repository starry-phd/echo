# 2026-10-30｜講師詳細頁的顯示身分必須來自當前核准作品

## 原因
`/speaker/[name]` 先前直接以網址參數顯示講師姓名及第一個字的頭像，即使 API 沒有任何獲核准作品、資料尚在載入、請求失敗、單張卡片全部被本機「不喜歡」隱藏，或整位講師已在本機隱藏。這會使任意輸入的 URL 看起來像有真實核准講師資料，也與 PR #34/#36 的本機顯示偏好不一致。

## 本輪範圍
- `src/ui/echo/authorizedSpeakerProfile.ts` 提供 `publicSpeakerRouteName`：限制單一講師路由、80字內、拒絕控制字元，正規化人名，不把共同講師的 URL 字串誤認為個人。
- `authorizedSpeakerProfileTracks`：**僅從目前真正由 verified public API 或核准 guest preview API 回傳的卡片**，以拆分後**精確講師人名**確認作品屬於該講師，再扣除本機單張 `dislikedIds` 與講師級 `hiddenSpeakers`。絕不用網址參數或舊的本機 ID 直接開放資料。
- `app/speaker/[name].tsx` 頁首姓名、頭像、照片和其說明現在只有在 `ready=true`、API 已完成、`display==='ready'`、有可顯示的核准作品、講師未被本機隱藏時才顯示。封面從**這些可顯示卡片**對應的已核准預覽卡取用。其他情況只顯示不洩露姓名的載入、錯誤/重試、隱藏管理連結或空結果；不把「沒有權利」誤報成「資料存在」。
- 保留先前「單一 API 失敗時另一 API 成功仍可顯示核准作品」與「兩邊均無資料、單邊失敗應顯示重試」邏輯；**本機隱藏是顯示偏好，不是授權**。
- 新增 `tests/authorized-speaker-profile.test.mjs` 對路由、權限來源、共同姓名、相似姓名、單張隱藏、講師隱藏、渲染閘門做回歸，並更新前輪的 static test。

## 風險與發版
本次只更改 Expo UI 與純函式；未查/改 D1/R2/112私有音訊、28封面白名單、Workers API、Starry ID、Ads/RevenueCat。CI/PR 合併≠已上線。正式發版仍需核對主線 CI、依 `.github/workflows/deploy-worker.yml` 精確 SHA 手動觸發與 `production` 人工核准，再做前後台安全與手機/桌面回歸。Issue #3 為權威進度紀錄。
