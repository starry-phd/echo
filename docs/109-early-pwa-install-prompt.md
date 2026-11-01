# 109｜網頁安裝原生事件在主選單未開啟時的保存

## 原始碼差異
原版 `yukidu/Echo-Starry/src/components/InstallAppButton.tsx` 約48–58、109–124行在模組層捕獲並保存 `beforeinstallprompt`，即使使用者晚些時候才開選單，仍能使用稍早收到的一次性瀏覽器安裝提示。

新版 `src/ui/echo/InstallAppButton.tsx` 原本只在自身掛載後的 effect 監聽該事件，但它位於 Header 的 `<Modal visible={open}>` 內。選單未開啟時不保證安裝按鈕掛載，可能錯過較早提示；此差異由程式碼直接證明，並**非聲稱實際裝置已重現問題**。

## 最小變更
- 始終掛載的 `LegacyHeader` 透過專用 `useEarlyInstallPrompt` Hook 在 Web 端 `useEffect` 監聽 `beforeinstallprompt`，暫存一次性 Event 到 React state；解除掛載時移除 listener，`appinstalled` 清除暫存。
- `InstallAppButton` 同時接受 `earlyPrompt` 與自身後來的提示，優先處理較新元件捕獲的事件；啟動原生 prompt 前消耗父層備份，防止重用一次性事件。維持瀏覽器 `prompt()` 直接由使用者手勢呼叫，原本無事件時的手動安裝說明保留。
- Header Native/SSR 不存取 `window`；不新增 Service Worker、離線快取或跨站安裝功能；不新增 API、私有 R2 或 D1 查詢，28 份 guest metadata-only 授權不變。
- 新增 PWA 回歸測試；舊版既有靜態測試同步更新。
- Source tests 與 CI 不能當成真實 iOS/Android/Web PWA E2E，仍應有人為操作驗收。

## 第一輪 PR CI 調整
首次 PR HEAD 的 373 項測試中 3 項既有「Header 不得使用全域 DOM 監聽」檢查失敗。**保留這些測試，不更動原有禁令**；瀏覽器專用 `useEarlyInstallPrompt.ts` Hook 將一次性 PWA install event 與跨端主選單互動隔離。需以修改後最新 exact HEAD 的完整 CI 成功，才准備合併。
