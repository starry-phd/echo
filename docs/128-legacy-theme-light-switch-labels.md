# 128｜還原原版深淺色切換的「關燈／開燈」文字與月亮／太陽圖示

## 舊新版的確實來源證據
- 唯一原版 `yukidu/Echo-Starry@82cbf4f112af57fcfed12ff2f6cf86010c03560e` `src/components/Navbar.tsx`：
  - 第 223 行 `const themeActionLabel = isDark ? '開燈' : '關燈';`
  - 第 619–622 行主選單列：`{isDark ? <Sun/> : <Moon/>}` ＋ `<span>{themeActionLabel}</span>`。淺色時顯示**月亮＋「關燈」**，深色時顯示**太陽＋「開燈」**。
  - 第 429–434 行置頂快捷鍵 `renderPinnedAction('theme')`：同樣淺色顯示月亮、深色顯示太陽，`aria-label`／`title` 為 `isDark ? '切換淺色模式' : '切換深色模式'`。原版訪客預設置頂即 `['font','theme']`（見 docs/112），所以每個頁面都看得到這顆按鈕。
- 舊 `src/v150ThemeActionLabel.ts` 是更早的 DOM 修補，最新 `main.tsx` 已不載入；最終行為就是 `Navbar.tsx` 本身的上述程式。
- 新版 `src/ui/echo/LegacyHeader.tsx` 在此 PR 前：主選單固定「☾　切換深色模式／切換淺色模式」，置頂快捷鍵固定 `◐` 圖示、語音標籤「快捷功能：深色模式」。屬可由原版直接證明的文字與圖示落差，先前 PR（#36、#105、#112、#113）未處理。

## 實作
1. 新增 `src/ui/echo/legacyThemeAction.ts`：依目前深淺色回傳原版圖示（`☾`；太陽為 `☀` 加 U+FE0E 文字樣式，避免 iOS／Android 換成彩色 emoji）、主選單文字「關燈／開燈」、語音標籤「切換深色模式／切換淺色模式」。新版全站以文字符號取代 lucide SVG，延續此既有作法。
2. `LegacyHeader.tsx`：
   - 主選單列改為 `{圖示}　{關燈|開燈}`，並加上不含符號的 `accessibilityLabel`；按下後仍切換並收合選單（#105 行為不變）。
   - 置頂快捷鍵的 theme 圖示改為月亮／太陽，語音標籤改為原版「切換深色模式／切換淺色模式」。可見文字「深色模式／淺色模式」與其他快捷鍵的「圖示＋文字」版面維持新版既有設計，不在本批改成純圖示。
3. 測試：新增 `tests/legacy-theme-light-switch.test.mjs`（4 項）；`tests/menu-theme-dismiss-parity.test.mjs` 兩個斷言隨原版文字／圖示更新（仍檢查切換後收合、字體／色票例外不變）。

## 權限與發版界線
- 只改本機主題按鈕的文字與圖示：不讀寫 API、AsyncStorage 鍵、D1、R2、音訊或會員；不改 Worker、OpenAPI、Ads／RevenueCat、DNS、舊網域。
- 發版依既有 Gate；**#143 的 Cloudflare latest＋exact 100%／舊網域驗收尚未補完前，本 PR 只到 Draft＋CI，不合併。**
- CI 不等於 Chrome/Safari/PWA/iOS/Android、VoiceOver/TalkBack 實機驗收；`☀︎` 的實際字形需真裝置目視。
