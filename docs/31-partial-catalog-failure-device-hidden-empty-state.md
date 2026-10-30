# 2026-10-30｜一個來源失敗 + 本機篩選全空時，不得顯示「沒有作品」

## 真正的缺口

Echo 的首頁、講師目錄、個別講師頁、收藏清單共用 `src/ui/echo/catalogDisplayState.ts`：來源 A 是已驗證公開 API，來源 B 是明確核准的訪客唯讀資訊卡 API，兩者均不得讀取私人音檔。

原演算法在其中一個 API 失敗，但另一個成功回傳至少1張卡時，直接以 **API 來源返回的數量** 判斷「部分資料可用」，最後再看「目前真正可見的卡片數」：若本機「不喜歡」、隱藏講師、搜尋篩選或收藏清單把所有成功讀取的卡排除，可見卡數為 0，演算法就回 `empty`。這時**失敗的另一個 API 可能仍有符合條件的合法作品**，不能宣稱沒有作品。

## 修改規則

| 狀態 | 正確畫面 |
| --- | --- |
| 任一 API 還在首次載入 | `loading` |
| 成功來源至少有 1 張目前可見、獲准卡片 | `ready`（如果另一 API 失敗，仍由舊 helper 顯示部分資料 warning） |
| 當前可見 0 張 + 任一 API 失敗 | `failed` + 重試，不謊稱沒有作品 |
| 當前可見 0 張 + 兩來源皆成功 | `empty`（即使被使用者本機隱藏／篩選完） |

更改僅涉及共用 `getCatalogDisplayState`，四個頁面都已使用這個 helper，避免個別頁面產生分歧。`hasPartialCatalogFailure` 邏輯保留；當有可見卡、另個來源失敗時繼續顯示提示。

測試新增在 `tests/catalog-display-state.test.mjs`，涵蓋曾返回28張但因本機偏好全隱藏、收藏沒有命中、講師沒有可見結果、局部成功且可見、所有來源成功但無結果，以及 pending 優先。

## 資料與安全邊界

不新增 API、不改 Cloudflare Workers/D1/R2，不觸碰112筆歷史 `private/copied` 私人音訊、28張核准訪客封面白名單、會員/金流/廣告設定、GitHub保護或 Production Environment。畫面「讀取失敗」只表示不確定，並不推論私人內容存在或授權狀態。

本次 GitHub read-only Actions 查核亦首次獨立確認**PR #42 合併後 main SHA `0eb101bd1c1cbd03e6bb8636270e19c4d2efe7ce` 的 push CI [#41013058363](https://github.com/starry-phd/echo/actions/runs/41013058363) completed/success**。查核當下沒有 waiting/in_progress Actions run；上一次 Production dispatch [#40911155585](https://github.com/starry-phd/echo/actions/runs/40911155585) completed/failure，最近一次成功的 Production dispatch [#40884782654](https://github.com/starry-phd/echo/actions/runs/40884782654) 早於新 PR。這些是當次快照，**不能代替新的 merge main CI 或正式發版審批**。

正式部署仍須重新確認當時最新 main 和 main CI、Production 無進行中/等候中，按 `.github/workflows/deploy-worker.yml` 指定 SHA workflow_dispatch + `DEPLOY-ECHO-STARRY-PRODUCTION` 與 `production` 人工審批後驗收；不得以 Cloudflare 直接部署取代。
