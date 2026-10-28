# ADR-0002｜Starry v1.3 決議對 Echo 舊 App 改框架的適用

- 記錄日期：2026-10-29（台灣時間）
- 基準：2026-10-28《Starry 生態系共用技術基座與 AI 開發前交接包 v1.3 廣告平台定案版》
- 狀態：使用者已授權**繼續 Echo 既有 App 改框架工程**；本 PR 不包含對 Production、商店、付費服務或新私有 Monorepo 建立的授權。

## 最新正式決議

- D-01：Echo 已正式開發中的 React Native + Expo + Expo Router + TypeScript App，升級至最新確認的正式 SDK 58 / RN 0.88；原生兩端仍待 development build。
- D-02／Q5=B：Starry 未來的「新私有消費 App Monorepo」另案；本次只更新**現有** `starry-phd/echo` Repo，不建立或搬移新 Repo；既有中央 `starry-phd/id` Repo 不動。
- D-03／Q1～Q3：RevenueCat 作為規劃中的 Billing Provider；購買前需先登入 Starry ID。商品只允許非消耗永久買斷或月／年自動續訂，同 App 有效權益跨 iOS／Android 方向尚未 Store Sandbox 驗證；不提供跨 App 共享付費權益。
- D-04／Q4=A：Google AdMob Mediation 選商已核准但 **Ads OFF**；不安裝真 SDK、不初始化、不建立 Ad Unit、不發廣告請求。沒有逐 App 新授權不得開通。
- D-05：Echo 舊版有 Web，因此保留選配 RN Web；使用 Workers Static Assets，不用 Pages。
- D-08：UI 採 StyleSheet + Tokens，預留版本化共用元件，無 NativeWind/Tamagui。
- Starry ID 中央 D1 為預定 `id-starry`，Echo 不存會員基本資料；Battery 僅預留 SDK 入口，不得直接讀取 D1。

## 不可宣稱已完成

目前沒有實際 EAS iOS／Android Build、RevenueCat 真 SDK／Store Sandbox、AdMob SDK／Ads ON、中央 Starry ID API 正式驗證、R2 跨帳戶完整遷移、正式網站部署／商店上架；所有欄位只反映規格與安全預留，不算真實營運能力。

## 風險與回退

- 升級 Expo/RN 有原生 SDK／Web/Metro 相容性風險，需 SDK58 `expo-doctor`、typecheck、lint、test、Web build、Wrangler dry-run 測試。
- 如 PR 未通過 CI，保留現有 `main` 的 Expo57，不做強制合併。
- 購買與廣告安全開關必須由可信後端與商店權益共同授權，前端布林值不能成為永久權益權威。本輪只實現 OFF Gate 和非營運 Billing 介面。
- 不改動舊 R2/D1、正式 DNS、Cloudflare Worker Production；資料搬遷仍按已批准的原遷移作業安排。
