# 93｜核准分類更新或隱藏後，安全清除已失效的分類條件

## 原版依據／目前可重現缺口
原版 `yukidu/Echo-Starry/src/App.tsx` 的 `fetchCategories` 讀取成功後執行 `setSelectedCategory(prev => (list.includes(prev) ? prev : '全部'))`。因此後台分類被刪除/更名，原選取值會回到「全部」，避免持續套用已不存在的精確分類。

新版 `app/index.tsx` 目前持有 `category`，但 `categories` 在 API 更新、訪客核准來源改變，或本機隱藏唯一擁有該分類的資訊卡後，**沒有**檢查該精確分類是否還在目前已核准的可見選單。畫面會保留失效篩選，使使用者看到空列表與已消失的分類。

## 修復
- `shouldResetUnavailableCategory(selected,available,sourcesReady)` 只做**精確原標籤** membership 檢查（`ＡＩ` 與 `AI` 仍是不同核准分類）。
- 只有裝置偏好已 hydrate、`getCategories` verified-public 類別 API 及 28 curated guest metadata-only `getGuestPreviewTracks` **都已成功且不在 refetch** 時才允許自動重設。任何 API loading/error 不可推論分類遭刪除，避免 API 故障時破壞使用者選擇。
- 若確定目前已核准可見類別沒有原選取值，使用 `setCategory(null)` 恢復全部分類，顯示清楚通知。該選單的完整候選仍由既有 API + 本機可見 guest previews 產生，不讀 private/saved ID。
- regression tests 驗證未知類別、真存在類別、NFKC 異字形、pending/failed source、清空後選單、首頁實際接線與權限隔離。

## 安全
沒有新增公開 API、私人 D1/R2 音訊、Starry ID 私人會員或播放權限，也不變動金流／廣告、簽章上架與現役舊 `echo.starry.phd`。仍依 existing protected PR→exact CI→唯一 auto workers.dev 發布、安全 smoke、Cloudflare 官方100%、Issue #3交接。
