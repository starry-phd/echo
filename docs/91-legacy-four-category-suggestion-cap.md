# 91｜搜尋建議最多顯示四個分類（原版 1:1）

## 原版依據
`yukidu/Echo-Starry/src/App.tsx` 的原版搜尋提示清單：`const matchedCategories = categoryOptions.filter(...).slice(0,4)`；無輸入時回傳空提示（已由 PR #105 修復）。新版 `app/index.tsx` 先前呼叫 `publicCategorySuggestions(categories,query)` 使用預設 `max=12`，導致分類建議過多，不符合原版的精簡彈出區。

## 實作
- 首頁只在呼叫 `publicCategorySuggestions(categories,query,4)` 時將搜尋建議限制為 4 項；保留原本列表順序、PR104 的精確分類與 Unicode 搜尋語義。
- 已核准類別的完整 `LegacyFilterToolbar categories={categories}` 下拉選單保持完整，不因搜尋提示上限隱藏分類。
- 回歸測試確認 6 個符合輸入的合法分類只顯示最先四個、helper 原本較高上限仍適用其他用途、首頁使用 4 且分類選單未縮減。更新既有 source wiring 靜態測試，沒有取消 CI 規則。

## 安全範圍
無 Worker、OpenAPI、D1、R2、Starry ID、私人音訊、播放或分享授權變更；28 筆 curated guest metadata-only 卡繼續不可播放。正式舊站、Ads、Billing、原生簽章與商店未改。發布仍經受保護 PR/exact CI/唯一既有 workflow_run 和 Cloudflare 100% 驗收。
