# Echo ↔ Starry 中央會員 API 對接（最新五欄契約，待中央正式上線）

**狀態：DRAFT / CENTRAL API NOT DEPLOYED / FAIL CLOSED**。

權威原則：會員基本資料**只**取自繁星生態系中央會員 API，中央預定 D1 名稱 `id-starry`；`echo-starry` D1 只記 Echo 音檔、分類、收藏、進度、留言及 Starry 中央不透明 ID 外鍵，不存自己的一份會員姓名／Email／手機／出生日期等主檔。舊 `users/auth_sessions` 不可移為新版登入資料。

依《最新開發技術規範》整合版 v1.0 §6.1 / UP-13，中央正式契約的**本人資料讀取預定**：

- `GET /v1/starry-id/members/me`（**本文件要求的正式契約名，不表示已部署**）
- 恰好五個標準欄位：`s_user_id: string`（穩定不透明 ID）、`display_name: string`、`directory_opt_in: boolean`、`display_name_public: boolean`、`profile_revision: positive safe integer`。
- 欄位更改採中央版本與 CAS，真正的 PATCH 路徑**仍待中央 Owner 正式公布**，不可隨意把 Echo 舊 `PATCH /v1/me` 候選當上線 API。
- 正式發行者／audience／OAuth2.1 / OIDC + PKCE 或已批准替代方案、scope／Session revoke、跨品牌及環境限制均要中央 OpenAPI/安全測試及實際部署核准。不能用客戶端解析的 JSON 代表憑證已驗證。
- Echo 專用 `src/auth/centralMemberContract.ts` 是**純 DTO 格式驗證**；`src/auth/centralMember.ts` 仍**拒絕**取得會員資料以防假登入。

跨品牌新需求：業主希望日後 Starry 會員在 H-Global 註冊／登入／更改基本資料時，自動執行**雙方已驗證且具必要同意後**的中央帳號綁定與基本資料同步。**Echo 無此執行權**；雙方中央 Owner 負責證明同一人、實際同步欄位/版本/衝突/撤權/刪帳與 audit。**禁止以相同 Email／姓名直接綁定**；如果只有一邊 session、中央 API 未上線或沒有確認跨品牌個資處理合法基礎，應明示 PENDING、不寫入、不回報已同步。詳細威脅模型與 Mermaid 見 [ADR-0003](adr/0003-central-member-and-cross-brand-identity.md)。

對應中央 Repo：`starry-phd/id` 仍以最新 main 為準；`apps/api/openapi.yaml` 查核時只有 `/v1/health`，標記 DRAFT/not deployed。不得在 Echo 偽造 `/me` 或藉直接連 D1 繞過中央會員服務。

參考：<https://docs.google.com/document/d/1urLja9i9A63jHuz4jQPhPMTgoCtoq-i1TafXPQd3PYU/edit?usp=drivesdk>；本專案最新進度以 [Issue #3](https://github.com/starry-phd/echo/issues/3) 為準。
