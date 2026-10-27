# DEV-I 工程核對與驗收證據（2026-10-28）

此表代表「本 PR 候選」而非正式上線。依據：DEV-I v0.1，仍標記人工審閱草案；使用者本次已指示按其方案 A 工程技術實作。

| 編號 | 狀態 | 程式／測試證據及限制 |
| --- | --- | --- |
| T01 | ✅ 基座 | Expo + RN + TypeScript、app.json；仍欠原生 EAS 實際 Build |
| T02 | ⚠️ | Expo Router 檔案路由，OAuth/deep link E2E 待驗 |
| T03 | ✅ Web build | React Native Web + Expo SPA；正式 Workers 靜態資產尚未部署 |
| T04 | ✅ 候選 | `worker/index.ts` 取代 `.mjs`；部署前必須通過 CI |
| T05 | ✅ 基礎 | Echo 專屬 D1/R2；Queues 依需求才開，不代表已部署 |
| T06 | ✅ 初版 | `openapi/echo-public.v1.json`、`packages/echo-api-sdk`，僅公開只讀 API；中央 Auth 依另一團隊 |
| T07 | ⚠️ 設定 | `eas.json`；尚無 EAS Build/Submit |
| T08 | ⚠️ | 單獨 Repo 與同 repo 版本化共享 SDK；跨 App 發行未建 |
| T09 | ⚠️ | PR #1、GitHub CI；完整 Preview、Staging 和 Production 隔離待驗 |
| T10 | ⏳ | iOS、Android、手機 Web、桌面 Web 實際測試待做 |
| T11 | ✅ | `docs/adr/0001-dev-i-stack.md` |
| T12 | ⚠️ | 最小公開權限、型別與單元測試；尚缺備援、壓力、監控與復原驗證 |
| P01 | ⚠️ | app.json `extra.appId` / `extra.brandId` 已登記；跨領域正式命名待 G 核定 |
| P02 | ✅ 候選 | 公開只讀 API 的 OpenAPI 3.1 契約；未來受保護 API 另擬 scopes |
| P09 | ⚠️ | branch、PR、commit 和 CI 有真實記錄；EAS、部署與回滾證據未齊 |

保持來源舊 Echo 資料不刪、中央會員 D1 名稱為 `id-starry`、R2 目的桶驗證前 0 verified，不得視為媒體遷移完成。
