# 107｜主選單已安裝狀態與開關可及性對齊（公開 UI）

## 原始碼證據
- 原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 約 603–605 行以 `<InstallAppButton ... hideWhenInstalled />` 提供安裝捷徑；原版 `src/components/InstallAppButton.tsx` 約 312 行 `if (hideWhenInstalled && installed) return null`，安裝後不再顯示。
- 新版 `src/ui/echo/InstallAppButton.tsx` 已有 `standalone` / `appinstalled` 狀態偵測，卻只在非 Web 平台隱藏，已安裝的 standalone 環境仍顯示「安裝到桌面」。
- 原版 `Navbar.tsx` 約 568 行依 `isMobileMenuOpen` 切換開啟／關閉 title，並設定 `aria-expanded`；新版 `LegacyHeader.tsx` 有 expanded state，卻永遠以「開啟主選單」當作語音標籤。

## 最小修改
1. 沿用既有 `installed` 狀態，於所有 React hooks 執行後，將 standalone 已安裝的 Web 選單項目隱藏；未安裝時的 prompt/手動引導保持原樣。**不新增 Service Worker、離線快取或新 API**。
2. 主選單按鈕的 `accessibilityLabel` 依 `open` 動態改為「開啟主選單／關閉主選單」；不改動 Modal/backdrop、拖曳、字體或釘選。
3. 擴充既有 PWA 與主選單回歸測試。

## 安全與驗收界線
- 這只涵蓋目前可真實判別的 Web standalone / appinstalled 狀態，不推定一般瀏覽器分頁一定能辨識其他已安裝 PWA。
- 維持 28 個訪客 metadata-only、封面 no-store、訪客音訊串流 HEAD 404/no-store 及私人資源拒絕。
- CI source checks、unsigned iOS/Android/Web builds 不等於真人多瀏覽器、VoiceOver/TalkBack 或原生實機 E2E。
