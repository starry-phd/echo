# 92｜公開音檔分頁未完畢時不把「目前無結果」誤說成全站無公開作品

## 實際問題
`app/index.tsx` 若第一頁的核准公開音檔（或目前已載入頁面）全部被搜尋、獎銜、分類、本裝置隱藏條件排除，`currentDisplay==='empty'` 且 `tracksQuery.hasNextPage===true` 時，畫面標題已正確提示「可繼續載入」，但同一區塊的第二行仍來自 `describeEmptyPublicCatalog(migration,filtered)`。在沒有搜尋條件、僅本機隱藏卡的情境，第二行可能說「尚無核准公開的演講音檔」，與已知仍有合法的公開分頁直接矛盾。

## 修正
`describeEmptyPublicCatalog(migration,filtered,hasMorePublicPages=false)` 新增可選布林：
- 有下一頁：標題、說明皆只描述**目前已載入作品**，分別說明有／沒有搜尋條件的情境，提示繼續載入後續核准公開作品；不宣稱整個公開目錄沒有授權作品。
- 已無下一頁：保持原有搜尋無結果、遷移狀態與安全權利文案，避免誇大舊 R2 複製等於播放授權。
- 首頁直接呈現 helper 回傳的完整 title/detail，同一來源避免前後文自相矛盾。
- 既有「載入更多公開音檔」的功能、API 分頁、公共/訪客資料授權 Gate 均不改動。

## 驗收
合成測試覆蓋 `copied/verified/未知` 遷移狀態與有無搜尋條件、`hasMorePublicPages` true/false，以及首頁 UI wiring。只修改已公開目錄的 UI 文案，不查詢任何私人音訊/D1/R2，亦不改正式舊站與金流/上架。
