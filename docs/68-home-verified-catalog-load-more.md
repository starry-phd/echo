# 68｜首頁已驗證公開音檔「載入更多」：修復前 100 筆截斷

## 為何需要此補強

`starry-phd/echo` 目前的 Worker `/api/v1/catalog` 已在 PR #82 提供 **verified-public-only**、按 100 筆一頁的可選 `offset`，並經本地 SQLite 205 筆合成公開資料與 private/copied 拒絕測試。原本首頁 `app/index.tsx` 仍使用一次 `useQuery(getPublicTracks)`，因此任何經審核的公開作品若排序落在第 101 筆後，首頁可能找不到。這是新基座的公開清單容量缺口；**不是**根據舊版推測有人可播放的錄音，也不是開放私人資料。

## 實作

- 首頁 public+verified catalog 使用 `useInfiniteQuery` 讀取 `offset=0/100/200/…`，繼承原來搜尋文字、分類與 SDK 的 public-only 查詢；只有整頁剛好 100 筆才提示再取下一頁。
- 28 張由舊版核准之訪客資訊卡仍獨立經 `getGuestPreviewTracks` 取一次，**沒有讓 curated guest API 接受 offset**，全部仍 `playable=false`。
- 所有 public+verified 已載入頁面合併後再經現存 `mergeAuthorizedCards` 與本機 dislike/hidden-speaker、公開分類/獎銜/搜尋過濾，排序、抽選與播放導覽仍用既有公開授權門檻。
- 首頁底部「載入更多公開音檔」，載入中防重複；來源失敗可重試並保留已載入卡片，不改本機收藏/會員任何紀錄。原先「訪客可瀏覽 N 張」改為精確的「訪客**目前已載入** N 張」，避免尚有後續頁時誤導為全資料。
- `tests/home-verified-public-pagination.test.mjs` 回歸檢查 public-only 分頁、guest 未分頁、來源錯誤與權限過濾。實際 SQLite 205 筆權限/offset 測試已在 `tests/verified-public-speaker-pagination.test.mjs` 覆蓋。

## 非完成項目

首頁尚無原版私人帳號與全量合法音訊，現階段 old 112 private/copied、0 public+verified 為前次快照，本批**完全不讀** private R2 或 D1 媒體及 Starry ID。排序與隨機抽選只在**當前已載入**結果內運作，不聲稱是未載入公開資料之全球排行榜。不可將已核准訪客資訊卡升級為播放器。CI→正常合併→main CI→單一 auto Worker 部署→私人媒體拒絕/28 卡 smoke→Cloudflare 官方 100%+舊 `echo.starry.phd` 綁定不變。Ref #3。
