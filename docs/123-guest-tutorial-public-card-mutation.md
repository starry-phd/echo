# 123｜訪客新手導覽：公開卡片替換後重新尋找真實封面聚焦目標

## 原版證據與新版缺口
- 原版唯一參考 `yukidu/Echo-Starry/src/components/TutorialSpotlight.tsx`：教學目標是 CSS selector `[data-tutorial-target="first-track-photo"]`；原版註冊 `MutationObserver` 並監聽 DOM `childList/subtree`，讓動態新增/替換元素時得以重新量測。
- 新版唯一工程來源 `starry-phd/echo/src/ui/echo/LegacyGuestTutorial.tsx` PR #133～#137 已恢復三步導覽、logo 精確 bounds、ResizeObserver/scroll/resize及 opt-out，但第 ③ 步的首頁資訊卡如因公開清單重新排序或伺服器更新，**實際第一張封面 DOM 被替換**，ResizeObserver 看著舊元素不一定能收到新節點事件，可能暫留過期高亮。
- 舊版 MutationObserver 觀察 document.body；新版**不可簡單照搬**：React Native Web 的 Modal 本身也會更新 DOM，body-wide observation 可能因自己的量測→render→mutation 而無限循環／效能惡化。

## 最小修補與限制
1. 只在 `app/index.tsx` 現有經篩選且已核准的 `displayedTracks` 卡片 `cardGrid` 容器加 `nativeID="echo-tutorial-public-card-grid"`，不更改顯示清單、API、順序、收藏/播放及權限。
2. 在 `LegacyGuestTutorial.tsx` **僅第 ③ 步、僅 Expo Web**，且 `MutationObserver` 可用、公開容器存在時，觀測這個指定公開網格的 childList/subtree，以及會轉換第一張照片 `nativeID` 的 `id` attribute；任何更新都呼叫既有 RAF 合併量測流程與 fail-closed `normalizeTutorialTarget`。不觀察 body、不觀察會員/私人容器，也不觀察教學 Modal 自身。
3. 階段切換、使用者關閉或元件卸載即 disconnect observer；Native 保留原安全教學彈窗；無 MutationObserver 的瀏覽器仍依既有 ResizeObserver+scroll/resize/延遲重新量測，**不聲稱每一種不可見替換都一定被捕捉**。
4. 新增 `tests/legacy-tutorial-public-card-replacement.test.mjs`：清單只含目前已核准展示卡、第三步專屬觀察、只觀察 id/childList、沒有 body-wide 監聽、步驟切換 cleanup 與授權拒絕文案。程式級/CI 測試不是 Safari/Chrome 實機 E2E。

## 必經 Release Gate
Draft PR final HEAD full PR CI → Ready→protected squash merge→exact main CI→**唯一既有** workflow_run auto Production→首頁/public API、28 metadata-only/policy2/no-store、28/28 covers no-store、28/28 guest streams HEAD404/no-store、私人媒體+未列出封面404/no-store→Cloudflare 官方 latest+exact deployment100%與舊 `echo.starry.phd` 原 Worker 不變→Issue #3 完整checkpoint。

**永久邊界**：禁止讀取/下載/解碼/稽核或公開 112 私人音訊及 Starry ID 私人 D1；不碰 Worker/OpenAPI/D1/R2、Secrets、DNS/舊正式網域、資源收費/Ads/RevenueCat、原生簽章/商店及分支保護；無真瀏覽器/PWA/VoiceOver/TalkBack 驗收則如實列未測。
