# 77｜搜尋分類建議保留原始核准標籤

## 發現的實際缺漏
首頁使用已核准 public+verified 分類 API 及核准 guest 28 張的分類作搜尋建議；但 `publicCategorySuggestions` 將**顯示及選取**的分類文字直接做 `NFKC` 正規化。原始公開標籤如「ＡＩ」會變成「AI」；按下建議後首頁的 `matchesCardFilters` 使用**原分類精確相等**，導致剛點的建議沒有對應結果。這是具體的跨語系 Unicode 選取錯誤，不是音訊權限問題。

## 修正及回歸
- 搜尋與去重仍用 NFKC（輸入「AI」可搜尋「ＡＩ」），但**列表顯示及選取保留原本已核准分類名稱**，因此和首頁 filter、公開詳情 category 連結一致；第一個已核准來源的標籤獲得代表性。
- 透過現有 `categoryFromRoute` 同時拒絕不可導航的控制字元、過長字串、角括號等無效分類建議，避免顯示按下無法使用的項目。
- `tests/category-suggestions.test.mjs` 新增 Unicode 全形字/原始精確比對、合法分類 route、無效建議安全回歸；原本限制筆數與來源只限核准分類維持。

## 權限及發布界線
純 client public metadata UI，不新增 API、查詢來源或音訊權限；不讀任何私有音檔/會員資料、不啟用金流或廣告、不變更正式舊站 `echo.starry.phd`。仍須通過 protected branch PR exact CI、main exact CI、唯一既有 auto workers.dev deploy、28 guest nonplayable/HEAD 安全 smoke、Cloudflare 100%、舊網域不變後才算真正完成。
