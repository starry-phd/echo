# 中央會員 API 對接契約草案（待另一 AI 工作流確認）

**注意：這是一份需求，不是聲稱存在的 API。**

- 中央資料庫預定名稱：`id-starry`（並非 URL）。
- API origin：**未確定**，由負責中央會員服務的 AI 提供正式 OpenAPI。
- 登入：導向 Starry 中央身份服務；採 OAuth2.1 / OIDC + PKCE 或已核准等效機制，不保留舊 session，不在 app 中嵌入機密。
- `GET /v1/me`（路徑僅供協商）：成功時回傳 `userId`（穩定不重用）、displayName、avatarUrl、version；檢查 token audience、issuer、signature、expiry。
- `PATCH /v1/me`（路徑僅供協商）：基本資料在中央更新；Echo 不直接更新本地會員主檔。
- `POST /v1/cross-ecosystem/links`（暫訂）：中央系統受控端點，在兩個系統各自完成身分證明及必要同意後建立配對；禁止 Email／手機直接合併。
- 雙向同步：定義欄位白名單、個人可見性、來源與優先權、衝突及循環防護、版本／時間戳、冪等 event ID、稽核事件、撤回綁定。
- Echo App 對中央只能取得最小必要身份資料，帳號關聯與雙向同步由中央 API 負責；不可直接連到 H-Global 私有 D1。
- 契約到位前 `src/auth/centralMember.ts` 故意無法登入，以避免假成功。
