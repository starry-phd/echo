# 57｜舊版第二層詳情：評價／心得／按讚摘要列

## 舊版真實來源
2026-10-31 核對 `yukidu/Echo-Starry/src/components/DetailView.tsx`：
- 在講者與獎銜資訊之後，原版有一列緊密置中的互動摘要：五星評價及平均分／評價人次、心得 icon+數字、愛心按讚數，三者以分隔符分開。
- 心得數字可點擊跳到下方 `comments-section`。
- 原版的星級和按讚有登入／權限後的寫入行為；新案目前沒有 Starry ID 和 Echo 評價／心得業務 API，不能照搬舊 session 或假造寫入能力。

## 本輪實作
- 新增 `LegacyDetailEngagementSummary`，只接受 `legacySnapshot === true` 時 `readHistoricalEngagement(track)` 返回的已核准歷史統計；不存在可信歷史值時顯示「未提供」，真實零仍顯示 0。
- `app/preview/[id].tsx` 將摘要列放回講者資料之後、詳情資訊之前，對應原版順序；心得項目只跳到本頁既有「評價與心得收穫」唯讀區。
- 平均星等和按讚都純展示，不提供寫入按鈕；不調用會員、評論、評分、按讚 API，不新增會員權限，不建立假的評論清單。
- 新增 `tests/legacy-detail-engagement-summary.test.mjs` 驗證 snapshot gate、0/null、唯讀、導覽順序和 guest route 無播放器。

## 安全邊界
不改 Worker/OpenAPI/資料庫/D1/R2/Starry ID/媒體授權；不查看或稽核私人音檔。訪客 preview 仍無音訊 source、播放器、分享或留言寫入。原版可寫入的評價／按讚只有待中央身分及 Echo 業務 API 正式授權後才可移植。依 exact PR SHA CI → protected merge → exact main CI → 唯一自動 Production → HTTP/private media + 28 guest cover nonplayable smoke → Cloudflare 100% 驗收。Refs #3。
