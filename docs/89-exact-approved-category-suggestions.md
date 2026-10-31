# 89｜分類搜尋建議保留核准原標籤，拒絕失配與 Unicode 合併

## 問題
首頁 `app/index.tsx` 已透過 `safeApprovedCategoryOptions` 提供分類選單的可導航且精確來源，但公開的 `publicCategorySuggestions` 在獨立呼叫時仍先 `categoryFromRoute(raw)` 修剪文字。傳入原始 `" 新人 "` 會顯示 `"新人"`，點選後不能對原卡做 exact match。同時建議以 NFKC + 小寫結果去重，若已核准來源同時提供 `"AI"` 與 `"ＡＩ"`，搜尋輸入 `AI` 只會列出第一個，另一合法分類雖可在選單中找到，卻無法從搜尋建議中獨立選擇。

## 修改
- 僅從呼叫端已提供的目前核准 public categories 與 curated guest categories 生成建議。每一原始標籤由現有 `approvedExactCategoryLink` 拒絕前後空白、控制字元、危險 Unicode 正規化結果及不安全長度；沒有新增資料來源。
- NFKC + `zh-Hant` 小寫僅用於*使用者輸入比對*，不改動輸出的原始已核准標籤。
- 只按原始**完全相同**標籤去重，`AI`/`ＡＩ` 各有自己的精確篩選機會；保持已存在的來源順序、AND 關鍵字、最多 16 筆建議、純文字選擇。
- 補上原始空白標籤、控制字元、危險全形標籤、NFKC 同形不同分類、去重及目前卡片 exact-match 的 regression tests。

## 範圍與禁止事項
不變動 Worker/OpenAPI/D1/R2/Starry ID；不改公開作品授權、不讀私人音訊、不擴大 28 curated metadata-only 訪客卡的展示或播放權限；不改正式舊站與付費／上架設定。依原 CI、受保護 PR 與唯一既有 `workflow_run` 發布，並驗證 28 張封面和 28 筆訪客串流 HEAD 404/no-store。
