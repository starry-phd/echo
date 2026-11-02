# 121｜恢復本裝置預設置頂快捷功能（僅本機版型，不涉及會員）

## 原版證據
- 舊 `yukidu/Echo-Starry/src/components/Navbar.tsx` 690～706 行：主選單有「重設選單」（title「恢復此裝置的預設置頂選單」），呼叫 `resetCurrentDeviceMenu`。同檔約 340～360 行將**目前裝置版型**的 shortcut 恢復 `['font','theme']`，保留其他裝置版型設定。舊版將此按鈕限定為已登入 currentUser，與當年可跨裝置同步的舊會員選單設定有關；不得延伸舊登入權限。
- 新 `starry-phd/echo/src/ui/echo/quickActionStore.ts` 已有本機 `mobile/tablet/desktop` 分組、7 個安全可釘選 UI 功能、AsyncStorage 儲存、字體/主題新訪客預設值、移動/拖曳，但**缺少恢復目前版型的預設按鈕**。現階段 Starry ID 正式登入尚未核准；因此僅操作這個新版明確**本機**的 UI 設定，沒有任何會員身份推導。

## 本批實作
1. `quickActionStore.ts` 新增 `resetPinned(quickDevice)`，只把目前 `mobile/tablet/desktop` 的快捷列換回 `['font','theme']`，其他兩組原樣保留；經既有 serial queue 寫入本機 AsyncStorage。
2. 還沒 hydrate 或初始儲存讀取失敗時不重置，以免意外覆蓋可恢復的使用者設定。按鈕在尚未 ready 時 disabled，失敗訊息清楚告知未覆蓋；既有讀取/儲存失敗提示持續存在。
3. `QuickActions.tsx` 僅 expose 本機 reset；`LegacyHeader.tsx` 在現有主選單快捷編輯器下方新增 44pt 高、具 a11y label/hint 的「恢復預設置頂快捷功能」按鈕。操作不跳轉私密頁面、不修改登入或會員紀錄。
4. `tests/local-quick-toolbar-reset.test.mjs` 驗證：未 hydrate 禁止、只重置目前版型、其他版型維持、自動保存及重新 hydrate、讀取失敗不寫入、介面接線與特權路由拒絕。保留原所有排序、拖曳、釘選、限制回歸測試。

## Release gate / 安全限制
Draft PR exact final HEAD full CI → Ready → protected squash merge → exact main push CI → 唯一現有 auto workflow_run Production → metadata-only guest list 28/no-store，28/28 covers no-store，28/28 guest streams HEAD404/no-store，private audio及未公開封面404/no-store → Cloudflare exact/latest 100% + `echo.starry.phd` 舊 Worker unchanged → Issue #3。
禁止存取/讀取/下載 112 私人 R2 音訊、Starry ID 私人 D1、會員/財務/身分 API，不動 Worker/OpenAPI/D1/R2、DNS/Secrets、權限保護、新可計費資源、Ads/RevenueCat、signed EAS/商店。此功能是**本機介面偏好重設**，不是原版會員雲端偏好同步或真機E2E。
