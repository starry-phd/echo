# 94｜熱門榜無合法統計時，只在確有後續公開頁時建議載入更多

## 問題
`app/stats.tsx` 的「熱門音檔排行榜」只列入目前合法核准來源中有**明確公開歷史指標**的資料（這個權限與未知≠0的行為保持不變）。當部分核准卡存在、但該指標完全缺漏時，`ranked.length===0` 的原文固定為「可嘗試其他指標或繼續載入公開作品」。若 `catalog.hasNextPage=false`，畫面根本不會呈現「載入更多公開作品」按鈕，文案卻要求使用者去按不存在的功能。

## 修正
新增純函式 `missingHistoricalMetricCopy(hasNextPage)`：
- 目前公開 catalog 還有下一頁 → 可以嘗試其他指標，**也可以**繼續載入更多核准公開作品找歷史指標。
- 目前沒有後續公開頁（包含 API 可用性不完整的情況）→ 只建議改試其他指標，**不臆測**全站作品或歷史指標的真實狀態，也不指向不存在的按鈕。

頁面接線使用 `catalog.hasNextPage` 布林，保留僅由 verified-public + 28 curated guest metadata-only 資料算出歷史名次、未知值不能當0、缺漏不顯示假排名、舊版5 tabs與所有 API/private refusal Gate 不變。

## 測試
既有 `tests/public-hot-rankings-known-metrics.test.mjs` 新增 true/false 合成文案和介面接線斷言。這是合法公開 UI 文案修正，不新增任何私人媒體或中央會員權限、真金流/廣告、簽章上架、舊站變更。
