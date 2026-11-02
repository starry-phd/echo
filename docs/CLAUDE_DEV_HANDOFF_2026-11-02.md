# Claude AI 完整開發交接｜繁星回聲 Echo Starry App

**版本：2026-11-02｜跨 AI 轉移專用｜工程／需求／安全／部署完整交接**

> **目的**：使用者把繁星回聲 App 後續開發交給 Claude AI／Claude Code。Claude 應以**舊版原始程式與最後有效 CSS 作功能、設計參照**，在已建的 React Native + Expo 新版繼續開發。**不重新開案、不重建資料庫、不將舊站登入/音訊/管理權限複製到新站、不隨意改 DNS。**
>
> **附件 B**：[新舊 Git 全檔案路徑＋52 組功能對照](CLAUDE_OLD_NEW_PATHS_2026-11-02.md)，列出交接前 Git tree 的**舊版 607 個、新版 381 個**全部受版控檔案路徑；兩棵樹 `truncated=false`。此清單是交接前 SHA 快照；新交接 PR 合併後，須再查新版 main 才會包含新寫入的交接文件。
>
> **事實來源順位**：最新明確使用者指示／安全核准與合規要求 → [Issue #3](https://github.com/starry-phd/echo/issues/3) 最新留言及實際 main、PR、CI、Cloudflare → GitHub 目前程式碼和可重現測試 → 最新技術規範／已核准架構 → 舊 README／2026-10-29 docs/AI_HANDOFF.md 和其他歷史快照。文件和聊天**不凌駕實際部署證據**。

## 1. Claude 接手啟動檢查

1. 先連上**有權限**的 GitHub／Claude Code；未連線時應要求使用者授權，**不得假裝已讀寫 GitHub、執行 CI、部署、真機測試或可於對話結束後繼續背景工作**。
2. 讀本檔、附件 B、[Issue #3](https://github.com/starry-phd/echo/issues/3) **全部最近留言**，立即確認新版 `main` SHA、`protected`、未結 PR、最新 push CI、唯一既有自動 Production、Cloudflare latest/exact deployment 和舊正式域名對應 Worker。必要時讀原版最新 `main`。
3. 以**實際原版 source／最後生效的 CSS 和新版源碼**找缺口，不為湊 PR 重做已有 #1～#141 的工作。每次選一項**可獨立驗收且有產品價值**的安全公開功能，先確定資料及權限不越界再改碼。
4. 維持既有受保護流程：feature branch → Draft PR → **exact HEAD CI 全綠** → Ready → 正常 protected squash merge → **exact main SHA push CI 全綠** → **唯一既有** `workflow_run` 自動 Production 全綠 → 原始 Job Log 28／28／private 404 安全檢查 → Cloudflare latest+exact100% 且舊域名不變 → Issue #3 記錄 PR/SHA/CI/Deployment/限制。**上一批 Production 未驗收，不能先合併下一批。**
5. 必要的 owner approval、Cloudflare／GitHub 權限與憑證由實際設定決定；有權限也**不等於**可批次公開私人音訊、切舊域名、啟用 Ads/付費或簽名送 App Store。
6. CI 中的 unsigned iOS／Android Hermes export **不等於** iOS/Android 真機 E2E、商店簽名、商店送審或已公開播放器權限。

## 2. 唯一新舊 Repo、網址與雲端資源

| 項目 | 精確位置／值 | 備註 |
|---|---|---|
| **新版唯一可寫 Repo** | https://github.com/starry-phd/echo | 工作分支與 PR 寫此專案 |
| **工程總進度工單** | https://github.com/starry-phd/echo/issues/3 | Release Gate，應保持 open |
| **原版唯一對照 Repo** | https://github.com/yukidu/Echo-Starry | 唯讀參照；不刪改來源 |
| **新 Starry 中央會員 Repo** | https://github.com/starry-phd/id | 由其他專責開發；Echo 不直接連中央 D1 |
| **新版公開 Web** | https://echo-starry.starry-phd.workers.dev | Workers Static Assets 和 API 共用 Worker |
| **舊正式網站** | https://echo.starry.phd | 仍指向 `temp-starry-echo-bridge`，**不准擅自切** |
| 新 Cloudflare Account | `9ff1b4c261141730ac2fe0683f730062` | Starry 專用 |
| 新 Worker/資產 | `echo-starry` | `worker/index.ts` 與 `dist/` |
| 新 D1 | `echo-starry`，ID `8437c865-d7f5-4efb-8c95-44ee3d3fdb21` | Echo 業務資料，非會員基本資料主檔 |
| 新 R2 | `echo-starry` | 仍是私人音訊，未取得播放許可 |
| 舊 Cloudflare Account | `611de84062006fe96fafd0cf157f2ec0` | 只供舊系統參考 |
| 舊 D1 / R2 | `echoes_db` / `echoes-audio-bucket` | 舊來源不可覆蓋、清空或刪除 |
| Starry 中央 D1 預定 | `id-starry` | 會員主檔，只能經中央正式 API |
| iOS / Android ID | `phd.starry.echo` | `app.json`、`starry.app.json` |
| URL scheme | `echostarry` | Expo Router 原生 deep link |
| appId / brandId | `echo-starry` / `starry` | 品牌及生命週期設定 |

**沒有使用 Cloudflare Pages**；早期空白 Pages 專案已刪除。不得為方便重新建立另一套 Worker、D1、R2、Pages、新計費雲資源或替換正在運作的舊 Worker。

## 3. 交接前已驗證的精確發布快照

> **警告：以下是 2026-11-02 交接前快照。Claude 必須重新查詢，不能把此 Commit 當成永遠最新。此次交接文件 PR 的 CI/部署需另驗證，不能拿上一批 #141 的部署充當新 PR 成功證據。**

- 新版 `starry-phd/echo` **main = `fbb9596380cbaa5b37ff9850a6ffbe01fe2497fd`**，受保護 `protected=true`，open PR = **0**。
- 最近已完成功能 [PR #141](https://github.com/starry-phd/echo/pull/141)：原版正式 Logo PNG 與四條品牌音波、減少動態效果；最後 HEAD `833136cf2dbf16b19d71574d29901a313bbc2aff`；[PR CI #41386019506](https://github.com/starry-phd/echo/actions/runs/41386019506) success，**430/430 tests、0 fail/skip**。
- [合併後 main push CI #41386321850](https://github.com/starry-phd/echo/actions/runs/41386321850) same SHA 成功；[**唯一既有**自動 Production #41386551526](https://github.com/starry-phd/echo/actions/runs/41386551526) same SHA 成功，job `125088545444`。
- Production 原始 Job 日誌確認：`28 metadata-only cards, policy=2 and no-store`、`28/28 curated cover images with no-store; no audio data read`、`28/28 curated guest stream HEAD requests: 404/no-store, no audio downloaded`、`private audio and unlisted cover both return 404/no-store`。
- Cloudflare 官方 latest 和 exact GET 一致：Deployment `b2d62747-ef1c-4c90-88f9-96a335bab811`；Version `1b3612f2-bee2-4970-9f18-2acc9f038977`；**100% traffic**；UTC `2026-11-02T04:07:51.65564Z`（台灣12:07:51）。舊 `echo.starry.phd` 仍指向 `temp-starry-echo-bridge`。
- 前批精確交接：[Issue #3 comment #6568833120](https://github.com/starry-phd/echo/issues/3#issuecomment-6568833120)（#141）、[comment #6566862683](https://github.com/starry-phd/echo/issues/3#issuecomment-6566862683)（#139/#140）。
- Starry ID 中央 Repo 查核時 main = `dd05316794c4fc47c1ba3b8e9e214fb33d617840`，`apps/api/openapi.yaml` 仍標為 **DRAFT/not deployed**，僅見 `/v1/health`；尚無可用的本人會員 API。接手要再看**最新 central Repo**，不可用舊 Echo Auth 代替。

## 4. 技術規範與必須繼承的架構

- **App 架構**：Expo SDK **58**、React Native **0.88.1**、React **19.3**、Expo Router、TypeScript strict、React Native StyleSheet＋`packages/ui/src/tokens.ts` 共用樣式，iOS／Android／Web 同一程式庫。禁止另寫只有 Web 能用的 Vue/Next/純 Vite 前端替代 RN 主架構。
- **Web 與後端**：Cloudflare Worker `worker/index.ts`、Hono／Zod，D1 binding `DB`、R2 binding `MEDIA`、`dist/` Static Assets binding `ASSETS`；`wrangler.toml` 定義 `run_worker_first=['/api/*','/health']` 及 SPA fallback。不要將 Pages 與 Workers 部署混淆。
- **API**：`openapi/echo-public.v1.json`、`packages/echo-api-sdk`、`src/api/client.ts`，版本化契約及生成器。客戶端 TanStack Query。任何 schema 更動必須同步 OpenAPI、SDK、測試、快取策略與安全 Gate。
- **本機偏好**：AsyncStorage `2.2.0`，僅本裝置收藏／隱藏／主題／字體／新手教學／訪客裝飾性暱稱。不要把這些鍵當成中央登入帳號、跨設備會員儲存、權限證明或永久裝置追蹤。
- **品牌**：主題 `legacyTheme.tsx` 的 24 色好心情、深淺模式、字級 100–140%；原版最新 `Navbar.v124.css` 覆寫後品牌 Icon 真正來源是 `public/icon-192.png` 而非舊 Mic／ping；新增 `LegacyBrandWave` 的四條 1.15 秒錯開 0.14 秒音波，需尊重 reduced-motion。
- **新舊拆分**：舊 `yukidu/Echo-Starry` 以 `src/App.tsx`、`src/components/*.tsx`、Vite/CSS 與舊 Worker 為主；新 `starry-phd/echo` 以 `app/*` Expo Router、`src/ui/echo/*`、`worker/index.ts`、`packages/*` 為主。**不能按同名檔案機械覆蓋**，也不能拿舊 Auth/會員 schema 當新版。
