# 69｜本裝置收藏與隱藏：安全查回第 101 筆以後的公開作品

## 發現的真實缺口

`app/favorites.tsx` 原先讀取 `getPublicTracks(signal)` 一次，Worker 每次只提供最新 100 筆 **public+verified**。即使使用者曾在原本核准的公開作品按「收藏」或「我不喜歡」，當它後來排序落在第 101 筆後，收藏頁就無法找到，可能錯誤顯示「無收藏」，個別取消隱藏也找不到名稱。這與私人播放權限無關。

## 解法與安全邊界

- 既有 `GET /api/v1/catalog` **新增非必填 JSON 字串 `ids`**，一次最多 16 個合法、1～200 字元的 ID、JSON 總長最多 4096 字；錯誤格式立即 400 不查 DB。透過 **綁定的** `id IN (SELECT value FROM json_each(?) WHERE type='text')` 篩選，且原本 `visibility='public' AND migration_status='verified'` 永遠在同一 WHERE 中，**本機收藏 ID 絕非播放/閱讀授權**。
- `packages/echo-api-sdk/src/index.ts` 增加 `CatalogFilters.ids` 並拒絕空／超過 16 筆／非法 ID，再送 `/api/v1/catalog?ids=...`。OpenAPI `openapi/echo-public.v1.json` 記錄此參數。
- `src/ui/echo/authorizedSavedPublicBatches.ts` 每 16 筆分批查詢並去重、逐批等待；`app/favorites.tsx` 對本機 `favoriteIds + dislikedIds` 只從**現行** API 重新取得公開合法資訊，與現有 first-page catalog/28 guest curated previews 分開再合併。`mergeAuthorizedCards` 仍以 verified-public 為先，保留本機 hidden-speaker、hidden-ID 過濾與未查到時不透露私有名稱的規則。
- **絕不修改** `GET /api/v1/previews` / `GET /api/v1/previews/{id}/cover`，也不查私人音檔，不讀會員 Starry ID，不寫 D1/R2。不存在/私人/尚未驗證的 saved IDs 結果為空，不會洩漏任何欄位或解鎖播放。
- `tests/saved-public-id-batch-lookup.test.mjs` 於本機 SQLite 插入 125 筆 public+verified、1 筆 private/copied、1 筆 public/copied，確認 `p124` 可找回、兩種拒絕，不合格 JSON 400/DB 零查詢、SQL injection 綁定、SDK ID 安全、35 筆以 16/16/3 分組及 UI 本地授權 gate。

## 尚未完成

該批只是 public verified 的**metadata** 安全查詢改良，沒有完成真實會員收藏同步、原版會員資料與音檔/續播、內部 EAS 簽章及手機實測。最多 1000 個 ID 的極端儲存情形可產生數十個串行 public API 請求，未做正式壓力測試。舊正式網域 `echo.starry.phd` 仍由 `temp-starry-echo-bridge` 服務；只將新版 code 發布至 workers.dev。Ref #3。
