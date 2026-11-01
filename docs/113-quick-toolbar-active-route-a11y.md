# 113｜原版快捷功能列：目前頁面選取狀態

## 原版程式碼對照
- 原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 約404～405行 `quickActionIsActive` 會依 `currentTab` 對 `stats`、`profile` 等已啟用快捷按鈕提供目前頁面標記；`renderPinnedAction` 在約448～452行用 `topButtonClass(quickActionIsActive(id))` 呈現選取樣式。
- 新版 `src/ui/echo/LegacyHeader.tsx` 快捷按鈕原本 `accessibilityState={{selected:id==='home'&&isHome}}`，即使已透過快捷功能前往排行榜／個人中心也不呈現目前頁面。新版已合法存在「我的收藏（本裝置）」，可同樣安全標記本頁。
- 以上差異可由新舊程式碼確認；未聲稱實機螢幕閱讀器已重現。

## 安全最小變更
- 在 `quickActionStore.ts` 新增不讀資料的純函式 `isActiveQuickAction(id,pathname)`，只辨識確實公開的首頁、排行榜、本裝置收藏、個人資料頁；其他（字體／主題／好心情）都是操作，不是目前頁面。
- `LegacyHeader` 直接使用既有 `usePathname()`，替換舊的「僅首頁 selected」判斷，並讓選取中的快捷列呈現現有主題的淺色底與圓角。標記只跟目前 Expo Router route 有關，**不授予權限、不產生 API、不得從 URL 推論會員身分**。
- 擴充 `tests/legacy-pinned-quick-actions.test.mjs` 對四個安全路由和非頁面／受限路由的測試、頁首實際接線斷言。
- 原本的快捷列釘選、順序、上限、AsyncStorage、字體放大縮小、theme 切換、使用者已存設定全不改。

## 驗收
完整 PR/main CI、未簽章 iOS/Android Hermes、Expo Web/Wrangler、安全測試，以及既有 workers.dev 28/28 cover/no-store 與 28/28 guest stream HEAD404/no-store。真機／VoiceOver／TalkBack 的回報仍需人工 E2E。沒有 R2/private音訊、中央會員D1、金流、廣告、DNS 或 Secrets 更動。