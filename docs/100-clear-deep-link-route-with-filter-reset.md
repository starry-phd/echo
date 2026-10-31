# 100｜清除全部篩選不得留下舊的分類／獎銜深連結

## 實際缺口
新版首頁 `app/index.tsx` 支援原版 metadata 篩選的安全深連結 `/?category=新人` 與 `/?rank=白金`，由 `useLocalSearchParams` 驗證後預設篩選；但「清除全部篩選」原本只執行 `setQuery('');setCategory(null);setSpeakerRank(null)`，沒有清除 URL。此時畫面已清除，重新整理或分享舊網址卻又重新套用先前篩選，和明確的「清除全部」動作不一致。此問題與 PR #114 的 Logo 導航重設不同。

## 安全最小修正
- 將首頁「清除全部篩選」統一接到 `clearAllHomeFilters`：先收合搜尋提示，清掉即時與 debounced query、分類及講師獎銜。
- **只在 URL 帶入 category/rank 原始參數時**，呼叫 `router.replace('/')` 移除舊深連結並避免新增歷史條目；一般從首頁手動輸入文字後清空，不做多餘路由操作，原有排序仍保持。
- Expo 官方文件說 `setParams` 適合更新參數，但部分版本/導航情境曾有 `undefined` 轉字串或無法刪除的報告；本次只針對清除使用完整目標路徑的 `replace('/')`，不使用 `window.history` 或 DOM API。
- 本次不修改分類／講師路由驗證、API 源、音檔卡授權、收藏、私人 R2 音訊或任何中央會員資料。

## 測試／發布
新增 `tests/clear-deep-link-filter-url.test.mjs`，並更新既有搜尋提示回歸，驗證清除事件的實際接線、兩種 URL 參數、及一般文字搜尋無多餘導航。此為程式來源/CI 等級測試，不代表真人 Expo Web/原生 reload E2E 已完成。
發佈仍依 exact PR CI→Ready→protected merge→exact main CI→唯一 workers.dev auto workflow_run→homepage/API/private refusal+28封面/28 HEAD404-no-store→Cloudflare100%及舊正式網域不變。
