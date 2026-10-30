# 2026-10-30｜講師與收藏頁面的雙來源故障安全呈現

對照新 Echo 現有兩條已核准資料 API：`GET /api/v1/catalog`（僅 public+verified）及 `GET /api/v1/previews`（28張唯讀白名單）。首頁 PR #23 已分開 loading/failed/empty/ready，但講師目錄、講師作品及收藏頁仍以「兩條同時失敗」才報錯，**造成一條 API 失敗另一條合法回應空清單時誤報沒有任何內容**。

這批沿用 `src/ui/echo/catalogDisplayState.ts` 的四態純函式，不擴權、也不加 API：
- 任何來源 pending 時照既有載入提示，不先下空清單結論；
- 一條 API 失敗、另一條成功但沒有資料時，顯示「讀取失敗／重試」，不可顯示空結果；
- 一條失敗、另一條已有可瀏覽作品時保留安全資料，明確提示「資料可能不完整」與重試；
- 兩個來源皆正常且經本機「我不喜歡」或收藏篩選後為空時，才顯示真正空清單；
- 收藏紀錄仍僅保留於裝置，不因 API 錯誤清空；沒有新增敏感資料儲存或帳號同步。

修改：`app/speaker/index.tsx`、`app/speaker/[name].tsx`、`app/favorites.tsx`；增加 `tests/catalog-display-state.test.mjs` 的回歸。**原版完整講師簡介、逐字稿/AI、會員收藏同步、私人錄音與播放授權仍未完成**。此為前端可靠性修正，不碰 Worker、D1/R2，也不移植未授權舊資料。合併及 main CI 與正式 Production 發版各有獨立 gate。
