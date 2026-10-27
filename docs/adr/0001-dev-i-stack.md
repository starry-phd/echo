# ADR-0001｜DEV-I 方案 A 與 Echo 的 TypeScript Worker

- 日期：2026-10-28
- 決議：採用。使用者已明確指示開發依照 DEV-I 技術標準。
- 依據：DEV-I T01～T12、P01～P10；另有使用者正式核准的 Cloudflare Workers Static Assets 方案。
- 範圍：`starry-phd/echo`，不得改動 H-Global 或其他獨立品牌業務資源。

## 選型

1. App：React Native、Expo、Expo Router、TypeScript；手機原生優先，Web 用 React Native Web。
2. Worker：`worker/index.ts` TypeScript，沿用既有 Echo D1／R2；Web 用 Workers Static Assets，不新建 Pages。
3. API：版本化 `/api/v1/*`，OpenAPI 3.1 契約 `openapi/echo-public.v1.json` 與版本化共用 `packages/echo-api-sdk`；舊 `/api/*` 僅暫時向後兼容。
4. EAS：提供 development／preview／production build profiles；`eas.json` 只是可提交的工程設定，不等於已連結 Expo Project、取得簽署資格或通過實機驗收。
5. 新功能一律透過 Branch → PR → CI；Preview／Staging 正式隔離資源未建立前禁止假稱驗收。
6. 身分資料唯一主來源是獨立 Starry 中央會員 API，D1 規劃名為 `id-starry`。Echo 不保存基本個資、不直接操作 H-Global D1。
7. 對媒體維持 `visibility='public' AND migration_status='verified'` 的雙條件門檻。來源 R2 尚未搬遷，不能自動公開。

## 待完成

獨立 Staging D1/R2/Secrets、正式 OpenAPI Auth 契約、EAS 實體 Android/iOS builds、各端 E2E 與瀏覽器測試、媒體 R2 跨帳戶遷移、負載測試、P95／錯誤率告警與回滾演練。

## 替代方案與回滾

- 不採新建 Pages、Flutter、Capacitor 或直接覆蓋舊 repo。
- 若此 PR CI 未通過，不合併。回滾僅涉及新 repo 候選程式，不覆蓋舊 Echo 來源 Worker／D1／R2。
