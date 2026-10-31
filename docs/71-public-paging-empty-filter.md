# 71｜第一頁全被裝置篩選/隱藏時，安全載入更多公開作品

## 真正的程式缺漏

PR #82／#83／#85 為講者頁、首頁與熱門公開排行加入 public+verified 分頁，但新 UI 的「載入更多」控制僅在 `display==='ready'` 時顯示。當前 100 筆符合 **API 公開權限** 的候選作品都被本裝置「不喜歡」／隱藏講者／獎銜篩選排除，`getCatalogDisplayState` 正確回報 `empty`，而 `hasNextPage=true` 仍說明還有後續公開頁。畫面卻不給載入更多機會，並以「沒有符合條件」誤導使用者。

## 修正與保護

新增純函式 `canLoadMoreAuthorizedPublic(display,hasNextPage,deviceReady)`：只在 `deviceReady=true`、`hasNextPage=true`、`display` 為 `ready` **或 `empty` 時允許載入；API `failed`／`loading` 以及未完成本機偏好 hydration 均拒絕。這個 helper **不簽發任何作品權利**，只決定能否再從原本 verified-public API 取得下一頁。

- `app/index.tsx`：即便當頁沒有符合本機條件的作品，也保留「載入更多公開音檔」；文案改為「目前已載入的作品沒有符合條件，仍可繼續載入」。
- `app/stats.tsx`：同樣可讓所有當頁卡被隱藏的排行榜取得下一頁；其他四個會員榜單仍維持未授權。
- `app/speaker/[name].tsx`：原先 `showBio` 綁定可見錄音數，現在載入更多按鈕獨立以 `!speakerHidden`、`ready`、`hasNextPage`、目前資料狀態做保護，因此第一頁全部因本機 hidden-ID 變空時仍可請求後續 **已驗證公開** 作品；若講者本身被本機隱藏，仍不提供按鈕。
- 更新原 UI 回歸與新增 `tests/public-paging-empty-first-page.test.mjs` 覆蓋 `empty/ready/failed/loading`、hydation 與前端權限來源。

仍舊只讀取 `GET /api/v1/catalog` 目前已 verified public 的 metadata；不讀私人音訊、不推斷會員／付費權益、不改 `/api/v1/previews` 核准訪客資訊卡、不動 `echo.starry.phd` 舊正式站。必須通過 exact PR HEAD CI→正常合併→main CI→唯一 Worker auto deployment→private 404 / 28 nonplayable smoke→Cloudflare 100%。Ref #3。
