# 繁星回聲｜GitHub 唯一任務交接入口（AI HANDOFF）

**狀態快照：2026-10-29（台灣時間）** ｜ 專案：Echo Starry／繁星回聲 ｜ 範圍：\`starry-phd/echo\`。

> **新對話接手，先讀此檔，然後即時核對 GitHub main、PR、Actions 與 Issue #3。**
> 本檔是「有版本的交接摘要」，不是宣稱此刻雲端狀態不變；一切驗收必須能追溯到 GitHub commit／CI、Cloudflare 部署或 EAS／Store 真實記錄。禁止依聊天摘要推定部署已完成。

## 0｜固定交接規則

1. **GitHub 為單一持久工程交接來源**：實際程式碼、branch、PR、CI、技術文件、風險與下一步任務，皆以此 Repo（必要時各獨立服務 Repo）版本化。ChatGPT 對話只負責執行指令與回報，不是持久進度庫。
2. **目前 Echo 執行任務統一追蹤**： [Issue #3 — Release Gate](https://github.com/starry-phd/echo/issues/3)。既有任務不要重複建 Issue；每項 PR 應關聯既有 Issue，明列具體變動、測試、Commit 與仍未完成項目。
3. **架構／產品規範**：本 Repo \`starry.app.json\`、\`docs/adr/0001-dev-i-stack.md\`、\`docs/adr/0002-starry-v13-framework.md\`，以及已獲業主核准的 DEV-I／Starry v1.3 決議。Google Docs 仍可追溯規範來源，**但工程實況及跨對話交接一律回寫 GitHub**。v1.0 候選文件或舊聊天不得推翻較新的明確決議。
4. **新工作**：先核對 main SHA、未合併 PR 與 Issue #3，然後以 branch → PR → CI／安全測試 → 審閱／核准 → **經授權**部署；不要直接推斷 PR 成功等於正式上線。
5. **合規與節流**：依《第一波｜GitHub AI 自動化開發合規與防封鎖 SOP》，單一身分寫入序列化、避免重複 PR／CI／秒級輪詢；遇到 403 停權／限流必須停止並正確分流，不跨身分規避。

## 1｜最新可驗證工程狀態

| 範圍 | 已驗證事實 | 依據與限制 |
| --- | --- | --- |
| Repo / main | \`starry-phd/echo\`，**快照 main \`5d2b38931a27e0ea6fcc2a46d31e217dde063a0d\`**。 | [main](https://github.com/starry-phd/echo/tree/main)。接手時重查 SHA。 |
| 技術底座 | Expo SDK **58**、RN **0.88**、Expo Router、TypeScript strict、React Native Web；Worker TS、Hono、Zod、OpenAPI 3.1、TanStack Query、版本化 SDK／UI 套件。 | \`package.json\`、\`starry.app.json\`、\`worker/index.ts\`、\`packages/\`、\`docs/adr/0002-starry-v13-framework.md\`。 |
| 原生 iOS / Android | \`eas.json\` profiles 已存在；**無真實 EAS Build／實機簽署／商店核准驗收記錄**。 | Expo Doctor／Web CI 不等於原生建置或商店上架。 |
| Web Production | **已部署** Workers Static Assets + 同一 Worker 的公開 API，Web URL： https://echo-starry.starry-phd.workers.dev/ 。 | [部署及 HTTP Smoke 成功 Run 40750080517](https://github.com/starry-phd/echo/actions/runs/40750080517)；發布 commit \`e599b92d231401748a2f403fe5211960fbcba2db\`；Cloudflare deployment \`a7659b36-5be3-4e86-a0e8-ce154357a164\`，Worker version \`ba207821-71e5-4169-a985-4611e874ab19\`。**部署版 SHA 與 main SHA 不可混淆**。 |
| 主分支 CI | 最近核實的 main CI 成功。 | [Run 40749742413](https://github.com/starry-phd/echo/actions/runs/40749742413)。最新提交須另查 Actions。 |
| 媒體 R2 搬遷 | **複製完成，未公開**。來源 598 個物件含 2 個空目錄標記；目的 596 個有效物件，共 3,122,987,926 bytes。 | [搬遷 Run 40742932810](https://github.com/starry-phd/echo/actions/runs/40742932810)、\`docs/09-r2-migration-acceptance.md\`；來源未刪除。 |
| Echo D1 媒體 | 112 個有 audio_key 的音檔已對應 R2；**112 copied／112 private／0 verified／0 public**。 | Issue #3 最新進度及 \`docs/09-r2-migration-acceptance.md\`；copied 不等於已授權播放。 |
| 私有音檔抽樣 | M4A、MP3、舊 .aac 三個完整私人樣本的 ffprobe 音軌辨識與前 8 秒 ffmpeg 解碼通過。 | [Run 40749742453](https://github.com/starry-phd/echo/actions/runs/40749742453)；**不是**全部 112 筆實機播放或全量雜湊驗證。 |
| 原版功能/UI | 已移植公開清單、搜尋、講師路由、單筆公開音檔 API、舊版玫瑰主題與手機優先 UI 基礎。 | \`docs/06-legacy-feature-inventory.md\`、\`docs/07-legacy-ui-parity.md\`；尚未逐頁截圖／真人設備做完整等價驗收。 |
| Starry ID / Battery | **正式介面尚待專責服務契約與端到端驗證**；Echo 只預留 Client 插槽，不擁有會員主檔。 | 中央 ID D1 規劃 \`id-starry\`，**不表示已完成服務**；不可沿用舊 Auth、密碼或 session。 |
| Billing / Ads | RevenueCat 已選為預定 Provider，SDK 未初始化、沒有真實 IAP 驗收；Google AdMob Mediation 已定案，但 **Ads OFF／無真 SDK／無廣告請求**。 | \`starry.app.json\`、\`packages/billing-core\`、\`packages/ads-core\`；不可描述為已營運或已收款。 |

### 進行中的重要 PR（接手務必先查）

- **[PR #11 — 正式部署／私人 R2 安全門檻](https://github.com/starry-phd/echo/pull/11)**：截至快照為 **OPEN / DRAFT、未合併**，Head SHA \`57fa07cf1845e775e7f83401f9127a3976248f79\`；[PR CI Run 40752050224](https://github.com/starry-phd/echo/actions/runs/40752050224) **Success**。它預備移除 \`deploy-worker.yml\` 在 release 分支 push 時可能自動部署的觸發，改為人工 dispatch、main HEAD / SHA 驗證與 \`release:guard\`。**CI 成功不等於已合併或環境防護已生效。**
- \`starry.app.json\` 目前 \`lifecycle.productionAuthorized=false\`、\`storeSubmissionAuthorized=false\`。即使正式 Web 曾部署成功，**這不構成下一次 Production／商店操作的自動授權**；每次須查本次核准及 Github Environment 保護。
- 本 Repo \`.github/workflows/deploy-worker.yml\` 在主分支快照仍有 \`push: release/echo-v13-owner-approved\` 觸發，**優先完成 #11 安全審閱**。在合併及檢查保護措施前不得再用舊 release 分支自動發布。

## 2｜接續任務（優先序）

- [ ] **P0：審閱及驗收 PR #11 安全門檻**：核對 CI、觸發條件、production Environment 審批、手動 SHA Guard；需符合業主核准流程才合併。合併後確認 main 及實際 workflow 設定，不自動觸發 Production。
- [ ] **P1：媒體權利逐筆確認**：舊 guestVisible=33 **僅是訪客清單標記，不等於播放授權**；保守挑出 **31 筆可能免費候選**，仍須逐筆確認內容授權、來源和實際播放權利。未核准一律保持 private/copied；不可一次把 112 筆轉 public/verified。
- [ ] **P1：安全媒體驗收**：至少針對 M4A／MP3／AAC 及已核准候選做更完整位元組校驗／實際 iOS／Android 播放；保持 R2 公開存取 OFF；不得讓未授權音檔經列表、分類、直鏈或 Range 繞過。
- [ ] **P1：Starry 中央會員正式 API 串接**：先取得專責服務的 OpenAPI／Auth scopes／session revoke／停權契約，再做身份／收藏／進度／VIP；會員個資主檔不得進 Echo D1。Battery 僅接正式核准介面。
- [ ] **P2：EAS iOS／Android**：確認 Expo project、帳號、憑證／Bundle ID、development build、實機與商店 Sandbox；附 build IDs 和執行證據，不自動送審。
- [ ] **P2：視覺與功能驗收**：手機 320–430px 為優先，平板／桌機其次；比對原版品牌 UI 截圖、搜尋／單筆音訊／講師導覽，補缺漏（會員、貼紙、收藏、播放清單與內容）時逐項核准。
- [ ] **P2：營利預留整合**：RevenueCat / StoreKit / Play Billing 後端正式權益驗證、分 App SKU 與 Sandbox；AdMob 保持 OFF，只有業主另行核准才做 SDK/廣告投放。
- [ ] **P2：可靠性**：建立 staging/production 真正隔離與回滾、部署版本對照、健康監控／P95／錯誤率／告警、R2/D1 復原演練及必要成本記錄。未有測試不能填「完成」。

實作過程始終更新 [Issue #3](https://github.com/starry-phd/echo/issues/3) 的**最新置頂狀態**或本文件；不要累積互相矛盾的「最新」摘要。各功能需具 owner／驗收／PR／CI／部署版本與下一步。

## 3｜不得越界的固定限制

- **H-Global 與 Starry 完全分離**：正式 Cloudflare／D1／R2／Auth／Session／Secrets／商家／商店帳號不可混用；跨系資訊只能經雙方驗證、本人明確同意及受保護 API。
- 舊來源：\`yukidu/Echo-Starry\`、Cloudflare 舊帳戶及 R2/D1 **保留**。不刪舊資料、不改 DNS、不覆蓋正式服務。
- Echo D1 只持有 Echo 媒體／業務參照；不直接讀取或複製 \`id-starry\` 中央會員主檔。
- 只可讀取經驗證 **public 且 verified** 的公開影音；私人／會員／貼紙／獎銜內容未獲核准時一律 fail closed。
- API Token、S3 Key、Client Secret 只可放在獲授權的 Secrets 機制，禁止貼聊天、Issue、Commit、PR、日誌。
- 不默默增加收費／開通廣告、不新增商店商品、不提交商店、不在未核准時部署 Production。
- 不為了工程便利將原版玫瑰色 UI 重設成新產品；新技術不等於要改品牌設計。

## 4｜從 GitHub 取得最新真相的順序

1. 讀這份 \`docs/AI_HANDOFF.md\`，以及根目錄 \`starry.app.json\`、\`package.json\`、\`wrangler.toml\`。
2. 查 [main 最新 commit](https://github.com/starry-phd/echo/commits/main)、[OPEN PR](https://github.com/starry-phd/echo/pulls?q=is%3Apr+is%3Aopen)（先看 #11）、[Actions](https://github.com/starry-phd/echo/actions) 與 [Issue #3](https://github.com/starry-phd/echo/issues/3)。
3. 詳讀 \`docs/09-r2-migration-acceptance.md\`、\`docs/07-legacy-ui-parity.md\`、\`docs/adr/0002-starry-v13-framework.md\`、\`.github/workflows/\`。
4. **注意舊文件存在歷史段落**：\`docs/03-r2-migration.md\`、\`docs/04-deployment.md\`、\`docs/06-legacy-feature-inventory.md\`、\`docs/05-dev-i-compliance.md\` 中可能有「R2 尚未搬遷／Web 尚未部署／Expo 57」等早期敘述。**按日期、證據與新決議核對，不得把過時段落覆蓋新事實**。
5. 若要更動 Starry ID、Battery、Billing 或 H-Global，先去該專責 Repo 讀其正式契約與核准範圍；**本 Echo Repo 的交接不授權操作其他模組的正式資料**。

## 5｜新 ChatGPT 對話直接使用的接手指令

> 請接手「繁星回聲」新架構移植工作。GitHub \`https://github.com/starry-phd/echo\` 是唯一持久工程交接來源。**先完整讀取 \`docs/AI_HANDOFF.md\`、\`starry.app.json\`、Issue #3、所有未合併 PR（尤其 #11）、latest main SHA 和 CI／部署證據**，再依 DEV-I 與 Starry v1.3 核准規範接續開發。不得引用舊聊天作為實際部署證據。請優先處理安全門檻、R2 私有權限與 EAS／中央會員依賴。採 Branch → PR → CI → 審閱／核准 → 必要時部署，每輪把決策、進度、已完成、未完成、風險、commit／Actions 證據和下一步更新回 GitHub。Starry/H-Global 隔離、舊資料保護、Ads OFF、不擅自啟動 Production 或商店上架。

## 6｜本交接包的更新規約

每次新對話完成一個**具體實質里程碑**，在同一 GitHub Repo 透過 PR 更新本文件：日期／main SHA／實際雲端版本／證據連結／是否部署／已完成／未完成／新阻礙／下一位 AI 優先事項；不要為每一句狀態創建新 Issue 或 PR。當全局狀態與特定 Issue 不一致時先核查證據，必要時修正，而非自行推測。

**結束新對話只須留下 GitHub 連結，不再另做長篇聊天交接包。**
