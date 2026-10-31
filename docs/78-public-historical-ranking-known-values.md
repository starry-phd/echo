# 78｜熱門公開榜單僅排名有明確公開歷史統計的作品

## 真實 bug 與原版對照
舊版 `yukidu/Echo-Starry/src/components/StatisticsView.tsx` 的「熱門音檔排行榜」按評價、心得等統計排序，資料來自可用的真實記錄；新版 `app/stats.tsx` 雖已安全地只採已核准 guest metadata 和 verified-public catalog，卻會對**每張可見卡**套 `sortEchoCards(visible,metric)`，而 `sortEchoCards` 會把**沒有該指標的 `null/undefined`** 當作 0 排入 top10。於是在核准公開清單不足10張時，沒有核准歷史指標的作品也會得到虛假的名次。

## 修復與介面
- 新增 `src/ui/echo/historicallyRankableTracks.ts`，只以既有 `readHistoricalEngagement` 驗證已明確發布的唯讀舊版指標；依目前選取的 `rating` / `likes` / `comments` 過濾後，再套現有日期／指標排序。
- **已公開且數值為0** 的真紀錄保留排名資格；**缺漏指標** 不當作0；來自 `legacySnapshot!==true` 的無歷史記錄作品不列入假榜。
- `app/stats.tsx` 保留原有 5 分頁／3 個可支援熱門指標、已核准清單分頁與本裝置不喜歡/隱藏，以及先前「非全量」提醒；加上沒有符合已公開統計時的誠實空結果說明，避免誤稱世界總排行。
- 更新兩份已有的榜單回歸測試和新 `tests/public-hot-rankings-known-metrics.test.mjs`，用**合成**指標測試未知值/零值、按讚、心得、評價與 API source gating。

## 安全與發布
不查詢會員、不導入任何私人音檔、不變更 Worker/API/OpenAPI/DB/R2、28 張訪客 metadata-only 不可播、Starry ID、廣告/金流/原生商店或現役 `echo.starry.phd`。以 exact PR CI、正常 protected merge、exact main CI、唯一 `workflow_run` workers.dev 部署、私媒拒絕/28封面/28 HEAD smoke、Cloudflare官方100%及舊站不變為發布完成條件。
