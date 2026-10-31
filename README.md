# 繁星回聲｜Echo Starry

> **AI／跨對話唯一交接入口：[docs/AI_HANDOFF.md](docs/AI_HANDOFF.md)** — 每次開新對話先讀取此檔與 [Release Gate Issue #3](https://github.com/starry-phd/echo/issues/3)，再查最新 main／PR／CI。程式碼與已驗證狀態以 GitHub 為準，聊天紀錄不是工程權威。

> **注意：下列 README 含初期建立的歷史說明；目前 Web 已部署、R2 已完成非破壞性複製，但音檔仍 private/copied、0 verified。最新狀態與證據請看上面的交接入口。**

全新開發的跨平台音訊 App。採用 React Native + Expo + Expo Router + TypeScript，iOS、Android、Web 共用產品規格與商業邏輯。

> **目前狀態須以 `docs/AI_HANDOFF.md` 的可驗證證據與最新 GitHub 記錄為準；原生商店與 Starry ID 尚未完成。**

## 正式資源

- 正式唯一主網址：https://echo.starry.phd（Cloudflare Worker 自訂網域）
- Worker 技術備用網址：https://echo-starry.starry-phd.workers.dev（非對外分享之正式主網址）
- GitHub: https://github.com/starry-phd/echo
- Cloudflare Account: `9ff1b4c261141730ac2fe0683f730062`（Starry 專用）
- Cloudflare D1: `echo-starry`
- Cloudflare R2: `echo-starry`
- Cloudflare Worker: `echo-starry`（專用 API）
- Web hosting: **Workers Static Assets**（與 `echo-starry` Worker/API 同一服務）
- Pages：**不使用**；曾建立的空 Pages 專案已刪除。

## 原系統僅供參考

- https://github.com/yukidu/Echo-Starry
- 來源 D1: `echoes_db`；來源 R2: `echoes-audio-bucket`，隸屬舊帳號 `611de84062006fe96fafd0cf157f2ec0`。
- 不覆蓋、不清空舊資料；驗證新資料後才安排切流。
- 舊系統 Auth、session、會員中心、Billing、Starry Battery 不可直接當成新架構可信任來源。

## 核心安全原則

- Starry 與 H-Global 的帳號、驗證、資料庫、付費、權限與密鑰分離。
- 未來透過專用跨系 API，在使用者完成驗證、明確授權及可稽核的帳號連結後，雙向同步經核准的基本會員資料。
- **相同姓名、email 或手機不構成自動綁定的充分證據**；避免錯誤合併兩個人的會員資料。
- API 未完成前保持隔離，不能將占位接口誤當已可正式同步。

## DEV-I 工程基準（候選 PR #1）

- Worker：TypeScript `worker/index.ts`，API v1 正式契約 `openapi/echo-public.v1.json`
- 品牌內可重用 SDK：`packages/echo-api-sdk`（v0.1.0）
- EAS 建置 profiles：`eas.json`（尚無原生 Build、商店審核或正式部署驗收）
- ADR：`docs/adr/0001-dev-i-stack.md`；符合情況：`docs/05-dev-i-compliance.md`
- 本輪採 Branch → PR → CI。PR/CI 通過不代表 Production 部署。

專案開發、資料遷移、API 契約、部署與驗收詳見 `docs/` 文件。