# 79｜公開分類／講者獎銜深連結原字串驗證

## 可重現的缺漏
`categoryFromRoute` 與 `speakerRankFromRoute` 先 `trim()` 才檢查控制字元。這讓 `%0A新人`、`%09白金` 等 URL 解碼後的**前綴換行、Tab** 被移除，驗證器把本來不符合安全字串條件的參數當成合法值。PR #92 的搜尋建議測試已發現相同類型的來源字元被 trim 擦掉問題。

## 修復
- `src/ui/echo/publicCategoryNavigation.ts` 及 `src/ui/echo/publicSpeakerRankNavigation.ts`：在 `trim()` **之前驗證原字串的控制字元與原有路由危險符號**，拒絕後再 trim；仍允許原本合法的普通前後空格與「創辦人／GAR」獎銜正規化。
- `tests/public-filter-route-raw-control.test.mjs`：合成前、後、前後混合換行/Tab/CR/NUL/DEL；確保合法全形分類與正常獎銜繼續生效、首頁/卡片/兩種公開詳情沿用同一驗證器。

## 安全範圍
不新增資料或媒體權限，全部只影響當前核准公開 metadata 的本地導覽／路由；不讀/下載/稽核私有音訊，不改 Worker、OpenAPI、D1/R2、Starry ID、28 guest 非播放政策、現役舊網域、Ads/Billing 或商店。以 exact PR CI、normal protected merge、exact main CI、唯一既有 auto workers.dev + 28 guest cover/HEAD/private refusal smoke、Cloudflare 官方100%/舊域名不變作真正完成依據。
