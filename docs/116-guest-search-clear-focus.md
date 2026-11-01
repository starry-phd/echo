# 116｜訪客首頁搜尋清除後保留輸入焦點

## 來源差異
- 原版 `yukidu/Echo-Starry/src/App.tsx` 約2805～2830行的搜尋框清除按鈕，先 `setSearchQuery('')` 再 `setIsSearchFocused(true)`，讓清除後能直接繼續搜尋；用戶不需要重新定位搜尋區域。
- 新版 `starry-phd/echo/app/index.tsx` 已具備 Expo TextInput、搜尋建議 blur guard，卻只執行 `onPress={()=>setQuery('')}`。在手機觸控／滑鼠點擊按鈕時，輸入框可能失去焦點，也可能保留短暫延遲的 blur 計時器。

## 修正
- 在首頁保留 `searchInputRef` 指向真正的 TextInput，清除搜尋時立即清除 `query` 與已防抖的 `debouncedQuery`，取消待處理的 blur，恢復 focused 狀態並以 `searchInputRef.current?.focus()` 讓游標可直接輸入下一筆搜尋。
- 保留原有 `shouldShowCategorySuggestions` 安全條件（輸入為空不顯示完整分類清單），沒有引入未審核網友關鍵字、私人結果或會員篩選。
- 擴充 `tests/category-suggestion-blur-guard.test.mjs` 驗證實際首頁按鈕接線、重新 focus 不會觸發舊 blur 計時器，以及真正離開仍會正常關閉。原先的其他 search chip/refocus 保護測試保留。

## 範圍
只修改公開搜尋操作。未修改 Server API、卡片公開資格、R2 音訊、D1、會員權限、金流、廣告或任何正式域名；CI 與未簽章 Expo 匯出不等同真實觸控裝置 E2E。