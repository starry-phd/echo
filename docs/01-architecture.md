# 繁星回聲 V2：架構決策與資源登記

## 2026-10-28 正式目標

- App：React Native + Expo Router + TypeScript，同一專案對應 iOS / Android / Web。
- Repo：`starry-phd/echo`；由 `yukidu@gmail.com` 有權管理的 `starry-phd` GitHub 組織保管。
- Cloudflare：`starry.phd@gmail.com`；Account ID `9ff1b4c261141730ac2fe0683f730062`。
- Worker：`echo-starry`；D1：`echo-starry`（`8437c865-d7f5-4efb-8c95-44ee3d3fdb21`）；R2：`echo-starry`；Web：**Workers Static Assets**（無 Pages）。
- 舊版參照 `yukidu/Echo-Starry`，專用舊 D1 `echoes_db`、舊 R2 `echoes-audio-bucket`，舊 CF 帳號 `611de84062006fe96fafd0cf157f2ec0`。

## 中央會員規格（以使用者最新指示為準）

1. 會員姓名、聯絡方式、頭像、個人基本資料等的**唯一主資料來源為繁星生態系中央會員 API**。預定其專屬 D1 名稱是 `id-starry`；API 仍由另一個工作流開發，尚未提供正式 OpenAPI、網址、驗證方式。
2. **本 App 的 `echo-starry` D1 不是會員基本資料庫**，只能存放自己的媒體內容與活動資料，例如 `central_user_id` 外部參照、播放進度、收藏、留言。
3. 不從舊 `users` 或 `auth_sessions` 匯入成新版會員主檔，不複製舊密碼、session token、OTP secret。
4. H-Global ↔ Starry 雙向個人基本資料同步與帳號關聯，由**兩生態系中央服務**在驗證雙方屬同一人、取得必要授權、處理衝突與稽核後進行。Echo 只消費 Starry 中央 API；嚴禁以相同姓名／Email／手機直接認定同一人。
5. API 尚未完成前採 fail-closed：登入、同步、會員特權、進度寫入均不可假稱成功。

## 舊資料移轉

- 來源包含約 112 筆音檔資料、8 個分類、72 筆舊會員基本紀錄，舊 R2 約 598 個物件／3.12 GB。
- 先將媒體 metadata 置入新 D1，設 `visibility='private'`、`migration_status='pending'`；新 Worker 只回傳 `public + verified` 內容，防止未驗證的 VIP／等級內容曝光。
- R2 完成實際複製、數量與大小／必要抽樣校驗、音檔可讀、原權限政策重新審查後，才能升級 verified。
- 舊環境繼續保留，未經遷移驗收**不可刪除或更改 DNS 路由**。
- 2026-10-28 決議：採 Workers Static Assets + 同一個 API Worker。先前建立的**空白 Pages 專案已刪除**，並未部署或綁定網域。網頁須完成 Expo SPA 編譯及 Workers Assets 上傳才能視為部署。

## 驗收清單

- [x] GitHub 組織新 repo 初始化
- [x] 新 D1 / R2 / Worker 資源建立
- [x] 刪除不必要的 Pages 空專案，改用 Workers Static Assets
- [x] Expo 跨平台程式基座建立
- [x] Echo 專屬 D1 Schema 初始化
- [ ] R2 檔案跨帳戶完整複製並驗證
- [ ] 舊音檔關聯、會員可見性與播放測試
- [ ] Starry 中央會員 API 正式契約與 Auth 串接
- [ ] H-Global / Starry 中央會員綁定與個資同步整合測試
- [x] Expo Web 編譯曾在 GitHub CI 驗證通過
- [ ] iOS / Android EAS 原生建置與四端實機／瀏覽器驗收
- [ ] Workers Static Assets 網站部署、域名切換

## 2026-10-28 自動化實際驗證狀態

- GitHub Actions TypeScript typecheck：**成功**，Run https://github.com/starry-phd/echo/actions/runs/40554709773 。尚未驗證 iOS／Android 原生建置或 Web 部署。
- 新 D1：112 / 112 筆舊音檔索引資料與 8 個分類已讀取匯入；112 / 112 筆舊 R2 物件鍵已記錄。所有資料 `migration_status='pending'`，正式核准 `verified=0`。
- 新 R2：**0 個物件**；來源 R2 共 598 個物件約 3.12 GB。跨帳戶 Super Slurper 工作尚未啟動；其臨時憑證清單複查均無殘留。
- 會員：舊 `users`／`auth_sessions` **沒有匯入**到 Echo D1；中央會員 D1 `id-starry` 由另一工作流負責，正式 API 仍待完成。
- Worker `echo-starry` 曾使用舊 `.mjs` 版本上傳；**TypeScript 候選實作目前只在 PR #1，未經部署驗證**。
- Pages 空專案已依 2026-10-28 核准方案刪除；現使用 Workers Static Assets。Web SPA 發佈、HTTP 端到端驗證尚待完成。
- 仍需完成媒體檔案轉移、權限校核、中央 Auth 契約及端到端測試，正式切換前不得改動來源。

## Workers Static Assets 統一部署

- Expo Web 使用 `web.output = single`，輸出 `dist/index.html` 與靜態資產。
- `wrangler.toml` 的 `[assets]` 綁定同一個 `echo-starry` Worker；`/api/*` 首先由 API Worker 處理，其餘由 Static Assets 提供 SPA。
- **不另建 Pages**；Cloudflare 官方推薦新網站採 Workers Static Assets：https://developers.cloudflare.com/workers/best-practices/workers-best-practices/ 。
- `npm run build:web && npx wrangler deploy`，驗證後才切換正式 DNS。發佈前需將所需 Cloudflare 授權安全存於 CI Secrets，禁止提交 API Token。
- 媒體資料未驗證與中央會員 API 未完成之前，公開清單保持為空，驗證前不得開放 VIP 或等級音檔。

## 2026-10-28 新版可驗證里程碑

- Cloudflare Pages 空專案已實際刪除；正式選用 Workers Static Assets。
- Expo Web SPA 成功產生建置壓縮檔，CI：https://github.com/starry-phd/echo/actions/runs/40558639832 。
- 更新 Worker API 程式並保留 D1/R2 binding。GitHub 另增 CI 自動測試及限人工觸發的正式部署工作流；未有 GitHub Cloudflare 安全授權，不得宣稱 Web Assets 已上線。
- 來源 R2 598 物件，共 3,122,987,926 bytes。交叉核對結果：新 D1 112 筆音檔 `audio_key` 對應來源 R2 **112/112 全數存在**，沒有遺失來源映射；但目的 R2 實際尚未完成複製，不可開放媒體。
- 中央會員主資料專屬 D1 預定名稱**`id-starry`**，不等於已建置或 API 正式驗收；Echo 本地只有外部參照，嚴禁直接複製中央會員基本個資。

## 本輪 DEV-I 技術規範轉換

- 候選 PR #1： https://github.com/starry-phd/echo/pull/1
- 後端 `.mjs` → `.ts`、OpenAPI 3.1／v1、共用 SDK、EAS Profiles、CI 測試。
- 完整工程核對表：`docs/05-dev-i-compliance.md`，技術決策：`docs/adr/0001-dev-i-stack.md`。
- 新增版本化 API 不代表未完成的 Starry 中央會員服務已上線；安全邊界維持原樣。
