# Echo 套用「最新開發技術規範」差異摘要｜2026-10-30

- **最新業主指示**：將舊 `yukidu/Echo-Starry` 安全移植至既有 `starry-phd/echo`；唯一 Starry 會員主資料經中央 API、Echo D1 保持 `echo-starry`；新增 Starry ↔ H-Global 註冊/登入/基本資料編輯後的受控自動綁定同步方向。
- **查核文件**：「最新開發技術規範」整合 v1.0 + S2，2026-10-30 Google Drive 確認最新內容；優先流程 v3.0、UP-01～24。
- **保留已完工結果（UP-03）**：現有 Expo 58/RN 0.88.1、Expo Router、TS strict、React Native StyleSheet tokens、Hono/Zod Workers、Cloudflare D1/R2、Workers Static Assets、24 色主題、28 張唯讀訪客卡、R2 複製。文件說「新 App 使用當時最新官方穩定 Expo」並不強迫重做現有已通過相容驗收的基座。
- **中央已明示本人資料五欄**：`GET /v1/starry-id/members/me` 的 `s_user_id`、`display_name`、`directory_opt_in`、`display_name_public`、`profile_revision`；舊 Echo 猜測四欄 DTO 錯誤，這輪改成五欄 **fail-closed 格式驗證與測試**。
- **中央仍未發布**：本輪查 `starry-phd/id` 的 `apps/api/openapi.yaml` 仍 health-only。不能宣稱會員資料 API 可呼叫／登入成功／雙品牌已同步；跨品牌 API 由**另一 AI 工作流**負責，Echo 不介入 H-Global D1。
- **需另受審的決議差異**：UP-02 原本禁止跨品牌依 Email 合併，業主新需求是雙向基本資料同步；採「雙方帳戶所有權已證明＋適當同意/法律基礎後，中央後端在註冊/登入/編輯事件觸發」而非未經驗證 Email 自動合併。欄位清單/寫入權/衝突/撤銷仍待雙服務正規契約與法遵。
- **資源不重建**：不建立第二個 Echo D1/Pages/Worker、新 Monorepo，亦不改星/寰宇中央 D1；依目前 GitHub Issue #3，R2 搬移 596/596 物件、Echo D1 112 音檔皆 private/copied、28 白名單封面；舊 D1 staging 182 筆是不完整狀態，受限跨帳搬移不得重試繞過。
- **商業與發布**：AdMob Mediation 已選但 Ads OFF；RevenueCat 未初始化；Battery 永久免費、首贈反重領及會員刪除政策待中央法遵審；個別新測試資源/額外費用/OAuth 修改/Production/Store 仍走獨立 Gate。不得因這份規格把開案方向當已部署。
- **本批實際交付證據**：`src/auth/centralMemberContract.ts`、更新 fail-closed `centralMember.ts`、新離線測試、更新 `docs/02`、`ADR-0003`；PR 和 CI／合併狀態請回 Issue #3 核對。
