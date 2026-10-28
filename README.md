# 繁星回聲｜Echo Starry

全新開發的跨平台音訊 App。採用 React Native + Expo + Expo Router + TypeScript，iOS、Android、Web 共用產品規格與商業邏輯。

> **狀態：Expo 58 新基座已建置；R2 已完成私有搬遷（112 筆全為 copied/private），尚未核准音檔公開、中央會員整合、原生 EAS 驗收或正式 Web 部署。**

## 正式資源

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