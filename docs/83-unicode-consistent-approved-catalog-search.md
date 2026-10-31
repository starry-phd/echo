# 83｜已核准卡片搜尋 Unicode 與分類建議一致

## 實際可重現問題

舊版 Echo 首頁可跨標題、講者、分類及時間搜尋；新版已限制搜尋**目前取得的已核准公開作品與 28 張 allowlisted 訪客資訊卡**。PR #92 的 `publicCategorySuggestions` 已使用 NFKC 讓使用者輸入「AI」找到來源原文「ＡＩ」；但 `matchesCardFilters` 只做小寫，不做 Unicode 正規化。

因此即使分類建議找得到「ＡＩ」，直接輸入 `AI`、`mary` 卻找不到同一筆含 `ＡＩ`、`Ｍａｒｙ` 的已核准卡；使用者會看到建議與搜尋結果矛盾。

## 本次修正

- `src/ui/echo/cardFilters.ts` 的**自由文字搜尋 token 與目前核准卡的欄位**同時使用 NFKC＋`zh-Hant` locale lowercase；原本跨欄位多個 token 必須全部命中（AND）的行為保留。
- **分類晶片與講師獎銜精確比對不變**，不把 `AI` 虛構成新的 `ＡＩ` 分類，亦不擴大已核准清單或新增任何 DB／API 查詢。
- `tests/card-filters.test.mjs` 加入全形英文字、全形空白、多字AND、原分類完全相等及無關內容不可見的合成回歸。
- 不改 Worker/OpenAPI/SDK、D1/R2、Starry ID、任何媒體權限、28 guest metadata-only 不可播放政策、正式舊網域、廣告／金流／原生商店。

本文件不是部署證據。仍須 feature exact PR CI success → protected merge → exact main CI success → **唯一既有** workflow_run workers.dev Worker＋Static Assets → private-media refusal、28 guest covers、28 stream HEAD 404/no-store 安全 HTTP smoke → Cloudflare 官方 100% 與 `echo.starry.phd` 舊 Worker 不變 → GitHub Issue #3 交接。
