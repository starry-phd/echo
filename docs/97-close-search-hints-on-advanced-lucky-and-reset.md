# 97｜原生已處理點擊：進階篩選、抽選與清除條件時收合搜尋建議

## 來源與確切缺漏
舊版 `yukidu/Echo-Starry/src/App.tsx` 使用 `document.mousedown`：點搜尋容器外即 `setIsSearchFocused(false)`。新版 `app/index.tsx` 在 `ScrollView keyboardShouldPersistTaps="handled"` 中，按其他 Pressable 不一定使原生 TextInput 失焦。PR #110 已保護真正 blur 時的分類 chip 操作，PR #111 已替 LegacyFilterToolbar 的已處理點擊明確關閉建議，但**首頁上仍有其他已處理控制**（召喚繁星解答、展開/收起進階篩選、獎銜選項、清除全部篩選）會在輸入框保持焦點時留下搜尋提示，與原版行為不同。

## 本次安全最小修復
在前述四處首頁既有控制的 onPress/onRank callback，於原操作**之前**呼叫已通過 CI 的 `searchSuggestionBlurGuard.dismiss()`。輸入框未 blur 也能收起分類建議，不改變抽選演算法、獎銜合法來源、篩選清除規則、全站已核准 metadata 或 28張訪客不可播放/分享 Gate。

更新 `tests/category-suggestion-blur-guard.test.mjs`，以來源回歸斷言確保所有四個已處理動作都明確收合；保留 chip 於 onPress 才選取的安全時序。此修復不加入 Web-only document/window listener，不表示背景空白區的所有點擊已逐項 E2E 驗收。

## 禁止變更
不修改 Worker/OpenAPI、私人 D1/R2、Starry ID、媒體播放/分享授權、舊正式 `echo.starry.phd`、金流/廣告/EAS簽章/商店。仍須 exact PR+main CI、唯一既有auto workflow_run workers.dev、28 covers+28 HEAD404/no-store及Cloudflare官方100%驗收。
