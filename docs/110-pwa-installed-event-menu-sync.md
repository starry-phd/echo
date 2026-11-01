# 110｜PWA 安裝／重新安裝狀態跨關閉的選單同步

## 原版比對（只處理公開 Web 狀態）
`yukidu/Echo-Starry/src/components/InstallAppButton.tsx` 約74～80行，`capturePrompt` 接到新瀏覽器安裝提示時會將 `installed=false`；約119～124行的 `appinstalled` 監聽位於模組層，不受主選單開關影響，可更新「已安裝」狀態並讓 `hideWhenInstalled` 消失。

新版 #124 已透過始終存在的 `useEarlyInstallPrompt` 保存早期安裝事件，但 `appinstalled` 在關閉選單時原本僅清除備份，未向之後掛載的 InstallAppButton 表示此分頁剛完成安裝；在沒有 standalone display-mode 的普通瀏覽器分頁裡，安裝選單可能再次錯誤出現。若本分頁重新收到 `beforeinstallprompt`，也要恢復安裝入口。

## 修改
- `useEarlyInstallPrompt` 只在本次 Web 分頁 React state 保存 `installedInThisTab`。收到 appinstalled→true並清 early prompt；收到新 beforeinstallprompt→false並保存新 prompt。沒有 LocalStorage「已安裝」永久提示，也不讀任何跨來源 related apps。
- `LegacyHeader` 將安裝狀態安全傳給子元件。子元件以自身的獨立 standalone 判斷或本分頁安裝事件決定是否隱藏安裝入口；新的安裝提示使安裝入口可重新出現。Native/SSR 不新增 Web 全域監聽。
- 維持原本使用者直接點擊呼叫 prompt()、手動安裝步驟和 28 metadata-only/私人音訊拒絕。無音訊 API、R2、中央會員 D1、廣告、金流或 Service Worker 變更。
- 擴充 `tests/legacy-pwa-install.test.mjs` 檢查有根據的狀態流程，更新既有原版 parity 靜態斷言；CI 不等同真實 Chrome 安裝/解除安裝 E2E。
