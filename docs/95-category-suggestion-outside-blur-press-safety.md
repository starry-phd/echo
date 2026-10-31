# 95｜搜尋建議點擊外部收合，不得先卸載分類晶片

## 原版依據與新程式缺口
舊 `yukidu/Echo-Starry/src/App.tsx` 綁定 `document.mousedown`，當事件 target 在 `searchContainerRef` 以外時執行 `setIsSearchFocused(false)`；原版分類建議可點，按選取會套用合法分類並清空搜尋。新版 React Native + Expo Web 的 `app/index.tsx` 只有 `TextInput onFocus`、輸入變化、Escape與手動關閉，沒有失焦收合，因此搜尋欄失焦時仍可留著分類建議。

## 跨平台最小修復
使用 React Native 原生支援的 `TextInput onBlur` 通知 `createCategorySuggestionBlurGuard`，而**不是**立即對 `setSearchSuggestionsOpen(false)`。觸控／滑鼠從文字框轉向分類 chip 時，焦點可能在 chip 的 `onPress` 前先離開：立即卸載 chip 會吃掉 onPress。guard 用短時程（120 ms）收合；`Pressable onPressIn` 暫停、`onPressOut` 安排取消點擊後收合、`onPress` 才真正執行精確分類選取。不同的事件先後順序（chip pressStart 先於 blur／blur 先於 pressStart）與長按都受保護，輸入框再聚焦會取消過期收合。元件卸載清掉計時器，避免卸載後 setState。

## 回歸測試與界線
`tests/category-suggestion-blur-guard.test.mjs` 以可控假時鐘覆蓋一般外部失焦、重新聚焦、長按 chip、不同比對事件順序、取消點擊、卸載 cleanup，以及 UI 的 onBlur/onPressIn/onPressOut/onPress 實際接線。未新增 React Native Web-only DOM API，沒有提供未授權網友關鍵字、私人音訊、Starry ID/會員資料，不改 28 curated guest metadata-only 不能播放/分享權限、正式舊站與金流上架。完整用原 PR/exact CI/唯一 auto workflow_run 驗收。
