# 82｜時間排序：未提供公開日期時保留已核准 API 原順序

## 真實錯誤
`worker/index.ts` 對 verified-public catalog 使用 `ORDER BY updated_at DESC, id ASC`，但其 `publicTrack(row)` 回傳目前**不包含 `uploadDate`**。首頁把從此 API 已核准取得的作品與 28 張 curated guest metadata 合併後，以 `sortEchoCards` 依 `(uploadDate??'')` 排時間；兩張未提供日期的 verified-public 卡比較為相同日期，隨後以 `id` 字母排序，從而**破壞公開 API 經審核的原排列順序**。按「由舊到新」還可能把未知日期的公開作品錯當最舊。

## 安全修正
- `src/ui/echo/cardSorting.ts`：有明確公開 `uploadDate` 的作品依現有日期排序、同日以 ID 穩定排序；**缺失或空白日期的作品不猜日期**，無論「新到舊」或「舊到新」均置於已知日期之後，且在此組中保持從核准 API 合併而來的原始順序（ES stable sort）。歷史評價、按讚、心得等已存在的指標排序邏輯不變。
- `app/index.tsx`：只有目前已取得核准可見作品、有缺失日期、偏好 hydration 完成且使用時間排序時，才顯示誠實說明：「無公開日期者保留原清單順序，不代表實際上傳先後」；不得推導私人 `updated_at` 或自行替它填 uploadDate。
- 新增 `tests/undated-public-track-sort-stability.test.mjs`：合成核准 public ID 非字母順序、28 guest 有日期、升降排序、同日期穩定、來源/API contract、UI 狀態與音訊權限 gate；保留 `tests/speaker-sorting-parity.test.mjs` 原來的 dated/metric regression。

## 不變的界線
只改核准 public metadata 客戶端排序與說明，不改 Worker/API、D1/R2 或任何私人媒體；28 guest metadata-only 不能播，Starry ID Auth contract pending，Ads/Billing OFF、正式簽章/商店未授權，不改現役舊 `echo.starry.phd` 或原 Worker。此文件不是部署證據；需 exact PR CI → 正常 protected merge → exact main CI → 唯一既有 auto workers.dev → private refusal+28 guest cover+28 stream HEAD denial smoke → Cloudflare 官方100%、現役舊域名不變 → Issue #3 交接，才能標示完成。
