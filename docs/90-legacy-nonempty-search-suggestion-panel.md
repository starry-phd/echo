# 90｜原版搜尋欄：空字串聚焦時不要展開建議分類

## 原版證據與新程式差異
舊 `yukidu/Echo-Starry/src/App.tsx` 搜尋建議邏輯：`const q=searchQuery.trim().toLowerCase(); if(!q) return {categories:[],keywords:[]};`，表示搜尋欄沒有真正輸入文字時，不顯示建議面板。

新版 `app/index.tsx` 使用 `searchSuggestionsOpen&&categorySuggestions.length>0`，但 `publicCategorySuggestions(source,'')` 會列出最多 12 筆已核准分類；於是使用者僅點入空白搜尋欄，甚至輸入空格，就出現與原版不符的分類建議。

## 最小修復與測試
新增純 UI gate `shouldShowCategorySuggestions(focused,typedQuery,suggestions)`：需已聚焦、搜尋欄 trim 後非空且有核准分類建議，才顯示。維持原本的正式核准來源（verified-public categories + 28 curated guest metadata-only）、NFKC 搜尋匹配、精確分類晶片、分類下拉選單及搜尋篩選策略不變。

回歸測試包含空字串、空白字串、無焦點、無建議、有效字詞及首頁實際 UI 使用情況。沒有新增網友關鍵字（仍待正式 moderat​​ed API），也不顯示未授權標籤。

## 安全與發布界線
不動 Worker/OpenAPI、D1/R2、中央 Starry ID、任何私人音訊、28 張訪客不可播放/不可分享權限，也不改正式舊網域或真 Ads/Billing／簽章商店。按唯一既有 workflow_run 的完整 CI/HTTP smoke/Cloudflare 官方驗收發布。
