# 74｜公開音檔列表的講者獎銜安全篩選修復

## 真實來源與差異
- 原版 `yukidu/Echo-Starry/src/components/AudioCard.tsx` 在卡片講者姓名旁顯示講者獎銜；`DetailView.tsx` 的獎銜徽章可以按下篩選同獎銜作品。
- 新版 `LegacyTrackCard.tsx` 已讓 **28 張核准 guest metadata-only 卡**的獎銜連到首頁篩選，但 **public+verified** 列表卡片只顯示純文字，必須進入詳情頁才能使用 PR #88 已恢復的獎銜篩選。

## 實作
- 保留 guest 路線 `approvedGuestSpeakerRank(track)`；僅在它沒有合法 rank 時，對 `playable===true` 的**目前 API 已驗證公開卡**使用現有 `approvedVerifiedSpeakerRank(track)`。兩者都走 `speakerRankFromRoute` 驗證正規化，無效值不連結。
- 仍使用既有 `/?rank=...` 路由；只篩選已取得、已核准的公開作品或 guest metadata；**不會提供任何新的媒體權限**。
- 保留照片播控、guest preview 獨立路由、收藏／本機隱藏。新增 `tests/verified-public-card-rank-links.test.mjs` 以測試兩種核准狀態與無效狀態，以及首頁/排行榜/收藏使用已核准來源。

## 界線與 Gate
不變更 Cloudflare Worker、OpenAPI、D1/R2、Starry ID、付費/廣告/原生上架、現役舊網域、28 張訪客卡的不可播放政策；私人音檔完全不讀、不下載、不處理。此文件**不是成功部署證明**；實際合併/部署狀態必須核對 exact PR/main CI、唯一自動 Workers 發布、安全 smoke、Cloudflare 官方100%與舊站不變。
