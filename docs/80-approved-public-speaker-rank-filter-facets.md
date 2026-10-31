# 80｜首頁進階篩選補齊已核准公開作品的講師獎銜

## 真實缺漏
原版 `yukidu/Echo-Starry` 首頁可依講師獎銜篩選作品。新版 `app/index.tsx` 已支援「只顯示目前核准作品」的 rank 篩選，但進階篩選的可選獎銜 `ranks` **只來自 28 張訪客資訊卡的 `guestFacets.ranks`**。當真正有可播放授權的 `getPublicTracks` 新增核准作品，公開詳情和卡片的獎銜雖可連到首頁，選單仍可能沒有該獎銜。

## 修正
- 新增 `src/ui/echo/visibleAuthorizedRankFacets.ts`：依**當前已載入**的 `getPublicTracks` verified-public 和 `getGuestPreviewTracks` 核准 guest metadata-only 結果組合候選。
- Verified-public 只走既有 `approvedVerifiedSpeakerRank`；guest 只走 `approvedGuestSpeakerRank`，兩種都經 `speakerRankFromRoute` 驗證，不依本機收藏ID或猜想取得音檔權限；同 ID 以 verified-public 為準，排序去重。
- 排除「我不喜歡」和隱藏講者作品的候選；**裝置偏好未完成 hydration 前不展示選項**。保留已核准分類選項、搜尋、播放權限的既有機制。公開分頁未全部載入時，獎銜選項也只代表目前已取得的核准作品，不冒充全站總獎銜目錄。
- 新增 `tests/visible-authorized-rank-facets.test.mjs`：合法 public/guest、無效/偽造狀態、同 ID 資料源優先、隱藏、非法獎銜、首頁來源/偏好 gate；更新 `tests/visible-guest-facets.test.mjs`。

## 不變的安全邊界
僅顯示已核准公開 metadata，完全不查私人 R2／會員D1，不變更API/Worker/播放權限，28張 curated guest 永不可播；Starry ID 真實 Auth contract 尚未核准，不啟用會員同步、真廣告／金流／原生商店上架，不更動 `echo.starry.phd` 或舊 Worker。

本文件不是部署證據。僅在 PR exact HEAD CI success → 正常 protected merge → exact main CI success → 唯一現有 workflow_run Worker auto deploy → HTTP private-media refusal + 28 guest covers nonplayable + 28 stream HEAD 404/no-store smoke success → Cloudflare 官方100%及現役舊網域未變後，才算完成。
