# 81｜分類選單只呈現可安全、精確套用的已核准類別

## 真實問題
首頁搜尋建議已在 PR #92 使用 `categoryFromRoute` 拒絕不合法標籤，但目前 `app/index.tsx` 的 `LegacyFilterToolbar` 分類下拉選單仍直接合併 `getCategories`（public+verified 公開類別）與經裝置偏好過濾的 28 張 guest metadata 類別，沒有對每個值套用同一個驗證。若 API 提供前後換行、控制字元、超長或 NFKC 後變成 `<` 的字串，使用者可能看見不可用的分類選項；若來源分類有額外前後空白，直接 trim 選取後又可能無法精確匹配原始公開資料。

## 修正
- 新增 `src/ui/echo/safeApprovedCategoryOptions.ts`：對目前核准來源做 `categoryFromRoute(raw)`（PR #94 已改為在 trim 前拒絕 raw 控制字元），再做 NFKC 路由驗證；只有合法且**不用修改原文字才可用於精確篩選**的類別顯示。
- 依來源順序去重，保留「ＡＩ」等全形字及中間合理空格，不把 NFKC 搜尋用的字形變成正式類別；無效與不能精確對應來源的選項直接略過而非產生錯誤連結。
- `app/index.tsx` 的分類選單和 `publicCategorySuggestions` 共用同一批安全選項，仍只包含已核准的 `getCategories()` 和本機未隱藏的 curated guest 類別。偏好 hydration 前不顯示任何類別。
- 新增 `tests/safe-approved-category-menu.test.mjs` 以合成資料驗證 exact match、重複、長字、空格、前後控制字元、全形危險符號、首頁來源限制。不變更既有播放或私人資料 gate。

## 發布與安全
只改 Expo UI/helper 與合成測試，不改 Worker/API/資料庫/R2、28 張訪客不可播放、Starry ID、Ads/Billing/原生有簽章上架或舊 `echo.starry.phd`。此文件不是部署證據；發布仍需 latest exact PR CI、protected merge、main exact CI、唯一既有 auto workers.dev、安全 HTTP smoke（私人媒體拒絕/28封面/28HEAD）和 Cloudflare 官方100%＋舊網域不變。
