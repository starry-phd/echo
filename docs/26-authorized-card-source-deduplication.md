# 2026-10-30｜已核准公開目錄 × 訪客資訊卡的同 ID 去重

## 問題及原版相容性
原版訪客可看的 metadata cards 和真正能播放的作品是不同概念。新案的 `/api/v1/catalog` 僅回傳 verified+public；`/api/v1/previews` 僅回傳28張明確 allowlist 資訊卡。隨逐曲合法完成公開權利核對後，同一個 `id` 將可能同時出現在這兩個**各自獨立已授權**的 API 回傳中。

此前首頁、抽選候選池、`/favorites`、`/speaker/[name]` 直接合併陣列，導致同一作品重複、React duplicate key、收藏數重複、講師作品重複及抽選權重偏差。

## 已修正範圍
- 新增 `src/ui/echo/mergeAuthorizedCards.ts`，只在**合法目前 API 回應內**以完整 `id` 精確去重；public verified 排在 preview 前面，故同 ID 時完整保留**public API 的單一原物件**，絕不混合 metadata、封面、`playable` 或由 preview 推導音訊權利。
- 首頁先去重再排序／搜尋／隱藏／抽選；`/favorites` 先去重，再以本機收藏 ID 與隱藏條件過濾；`/speaker/[name]` 先去重，才進行身份/姓名與本機偏好核對。收藏管理本來使用 `restorableHiddenCards` 具備同 ID Map 去重，保持原行為。
- 這是**畫面重複的防範與資料來源遷移準備**，不是宣稱任何新的公開音檔已核准：目前音檔依先前查核 112 private/copied、0 public+verified，28張訪客卡片仍不得播放。
- `/speaker` 目錄的 `getPublicSpeakers` 回傳**後端彙總**而非逐曲 IDs，尚不能精確與訪客卡 dedup 講師統計；未來須由權威 API 提供 dedup 的公開彙總或逐曲索引，在契約建立前不可虛構統計。

## 測試與 Gate
新增 `tests/merge-authorized-cards.test.mjs` 驗證公開優先、預覽不可變為 playable、來源內重複、結果不變異、抽選只一次、講師精確去重與3處 UI 接入。純 Expo 前端 helper，未改 Workers、D1/R2、私人音檔、Starry ID、付費或廣告。

PR/CI/受保護 main 合併≠正式發版；仍依 `.github/workflows/deploy-worker.yml` 精確 SHA + Production 手動審批及28封面/no-store、私有 stream 404、手機/桌面驗收。GitHub Issue #3 為最新接手入口。
