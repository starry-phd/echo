# 88｜已核准公開分享前重新驗證權利；訪客資訊卡 fail-closed

## 已確認缺口
`LegacyVerifiedTrackShare` 在使用者下載 public-only PNG 前已有公開 by-ID 重新檢查；但分享只依頁面載入時的快照產生訊息。如果在瀏覽頁面期間公開權利被撤銷，可能仍呼叫系統分享並傳出過時頁面連結。不是音訊下載，但應對撤權保持一致。

## 修正
- 點擊已核准公開頁面分享時，先以既有 `getPublicTrack(routeId)` 重新取得 verified-public by-ID；重新執行 `approvedPublicTrackShareMessage`，若404、非公開、無網路或資料不符，**不呼叫系統分享**，顯示可辨識錯誤。
- 使用最新驗證資料的 title/message；原本 PNG 重新驗權流程保持。卡片分享入口原有 approved public gate 不變。
- share helper 新增 `legacySnapshot===true` 明確拒絕，確保 28 guest metadata-only 即使將來因程式錯誤被標示 playable 也不會取得公開分享或資訊圖卡權限（PNG 使用同一 helper）。
- 測試含 stale vs verified、guest playable 錯誤標記、分享時必須先驗權、拒絕 callback side effect 的靜態順序與既有安全回歸。

不新增 Worker/OpenAPI、會員資料或 R2 讀取；不改舊 Worker/domain、金流／廣告或原生商店。部署仍僅走 protected main CI success 的唯一自動 workflow_run。
