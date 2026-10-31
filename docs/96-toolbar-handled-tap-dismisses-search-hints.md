# 96｜排序／分類工具列點擊不一定使輸入框失焦，必須明確收合搜尋建議

## 問題與原版行為
原版 `yukidu/Echo-Starry/src/App.tsx` 搜尋欄用 `document.mousedown` 判斷點到搜尋容器外時即關閉建議。新版 React Native 的 `app/index.tsx` 使用 `ScrollView keyboardShouldPersistTaps="handled"`。在原生平台，**其他 Pressable 有處理點擊，不保證搜尋 TextInput 會失焦**。前批 PR #110 解決了真的收到 `onBlur` 時的收合及 chip 按壓保護，但工具列的「排序／分類」已處理點擊可能完全不觸發 `onBlur`，讓建議浮層與工具列同時存在。

## 修正
`LegacyFilterToolbar` 增加向後相容的可選 `onInteract` callback，在每個工具列按鈕（包括分類展開、時間／評價／心得／按讚／未開放的權限／貼紙）、清除已選分類、分類選項與關閉選單時呼叫。首頁以 `onInteract={()=>searchSuggestionBlurGuard.dismiss()}` 接線：即使原生 TextInput 保持焦點，任何工具列操作都會明確收起搜尋建議；既有排序、篩選、合法類別來源與權限拒絕完全不變。

測試 `tests/latest-legacy-toolbar-parity.test.mjs` 覆蓋工具列所有已處理 Pressable 及首頁接線；原版七／五按鈕數、排序方向測試、28 張 guest nonplayable 和公開媒體權利 Gate 保持不變。本次只針對**已處理的工具列操作**，不宣稱已提供全頁 Web DOM 監聽或原生所有背景區域的點擊外側互動 E2E。
