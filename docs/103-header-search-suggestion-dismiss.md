# 103｜原版搜尋建議：頁首操作也應觸發失焦收合

## 原版已核實行為
舊版 `yukidu/Echo-Starry/src/App.tsx` 約599～607行透過 `searchContainerRef` ＋ `document mousedown`，**點搜尋容器外側就會 `setIsSearchFocused(false)`**。現在新版 `app/index.tsx` 搜尋建議由 `TextInput.onBlur`、部分首頁 Pressable 的 `searchSuggestionBlurGuard.dismiss()` 控制，但頁首 `LegacyHeader` 是另一個元件，按上方主選單、字體縮放或快捷列時，在 Expo Native `keyboardShouldPersistTaps="handled"` 情境下 **並不保證首頁輸入框自動 blur**，搜尋建議可能仍留在畫面，或在關掉 Header Modal 後再次看到舊提示。

## 最小跨平台補足
- 擴充本就用於頁首 → 首頁訊號的 `HomeResetProvider`，增加完全獨立的單調 revision `dismissSearchRevision` 和 `requestDismissSearch()`。它不是全域 Web document listener、沒有儲存使用者搜尋字串，也不觸碰 API。
- `LegacyHeader` 點 Logo／導覽、字體縮放、漢堡主選單、釘選快捷操作與空快捷列設定入口會發出「收合搜尋建議」訊號；**只有 Logo／回首頁**仍走既有的完整重設。其他頁首操作 **不清空搜尋文字、分類、獎銜或排序**。
- `CatalogScreen` 跳過 provider 初次掛載的 revision，僅在後續訊號到來時 `searchSuggestionBlurGuard.dismiss()` 並透過 React Native `Keyboard.dismiss()` 實際讓原生輸入框失焦，避免下一次 `onChangeText` 直接重開舊面板；不改既有建議 chip 的 `onPress` 與 blur guard。
- 原有快捷列、主題顏色、顯示字體與公共卡片篩選/播放拒絕一律保留。

## 驗證及限制
`tests/header-search-suggestion-dismiss.test.mjs` 對三個元件跨層 wiring、所有頁首入口、非導航動作不重設狀態、初次掛載不觸發、沒有 DOM listener 做靜態回歸；現有首頁/字體/快捷測試維持。完整 CI 驗證 TypeScript/Lint/純測試＋iOS/Android unsigned Hermes＋Expo Web bundle，未涵蓋真人觸控或 VoiceOver E2E。
每批仍需 exact PR HEAD CI→Ready→正常 protected merge→exact main CI→唯一既有 workflow_run workers.dev→首頁/API/private拒絕、28/28封面no-store及28/28 stream HEAD404/no-store→CF官方最新100%／正式舊網域不變。
