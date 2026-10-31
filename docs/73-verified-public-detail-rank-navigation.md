# 73｜Verified-public 詳情講者獎銜篩選（原版行為對照）

## 舊版依據
`yukidu/Echo-Starry/src/components/DetailView.tsx` 約第 721～733 行，既有 `speakerRankBadge(track.speakerRank)` 的獎銜按鈕會呼叫 `onSelectSpeakerRank(rankBadge.rank)`，篩選同獎銜錄音。

## 新版缺漏與修復
- `app/track/[id].tsx` 的已驗證公開詳情原先只有「· 獎銜」純文字；`app/preview/[id].tsx` 的核准 guest 資訊卡已具安全的 rank link。
- 本輪新增 `approvedVerifiedSpeakerRank`（獨立於 `approvedGuestSpeakerRank`）：只在**從 `getPublicTrack` 已核實的 public+verified response**且 `playable===true` 時，以既有 `speakerRankFromRoute` 驗證、正規化路由值，才顯示可按獎銜。
- 已核准公開詳情的獎銜可點選進入 `/?rank=...`，由既有首頁 `matchesCardFilters` 在**當前取得的公開／核准 guest metadata**中篩選，不建立新 API、不得提高任何音訊讀取權限。無效獎銜保留純文字，無法成為可點的篩選。
- `tests/legacy-approved-speaker-rank-links.test.mjs` 新增正常/惡意/空值、guest 非播放、路由及既有 public API gate 回歸測試。

## 範圍與驗收
未更改 Worker、D1/R2、OpenAPI、私人媒體、Starry ID、金流、廣告、原生簽章與現役 `echo.starry.phd`。28 張 guest-only 卡仍不可播放；此輪僅移植已核准的**公開詳細資料**視覺導覽。合併與部署必須另以 exact SHA CI、正常受保護流程、唯一 auto Worker deploy、安全 smoke 和 Cloudflare 100% 官方結果為憑，不得因文件宣稱完成。
