# 99｜原版 Logo／回首頁必須重設目前公開清單

## 原版程式證據及缺口
原版 `yukidu/Echo-Starry/src/App.tsx` 約1004行明定：「任何情況下，只要按主選單的logo或網站名稱，就會返回到首頁播放清單的『全部分類』，清空搜尋條件」。`handleReturnToHomePlaylist` 清除分類、講師獎銜、搜尋、抽選及排序狀態。
新版本批之前 `LegacyHeader.go('/')` 只有 `router.push('/')`。若已在首頁，導航同一條路徑不保證 React 元件重新掛載，不能保證清空本機已選的分類、獎銜和搜尋；若網址仍有 `?category=...` 或 `?rank=...`，重整後會重新套用舊篩選。

## 最小跨平台修正
- `HomeResetProvider` 提供單調遞增的 revision，讓 Root Header 與 Expo Router 內已掛載的首頁共享明確的「回首頁重設」動作；不儲存資料或監聽 DOM。
- `LegacyHeader.go('/')` 每次都 `requestReset()` 並 `router.replace('/')`，移除舊分類／獎銜查詢參數，不累積歷史的舊篩選連結；Logo、主選單「首頁／回首頁」、釘選快捷首頁都走同一路徑。非首頁的導航依原流程不變。
- `CatalogScreen` 忽略 Provider 首次掛載 revision，僅在明確重設動作時清除搜尋、延遲搜尋值、分類、講師獎銜、進階篩選、排序與抽選計時器，並捲回首頁上方。排序重置為新版目前可驗證的 `newest`，不假裝已接入原版受會員權限影響的預設排序。
- 裝置收藏、不喜歡的音檔與講師偏好、所有已核准 public/guest API、播放與分享的權限 Gate 均不變。

## 驗證與安全
`tests/legacy-home-logo-reset.test.mjs` 覆蓋三種入口、同頁 reset token、全部安全本機篩選與抽選還原、沒有私人資源副作用；同步更新 `tests/legacy-pinned-quick-actions.test.mjs` 中必要的 Provider 結構斷言。
此測試與 CI 編譯不等於已完成真人 iOS/Android/Expo Web 導覽及捲動手勢驗收。
發布順序必須維持 exact feature PR CI→Ready→protected merge→exact main CI→唯一既有 workflow_run workers.dev→homepage/API/private refusal＋28 covers／28 stream HEAD404-no-store→Cloudflare官方100%及正式舊網域未動。
