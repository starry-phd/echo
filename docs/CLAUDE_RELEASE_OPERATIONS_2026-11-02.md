# Claude 交接附件 D｜GitHub、CI、Cloudflare 發布與安全驗收 SOP

**2026-11-02 接手前已實際核實的流程；每次開工及發布都必須重新 GET 即時狀態。**

導覽：[主交接](CLAUDE_DEV_HANDOFF_2026-11-02.md)｜[新舊全路徑](CLAUDE_OLD_NEW_PATHS_2026-11-02.md)｜[全需求與狀態](CLAUDE_REQUIREMENTS_STATUS_2026-11-02.md)｜[Issue #3](https://github.com/starry-phd/echo/issues/3)。

## 1. Repo、分支及唯一事實來源

- 新版可寫：`https://github.com/starry-phd/echo`；原版參考唯讀：`https://github.com/yukidu/Echo-Starry`；中央身份依賴：`https://github.com/starry-phd/id`。
- 交接前 main `fbb9596380cbaa5b37ff9850a6ffbe01fe2497fd`、`protected=true`、open PR=0；**新交接文件 PR 合併後，最新 main 必然不同**。不要直接把這個 SHA 用於下一批工作。
- 工程權威進度：[Issue #3](https://github.com/starry-phd/echo/issues/3)；每個完成批次留下 PR、branch、HEAD、merge SHA、main CI、Production run/job、安全原始日誌、Cloudflare Deployment/Version/時間/100%及限制，**再實際讀回剛寫的留言**。
- 交接前詳細 [comment #6568833120](https://github.com/starry-phd/echo/issues/3#issuecomment-6568833120) 包含 PR #141 最新上線；往前 #139～#140 [comment #6566862683](https://github.com/starry-phd/echo/issues/3#issuecomment-6566862683)；現有 Issue 目前有 100 多則跨迭代留言，**不得只看 Issue 首文或歷史摘要**。

## 2. 新版現行 Actions 工作流（實際路徑）

| Workflow | 路徑 | 是否可直接執行／限制 |
|---|---|---|
| **Echo App checks** | `.github/workflows/ci.yml` | push main + PR；主要 Gate，精確 SHA 成功才可合併／部署 |
| **Deploy Echo public Web shell to Cloudflare Workers** | `.github/workflows/deploy-worker.yml` | **只有**已成功的可信 `main push` CI 的 `workflow_run` 會進行自動部署；另有獨立受約束的手動 `workflow_dispatch`，**日常不需且不得雙重手動發布** |
| R2 安全搬移 | `.github/workflows/migrate-r2.yml` | 歷史已搬；不可再未經授權重跑／覆寫／刪舊資源 |
| 私人音訊稽核 | `.github/workflows/audit-private-audio.yml` | **未核准、不可啟動**：會處理私人音訊（高風險） |
| R2 probe | `.github/workflows/probe-r2.yml` | 視實際動作權限判定；不要為驗收偷偷 GET 私人音訊 |

**審查前**先檢查真正分支保護與 required checks 的目前狀態。過往已驗證 protected main、PR＋CI＋up-to-date＋conversation resolution 等保護；過去 ruleset 審批設定變更過，**不能假設現在要求／不要求某特定 reviewer**，也不得變更保護規則來合併。

## 3. 開發 PR 的標準操作順序

1. 官方 API／`git fetch` 查 `main` SHA、protected/open PR、目前進度與 Cloudflare latest。若已有其他 AI 的 open PR，先檢查是否重疊，不可互搶檔案或繞過 merge queue。
2. 從**當前真實 main** 新建語意明確分支，例如 `feat/public-verified-ui-YYYYMMDD`；讀原版 source + 最新有效 CSS；先寫**有界需求和安全 negative case**。
3. 一次完整 PR 可包含程式、原版來源證據、文件和測試。**先 Draft**，不要一邊 CI 紅一邊合併。
4. 只接受針對 **PR exact HEAD SHA** 的最近一次完成 `conclusion=success`。舊 HEAD 或 cancelled/failure 不算；修正程式/測試後必須重新跑全量，不能只引用以前成功的 CI。
5. 確認 PR mergeable，Ready，正常受保護 **squash merge**，不可使用 Admin bypass、direct push to main、force push、手動編輯部署版 SHA 或修改 CI Guard。
6. 合併得到新的 **40 字 main SHA**，等待 `main push` 的 Echo App checks **同 SHA** success；**此期間不要先合併下一批**。
7. 核對只有**既有自動 `workflow_run` Production** 對應這個 main SHA 成功；請讀 Job 原始 Log，而非只看綠色 badge。無法驗證需報「合併但未驗收正式部署」，不能發布完成訊息。
8. Cloudflare 官方 GET `echo-starry` Worker **latest** 和新 Deployment **exact id**，皆確認同 version **100% traffic**；再 GET `echo.starry.phd` domain，仍是舊 `temp-starry-echo-bridge`；最後再查 GitHub main protected 和 open PR。
9. 更新 Issue #3 清晰紀錄，讀回確認，才能開始下一批或對外說「完成正式部署」。

**重要**：PR CI 可能需要幾分鐘；不應瘋狂輪詢 GitHub 耗盡限額。CI red 時先讀 job 原始 error，修復來源；不得為掩蓋問題關閉 ESLint、測試或安全守衛。#141 開發初曾遇 `require()` 違反 no-require-imports，已改 typed PNG `import`；也修復一項測試抓取 JSX 區段錯誤，**兩次紅燈只在 Draft branch，最終 HEAD 430/430 全綠才合併**。

## 4. 可在有權限的 Claude Code 工作區執行的本地程式檢查

在**已 Clone 新 Repo**、有 Node/npm 且依 Repo README 設定環境的工作區，按 package.json：
 
```bash
npm install --no-audit --no-fund
npm run typecheck
npm run lint
npm run expo:doctor
npm run api:check
npm run monetization:check
npm run release:guard
npm run staging:check
npm run ui:check
npm test
npm run build:web
npx --yes wrangler@4 deploy --dry-run --outdir .wrangler-dry-run
```

CI `.github/workflows/ci.yml` 還會在只配置**公開** `EXPO_PUBLIC_ECHO_API_BASE_URL=https://echo-starry.starry-phd.workers.dev` 的條件下執行 **iOS/Android Hermes JS unsigned export**（`npx expo export --platform ios`、`--platform android`），並上傳 Web dist artifact。**絕不可在 CI 偷做 EAS signed build 或實際 App Store/Google Play submit**。

- TypeScript/ESLint/API Contract/安全守衛全須成功；不要把 Expo Doctor 要求版本改成錯誤僅為消除警告。
- `npm test` 實際呼叫 `node --import tsx --test tests/*.test.mjs`；在 PR#141 合併前為 **430/430**，未來需依新程式實際數字。
- 根目錄 `package.json`、`app.json`、`starry.app.json`、`tsconfig.json`、`wrangler.toml`、`eas.json` 是不能隨意推斷的真實設定。
- 有些 Github Actions 流程帶有既有歷史 `workflow_dispatch`；**勿自行啟動新 Production**。日常 Merge 後的合法 auto release 優先。

## 5. Production 自動工作流實際安全條件

`.github/workflows/deploy-worker.yml`（2026-11-02 官方讀回）目前：
- `on.workflow_run` 限 `Echo App checks` **completed**，deploy Job 的 `if` 另外要求 `conclusion=success`、原 CI `event=push`、`head_branch=main`、原 Repo = 現 Repo。**PR CI 自身觸發的 workflow_run 會 skip，不是另一個 Production。**
- 仍支援**單獨明確人工流程** `workflow_dispatch`，需從 `main`、填精確 `approved_commit` 40 字 SHA 與確認字串 `DEPLOY-ECHO-STARRY-PRODUCTION`；日常不可為加快驗收重複觸發。
- Job 使用 `environment: production`、`concurrency.group: echo-starry-production`、`cancel-in-progress:false`；實際 Environment required review 以 GitHub 設定為準，不由 YAML 推測。
- 強制 checkout **成功 CI 的 exact head SHA**，檢查 `git rev-parse HEAD`、`git ls-remote origin refs/heads/main` 均同 SHA；並在 Wrangler upload **前再驗證一次**，避免 main 被別的 PR 更新時部署過期版本。
- `starry.app.json.lifecycle.productionAuthorized=true` 只是現有 Web shell release Gate，**不是** signed app、音訊公開、Ads 或會員功能永久授權。
- 使用 GitHub Actions Secret `CLOUDFLARE_API_TOKEN`，**不要索取、列印或提交秘密**；部署指向 `echo-starry.starry-phd.workers.dev`，透過 `wrangler@4 deploy` 一次上傳 Workers **與** Expo Web `dist/`，不透過另建 Pages。
- POST-deploy 首頁、`/api/v1/health`、`/api/v1/catalog`、`/api/v1/speakers` 與未授權 track 404 確認成功，然後必須執行 `scripts/check-production-guest.mjs`。

## 6. Production 真正必過的 4 個資料安全檢查

以下只用**已核准的公開 preview metadata／封面**和**未授權請求的拒絕結果**做 HTTP 測試，不下載或讀取私有音訊：

1. `/api/v1/previews` 返回 **28 metadata-only cards**，`policy=2` 與 `Cache-Control: no-store`。
2. **28/28** 公開核准 cover URL 可取得，均 `no-store`；不包含任何私人 audio 資料讀取。
3. **28/28** guest 音訊 `HEAD` 必須 **404/no-store**，不得下載音訊，也不能將回應改成200/206來讓 UI 看似可播放。
4. 未授權 private audio 與 unlisted cover 必須 **404/no-store**。資料、token 或未核准 key 不可寫入 Issue/log/artifact。

**最近可信原始 Job log**：Production #41386551526，job #125088545444，main SHA `fbb9596380cbaa5b37ff9850a6ffbe01fe2497fd`，四段字樣全部存在。新 PR 必須重新在相應 Job log 看四項；不存在就不算驗收通過。

## 7. Cloudflare 正式驗證的必要順序

- 正式帳號 ID `9ff1b4c261141730ac2fe0683f730062`。
- 先 GET `/accounts/{account_id}/workers/scripts/echo-starry/deployments?per_page=2`，再用回傳的 latest Deployment ID **GET exact** `/accounts/{account_id}/workers/scripts/echo-starry/deployments/{id}`。應核對 version_id 完全相同與 `percentage=100`。
- 再 GET `/accounts/{account_id}/workers/domains?hostname=echo.starry.phd`，必須看到其 service **仍是 `temp-starry-echo-bridge`**，除非使用者已另行正式核准切換且完成全部資料與商店 Gate。
- **交接前的時間快照**：Deployment `b2d62747-ef1c-4c90-88f9-96a335bab811`、Version `1b3612f2-bee2-4970-9f18-2acc9f038977`、100%、UTC `2026-11-02T04:07:51.65564Z`，僅可作比較基準，不能當下一 PR 的最新證據。
- 不用 Cloudflare API 直接 upload 跳過 GitHub Environment、CI 或 PR Gate；沒有連線／無法驗證時明示 BLOCKED。
- **2026-11-02 起（docs/129）**：唯一自動 Production 會在 guest smoke 後以既有 Token 唯讀 GET latest＋exact deployment 與 `echo.starry.phd` 綁定，結果直接寫在 deploy job 原始 log（`Cloudflare latest == exact deployment ...`、`Cloudflare custom domain ...`）。接手者若沒有自己的 Cloudflare 權限，可引用該兩行作為本節證據；網域行若為 `UNVERIFIED` 必須如實記錄。

## 8. 失敗與衝突時的保護策略

- 發現衝突 PR 或 main SHA 改變：**停止合併與部署**，重讀最新 Issue，再安全 rebase／重跑 exact HEAD CI，不可 deploy 不匹配 SHA。
- CI 失敗：先下載**那個 commit 的真實 job log**找原因；保持 Draft，修正後重新跑。絕不以關閉測試／降版本／變更 branch protection 達標。
- R2/Starry ID/Auth 依賴缺失：標明未完成的資料權限、API、核准人與阻擋問題。**不可以假會員、假 Token、舊 D1 密碼/session、相同 Email 自動綁定**。
- 創建新的 Domain、Worker、D1、R2、AI/廣告服務、付費資源或簽名商店提交：**不在目前授權範圍**，需要獨立 owner 批准。
- 私人音訊：112 件保持 private/copied/0 verified；**絕不 GET/下載/解碼/稽核**，只驗證 404。不得為做 E2E 故意降低拒絕限制。
- 記錄高風險測試需要使用者選擇、合法資料與明確授權，而不是自行建立可識別個人真資料或外傳。

## 9. 最終交接 Issue #3 格式（每批填真實值）

- **工作**：原版唯一來源路徑和版本、目前新版路徑、產品差異、修改檔／測試檔／Docs；
- **身份/資料安全**：此功能是否涉及 member/private/Ads/payment，如何 fail closed；
- **PR**：URL、branch、exact HEAD SHA、full PR CI run + conclusion + 真實 tests/pass/fail；
- **main**：Protected merge method + exact squash SHA + main push CI run/conclusion；
- **Production**：唯一 auto `workflow_run`、exact SHA、Job ID/conclusion、4 個正式 guest smoke 原始 log；
- **Cloudflare**：Account、Worker、latest + exact Deployment ID、Version ID、100% 流量和 UTC 時間、舊 domain service unchanged；
- **結尾**：受阻／未測的原生、瀏覽器與權限項，後續接手可行工作；最後**讀回 Issue comment** 確認實際寫入。

## 10. 最需要保持清楚的開發邊界

GitHub 純 PR/CI 成功不代表正式上線；Cloudflare Worker 100% 不代表 App Store 上架；GitHub 112 R2 複製成功不代表合法播放；28 metadata-only 卡片不代表授權；舊站 PHP／Vite/Worker Auth 和 Starry ID 草案不代表新中央 Auth 已上線；營利 Provider 選定不代表可以請求廣告、賣產品或開 RevenueCat Entitlements。

本手冊是讓 Claude 快速開始**真正可驗證的安全開發**，不是賦予超出業主與合規限制的帳號管理、資料存取或付費資源權限。
