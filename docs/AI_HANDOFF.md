# 繁星回聲 Echo Starry｜GitHub 唯一 AI 任務交接入口

**更新日期：2026-10-29（台灣）**  
**交接狀態：程式開發中；不等於正式部署、App Store／Google Play 上架或所有舊功能移植完成。**  
**唯一實際工程來源：** https://github.com/starry-phd/echo  
**原始舊版參考：** https://github.com/yukidu/Echo-Starry （不得擅自改寫、刪除）  

## 0. 新 AI 接手時先做

1. 先讀本檔，再讀 README.md、docs/adr/0002-starry-v13-framework.md、docs/05-dev-i-compliance.md、docs/07-legacy-ui-parity.md、docs/09-r2-migration-acceptance.md、starry.app.json 與最新 OpenAPI。
2. **先查 GitHub main 最新 SHA、所有 open PR 與各自的最新 CI Run。** GitHub 可能已被其他 AI 更新；本檔快照時間點後的現況須以實際 GitHub 查核結果為準，禁止憑舊聊天或手動勾選聲稱完成。
3. 如果 PR #11 仍存在，優先繼續該 PR，避免重新開同題 PR、重做已完成工作或直接寫 main；依防封鎖 SOP 保守操作，遇限制／停權立即停止。
4. **不可未經本次明確授權更新 Production、DNS、商店、付款、正式權限、既有 Cloudflare 媒體可見性或購買方案。** 即使 CI 成功也不代表可發版。
5. 往後只更新 GitHub 的程式、PR、CI、ADR 與本交接檔；新對話僅需 GitHub repo 和本檔連結，不必再依賴上一個 ChatGPT 對話全文。

## 1. 權威規範及使用者已定的方向

- 2026-10-28 Starry 生態系共用技術基座候選版／更新的 v1.3 定案：以 **React Native 0.88 + Expo SDK 58 + Expo Router + TypeScript strict** 為 Echo 現行基線；Worker 用 **TypeScript + Hono + Zod**、OpenAPI 3.1，Expo Web 為 Echo 的選配。
- 第一波 DEV-I、DEV-G、GitHub AI 自動化防封鎖 SOP 是工程流程護欄；必須區分 **規劃／實作／測試／正式部署／商店上架**。
- 以 **舊 Echo 品牌畫面為 UI 基準**（玫瑰主題、24 色主題、手機優先 320–430px、搜尋、4 篩選按鈕、音檔卡片）；不得因換框架擅自重設計成另一款藍紫 App。
- Echo 屬 Starry；H-Global 與 Starry 的 Cloudflare、會員 Auth、D1、Secrets、金流及管理權限必須隔離，不直接讀寫他方資料。
- 中央 Starry ID／Auth、Battery、Billing 的業務真相由各自專責服務維護；Echo 只透過核准的版本化 API 接入。中央會員 D1 預定 id-starry，**不是 Echo 的 echo-starry D1**。
- **Google AdMob Mediation 已選，Ads OFF；RevenueCat 為 Billing 方向，但真 SDK 未初始化、商店交易未驗證；禁止自行啟用廣告或假稱付費權益已生效。**

參考權威 Google 文件（供追溯，日常任務狀態以 GitHub 記錄）：
- https://docs.google.com/document/d/1wHBuIJCA1cMhLcI25MR_EYEdgmpXmzXx_D0UlEWHBAQ
- https://docs.google.com/document/d/1dsMcGBT5PO43aQVMhZOBO5uyNTE8QHYSnBmC4y2rMSI
- https://docs.google.com/document/d/1yEhoMtLL-WN8r-AOPl66tyQCuH3cOukh_CD3bOYgnCA/edit
- https://docs.google.com/document/d/1o9luZIfaeMVBVT5XWD4fSiFHtG3F-viqNbsjmtoq_Cw/edit

## 2. 此次交接時的 GitHub 事實快照

- **main 最新已查證 SHA（打包前）：** 5d2b38931a27e0ea6fcc2a46d31e217dde063a0d。
- **main CI 已成功：** https://github.com/starry-phd/echo/actions/runs/40749742453
- **最新安全修正 PR #11：** https://github.com/starry-phd/echo/pull/11
- PR #11 分支：fix/dev-i-release-safety-20261029。打包前 PR 仍是 **Draft／未合併**，起始變更 SHA 57fa07cf1845e775e7f83401f9127a3976248f79。PR 新提交會改變其 SHA，請一律重查。
- PR #11 首次 CI Run：https://github.com/starry-phd/echo/actions/runs/40752050224 （打包檢查時仍 in_progress；後續若有取消／新 Run，應核對**最新 SHA 的 Run**）。
- 以前已合併的 DEV-I 初版 PR：https://github.com/starry-phd/echo/pull/1；後續多輪 PR 已更新至 Expo 58／v1.3，故不能以 PR #1 的老狀態當作目前程式。
- 2026-10-28 19:07 UTC 前後其他 AI 也有提交，**禁止無視並行變更或強制覆蓋 main**。

## 3. 已建置與已驗證

| 項目 | 狀態與來源 |
|---|---|
| Expo 58 / RN 0.88 + TypeScript / Expo Router | 已在 main，package.json／app.json，CI 成功；**不等於 iOS/Android Build 成功** |
| Web Expo 靜態輸出 + Worker bundle | 已經 CI build:web、Wrangler dry-run 成功；**不等於 Workers 正式站已部署** |
| TypeScript Worker / Hono / Zod、D1 / R2 綁定 | 已在 main，worker/index.ts、wrangler.toml |
| OpenAPI v1 / TypeScript SDK | openapi/echo-public.v1.json、packages/echo-api-sdk、scripts/check-openapi.mjs；中央 Auth 仍待對接 |
| Expo Doctor / Lint / Tests / CI | .github/workflows/ci.yml；生成型別使用 tools/openapi-codegen 的 TS 5.9 隔離工具，root 遵循 Expo 的 TS 6 |
| 舊版 UI 基礎還原 | packages/ui、src/ui/echo、app/index.tsx、src/ui/responsive.ts；無實機畫面比對，不能稱像素級完成 |
| R2 跨帳戶私有搬遷 | 搬遷 Workflow：https://github.com/starry-phd/echo/actions/runs/40742932810；目的 596 個有內容檔案約 3,122,987,926 bytes，來源 598 個含兩個空佔位；已對齊 key／size／ETag 索引，**非全量 SHA256／播放驗證** |
| 新 D1 音檔索引 | 112 筆、音檔鍵均找到目標 R2，**全部 copied + private；verified=0、public=0**；資料不等於授權播放 |
| 廣告／付費安全鎖 | starry.app.json：Ads OFF、尚無真 Ads/IAP SDK；正式發版／商店授權均為 false |

## 4. PR #11：發布安全修正（當前首要工作）

本 PR 有實質修改而**尚未經人工核准合併**：

- .github/workflows/deploy-worker.yml 原本有 release/echo-v13-owner-approved push 觸發 **正式部署的風險**；PR 改成 **workflow_dispatch 唯一入口**。
- 正式部署必須選 main、輸入完整核准 commit SHA 與指定確認文字；Workflow 驗證 event/ref/HEAD SHA。
- starry.app.json 仍為 lifecycle.productionAuthorized=false，部署工作流會拒絕真正上線。**切勿因測試需要將之隨意改成 true。**
- .github/workflows/probe-r2.yml 改為純手動，避免 push 導致再次讀取私人音檔。
- CI 新增 release:guard（scripts/check-release-safety.mjs），驗證上述靜態安全門檻與 Ads OFF。
- docs/04-deployment.md 和 R2 驗收文件修正過期的 pending 說法，避免和 copied/private 真相衝突。
- **下一位 AI 應先驗證 PR #11 最後 commit 的 CI、核對差異與 GitHub Environment 保護；未獲人工審閱核准，不要自行合併。**
- **在 PR #11 合併前，main 仍保留舊版 release branch push 部署觸發。** 不可推送該發版分支，這是風險警告而非建議執行。

## 5. 仍待完成：依實際阻塞排序

1. **P0 合併前安全審核：** 驗證 PR #11；確認 CI pass、Production GitHub Environment 的審核規則／最低權限 Secrets；必要時修正 PR，不要直接手動觸發部署。
2. **P0 私有影音的最小權限：** 使用手動的 R2 私有格式／解碼抽樣及裝置測試，對舊素材逐項檢查可公開權利。31 筆「免費瀏覽候選」也**不能**視為 31 筆已核准免費播放。請看 docs/09-r2-migration-acceptance.md。
3. **P1 staging／preview 隔離：** 用 Starry 專屬的 staging D1/R2/Secrets 和非正式 URL，確認不可指向 production DB；新增實際 Preview 與 HTTP smoke tests。先定安全方案，不憑空聲稱資源已存在。
4. **P1 iOS／Android：** 使用 Expo EAS development builds，取得真實 Build IDs、簽章與實機 UI／音訊測試結果；EAS 設定存在不代表 build 成功。
5. **P1 舊 UI 對齊：** 以舊 repo 原版截圖對照手機 390×844、桌機 1440×900，依 docs/07-legacy-ui-parity.md 逐頁還原，不自製肖像、評分或可用內容。
6. **P1 中央會員：** 等獨立 Starry ID 的正式 OpenAPI、授權及 scopes；Fail Closed，禁止沿用舊 login/token、不得把私人音訊改公開；Battery／Billing 一樣不可自行造假端點。
7. **P2 功能補齊：** 依 docs/06-legacy-feature-inventory.md 規劃講師專頁、搜尋與詳情逐頁比對、收藏／進度、上傳、AI 等需身份／商業契約的功能，區分已核准與候選。
8. **P2 P07／P09：** 完成真實健康、P95／錯誤率、報警與回滾演練，以及 commit／CI／EAS／Cloudflare／商店的發布證據；不得把預估數值當實際。

## 6. 嚴格禁止與工作規則

- 不得改動或刪除舊版 Echo 原始資料與網域，不得改兩品牌中央資料庫。
- 不得擅自公開任何舊音檔、對外建立分享 URL、解除會員／VIP／貼紙權限。
- 不得擅自啟用 AdMob、RevenueCat 收款、真實 SDK、付費方案或商店送審。
- 不得以 CI PASS 說成正式部署；不得因「繼續」二字推定無條件的正式部署核准。
- 依第一波 GitHub AI 合規與防封鎖 SOP：低頻、去重、單一工作 owner／Branch、不要快速連續建 PR、不要使用其他帳號規避任何限制。
- 遇文件矛盾，先引用主規範、實際 source 與驗證證據；若牽涉用戶未裁決的業務權限，列「待業主決議」，不要悄悄改條件。
- 編輯本文件時，把「已完成」「未完成」「CI」「部署」「阻塞」「下一步」及對應 PR／commit／Run 分清楚，不留下矛盾的老狀態。

## 7. GitHub 交接更新方式

- **唯一長期交接入口：docs/AI_HANDOFF.md**；工程真相仍以 Repo 檔案、PR、GitHub Actions、Cloudflare／EAS 可核實證據為準。
- 新任 AI 在每次開工前：讀取本檔 + 最新 main/PR/CI；只在授權範圍新增功能 Branch/PR，附測試結果。
- 每次任務完成後：更新本檔的事實快照、目前未結 PR、通過的 Commit/Run、確定的阻塞和下一步，與程式改動同一 PR 提交；合併後才視為 main 已更新。
- 同一事項不可同時由多個 AI 改同一文件；有並行改動先拉取最新 SHA 再整合。

### 新對話最短接手指令

「請接手繁星回聲 Echo Starry，GitHub 唯一任務交接來源是 https://github.com/starry-phd/echo/blob/fix/dev-i-release-safety-20261029/docs/AI_HANDOFF.md（PR #11 合併後改讀 main）。先讀完整文件、核對 GitHub main 最新 SHA、open PR、CI、實際部署，再依 P0/P1 未完成事項接續，不必要求我重新講歷史。遵守 DEV-I／v1.3／GitHub SOP；正式環境、音檔公開、會員與商店操作一律另需當次核准。只報告真實 GitHub 進度與下一步。」
