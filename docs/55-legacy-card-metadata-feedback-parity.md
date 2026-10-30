# 55｜原版音檔卡片：講者／時間／分類與互動統計排版

## 原版真實程式碼依據
唯一參考 `yukidu/Echo-Starry/src/components/AudioCard.tsx`（2026-10-31 核對最新 main）。卡片主區 `gap-3 sm:gap-4`，外框 `py-2.5 pl-2.5 pr-2.5 sm:py-3 sm:pl-3 sm:pr-3`；右欄 `pr-7 sm:pr-8`；講者 `text-sm sm:text-base`；時長 `text-[9px] sm:text-[10px]`；分類 `text-[9px] sm:text-[10px]`。尾部 `reaction`（心得、按讚）標記 `order-1`，星級／評分 `order-2`，顯示順序為**心得／按讚在上、星級在下**，字體14px、星星18/20px。

## 修正範圍
- 延用 PR #69 原版 640px 的 `legacyAudioCardSizing`，補回 `bodyPadding/bodyGap/detailsRightPadding/speakerFont/durationFont/tagFont/starFont/engagementFont`。
- `LegacyTrackCard` 標題、講者／獎銜、時長、分類與歷史互動統計依手機／桌面原版尺寸呈現。
- 將合法已核准歷史心得、按讚數量移到星級評價上方；保留「舊版統計（唯讀）」標示，避免偽稱中央會員已可寫入。
- `tests/legacy-card-visual-breakpoint.test.mjs` 覆蓋 639/640 分界、metadata 尺寸、原版資料順序與安全標籤；既有權利和媒體測試維持。

## 不變的安全邊界
**不新增功能、資料列或用戶權限**；不更動 Worker、Starry ID、D1、R2、音訊授權、播放、分享/評論寫入、會員或管理功能；28 個公開訪客封面仍不可播放，112 私人錄音不公開、不觸發私人音檔稽核。保留已核准的分類／講者連結與裝置偏好。必須走 exact SHA PR CI、protected merge、main CI、唯一自動 Production、正式 HTTP 安全 smoke、Cloudflare 官方新版本100% 驗收。Refs #3。
