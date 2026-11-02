# Claude Code｜繁星回聲 Echo Starry 專案接手指示

**使用者已要求把後續開發移交 Claude AI。這個檔案是 Claude Code 開啟 Repo 時的快速入口。**

1. **必讀**：[完整交接主文件](docs/CLAUDE_DEV_HANDOFF_2026-11-02.md)、[新舊共 988 個檔案的全路徑與 52 組來源對照](docs/CLAUDE_OLD_NEW_PATHS_2026-11-02.md)、[完整需求與完成/阻擋狀態](docs/CLAUDE_REQUIREMENTS_STATUS_2026-11-02.md)、[PR／CI／Cloudflare 安全發版 SOP](docs/CLAUDE_RELEASE_OPERATIONS_2026-11-02.md)，然後讀 [GitHub Issue #3](https://github.com/starry-phd/echo/issues/3) **最新留言**。
2. **唯一開發新 Repo**：`starry-phd/echo`；**唯一舊版參照 Repo**：`yukidu/Echo-Starry`；**中央會員依賴 Repo**：`starry-phd/id`。以 GitHub 當前 main/程式碼/CI 與 Cloudflare 實際狀態為準，不依過時聊天或 docs 快照。
3. **技術不可重做**：Expo SDK 58、React Native 0.88.1、Expo Router、TypeScript strict、Workers Static Assets + Hono/Zod + D1/R2、OpenAPI SDK。不要改用另一套 Web-only 架構、重新建立 Cloudflare 資源。
4. **權限硬限制**：112 份音訊 `private/copied/verified=0`，**不讀取／下載／解碼／稽核／公開或播放**；28 筆 guest cards 只可展示 metadata 與已核准封面，所有 guest audio HEAD 仍應 404/no-store。Starry ID 中央 Auth 未核准前 fail closed，不接舊 session/會員 D1。Ads OFF、RevenueCat 未初始化；不動 `echo.starry.phd` 舊 Worker/DNS、Secrets、商店簽名或費用資源。
5. **可自主接續已核准的公開 UI/程式修復**，但每批要先比對舊版實際 source，然後 Draft PR → exact HEAD CI 全綠 → Ready → protected squash merge → exact main push CI 全綠 → **唯一既有** auto Production 成功 → 28 metadata／28封面／28 guest audio HEAD404／私人拒絕檢查 → Cloudflare latest + exact 100%、舊域名不變 → Issue #3 詳細交接並讀回。**上一批未完成完整部署驗收不得先合併下一批**。
6. 若 GitHub/Cloudflare 未連接或缺權限，要明確指出並要求授權，**不要假稱已執行工具或能在對話結束後無限背景工作**。EAS unsigned bundles 不等於真機測試、商店上架或可播放授權。
