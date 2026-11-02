# 125｜還原舊版首頁頁尾「！」改版紀錄入口（僅公開訪客功能）

## 可核實的雙方原始碼差異
- 唯一舊版 `yukidu/Echo-Starry/src/App.tsx` 約 3180～3190 行首頁 `<footer>` 左側有低調圓形「！」按鈕，點擊 `setIsChangelogOpen(true)`。同檔約 3409～3415 行顯示 `ChangelogModal`。舊 `src/components/ChangelogModal.tsx` 第486～697行除公開版本摘要之外**包含超級管理員編輯、舊會員信箱及儲存 API**；內建 v3.x 歷史提到私人音訊、貼紙、會員操作等舊功能。
- 新版 `starry-phd/echo/app/index.tsx` 已有安全唯讀頁尾，但沒有「！」或查看已發版的訪客變更歷程。把舊版整段帶 API 的 changelog 移植會暗示**未核准的舊功能已開放**，也會引入不允許的舊管理員編輯/會員 scope。

## 限縮實作
1. `publicReleaseHistory.ts` 用靜態且可核對的**已完成 protected merge + CI + Production + Cloudflare**公開功能資料製作五組節錄（PR #139、#137～#138、#135～#136、#132～#134，以及 2026-10-29 公開訪客基座）；日期/節錄截止日清楚標記，不能宣稱舊 v3.8 功能或當作即時線上版號。禁止 `fetch` 舊 changelog、D1、會員、私人資源，僅打包在 Expo Web/React Native 靜態 bundle。
2. `LegacyPublicReleaseHistory.tsx` 加入跟舊版一致的低調圓形「！」入口，透過真正 React Native `Modal` 顯示**可捲動**改版摘要，關閉背景、底部關閉鍵、Android back/a11y escape、深淺主題與字級縮放都正常；副標題明示「僅節錄已驗收公開訪客功能，不是舊站完整歷程」，底部明示公開封面不代表音訊可播放，會員登入、付費與私人媒體仍未開放。
3. `app/index.tsx` 只在現有安全頁尾放「！」與「繁星回聲」文字，不搬動主畫面、搜尋/分類/卡片、不新增非會員路由/認證或播放控制。
4. `tests/legacy-public-release-history.test.mjs` 回歸舊版原始入口、UI 可開可關、版本列表從允許的 PR 靜態資料來、禁訪舊 admin/私有 API、手機可捲動、accessible escape/至少48pt關閉。

## Gate / 安全限制
Draft PR exact HEAD CI全綠→Ready→正常 protected squash merge→exact main push CI全綠→**唯一既有** GitHub workflow_run auto Production→公開 28 metadata-only/no-store、28/28封面 no-store、28/28 guest stream HEAD404/no-store、private audio/unlisted cover404/no-store→Cloudflare官方 latest+exact100%，`echo.starry.phd` 仍映射原舊 Worker → Issue#3。
- 不接舊 `ChangelogModal` admin API、不搬舊版本裏的會員/貼紙/金流/私人錄音權限，不下載/讀112 private/copied音訊，不動 Starry ID私有D1、Worker/OpenAPI/R2、DNS/Secrets、Ads/RevenueCat、新計費資源、受保護合併規則或 signed EAS/商店。
- 沒有 Safari/Chrome/PWA/Android/iOS 實機或 VoiceOver/TalkBack E2E，CI+自動Production smoke不等於真機與商店發版。
