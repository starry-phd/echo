# 106｜原版可置頂「字體 A−／A＋」公開 UI 補齊

## 原版證據與缺口
- 原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 的 `renderPinControl('font','字體')`（約 607–615 行）、`renderPinnedAction('font')`（約 417–426 行）明確支援在快捷列釘選成對字體按鈕。
- 新版 `quickActionStore.ts` 的原核准清單只有 `home/palette/stats/favorites/profile/theme`，沒有 font；`LegacyHeader.tsx` 只有固定頁首及選單內 A−／A＋，無法選擇釘選字體。

## 本批安全修正
- 將 `font` 加入本裝置可釘選快捷功能（不改既有裝置預設、原本已存的順序、手機3／平板5／桌機7上限）。
- 釘選時在頂部快捷列顯示原版風格的兩個 A−／A＋ 按鈕；未釘選仍維持新版原來固定頁首 A−／A＋，**避免重複兩組**。選單內字體操作照舊。
- 兩個快捷按鈕沿用 `FontZoom` 的已核准 100–140%／每次10%、disabled/a11y 與 `requestDismissSearch()`；不清掉搜尋條件，不讀取會員資料。
- 只更改 `LegacyHeader`、本機 `quickActionStore`、回歸測試和本說明，無後端 API／新資源／R2／會員 D1／授權變更。

## 驗收與限制
- 檢查 pinned font 儲存／反釘選、既有未釘選預設、額度上限、跨 RN/Web source wiring、TypeScript/Lint/所有單元測試、unsigned iOS/Android/Web export。
- 真正 iOS/Android/Expo Web 的拖曳、短寬度與螢幕閱讀器手勢需另做人工實機／瀏覽器 E2E，CI 通過不等於真機驗證。
- 28 個 guest 仍 metadata-only；不播放、不分享、不解鎖；Ads OFF、Auth contract pending、RevenueCat 未初始化。
