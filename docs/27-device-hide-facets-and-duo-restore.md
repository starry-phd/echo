# 2026-10-30｜本機「我不喜歡」：篩選選項與共同講師個別還原

## 遺漏功能與修復
1. 首頁在 PR #33–#38 已對卡片、講者、詳情、抽選依本機不喜歡過濾，但分類選單/搜尋分類建議、講師獎銜仍直接由全部28張核准訪客資訊卡推導。即使一張卡或一位講師在裝置被隱藏，該卡獨有的分類/獎銜仍可能出現在篩選器，與使用者偏好不一致。
2. `restorableHiddenSpeakers` 原本只接受與當前核准卡的**完整講師組合**完全相同的已存名稱；若裝置隱藏的是「林美麗」，而目前只有經核准的「王小明 & 林美麗」共同卡片，則收藏管理頁不能逐人取消隱藏，只能全部還原。

## 實作
- 新增 `visibleGuestFacets`：只取目前已核准 guest preview API 的資料，扣掉本機 `dislikedIds` 與 `hiddenSpeakers`，再彙整分類和 base speaker rank；同一 id 不重複。和目前搜尋／分類是否命中無關，避免使用者篩選後選項突然消失。首頁在本機偏好 `ready` 之前不顯示這些提示。
- `getCategories()` 仍是獨立的 **verified-public** 權威來源，其公開類別不受 guest-only 本機隱藏影響；沒有後端逐曲類別歸屬時，**不宣稱能將整個公開目錄的隱藏曲目類別扣除**。新變更只對有卡片 ID 可驗證的 guest 部分精確篩選。
- `restorableHiddenSpeakers` 允許顯示目前仍被核准共同作品**逐字包含的單一講師姓名**；如果儲存的是「王小明 & 私人講師」這種**完整合講師名稱**，則必須目前合法作品裡有**完全相同整組**才能顯示，不能因其中一位重新公開而把舊私人同伴名稱洩露。未知舊名依然只顯示數量、可用「還原全部」處理。
- 新增 category/rank、同名／合名、不可洩漏已撤銷合講師名稱、還原能力的單元／UI 靜態測試。

## 安全/發版界線
只更改 Expo UI 與本機偏好純函式；沒有讀取下載解碼或公開112筆私人錄音；28張訪客封面白名單、Workers API、D1/R2、Starry ID、Ads OFF、RevenueCat、DNS 皆不變。PR CI 不代表已上線。正式發版仍依 `.github/workflows/deploy-worker.yml` 檢查 main push CI、單次精確 SHA workflow_dispatch、`production` 人工審批及28圖片/no-store、私人音訊404、手機/桌機回歸。GitHub Issue #3 記錄最新實際狀態。
