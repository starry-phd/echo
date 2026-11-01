# 111｜原版安裝入口位置與 iPhone／iPad Safari 四步教學

## 原版對照與真實缺漏
- 原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 約581～615行：訪客主選單內的安裝入口，在會員資料／好心情／回首頁區域後，**字體／主題／其他功能前**（`<InstallAppButton ... hideWhenInstalled />` 約603–605行）。
- 原版 `yukidu/Echo-Starry/src/components/IOSInstallPage.tsx` 明列四個步驟：從通訊軟體轉至 Safari → 分享按鈕 → 選單往下捲選「加入主畫面」→ 確認名稱並「加入」。
- 新版 `src/ui/echo/LegacyHeader.tsx` 安裝項目原本位在功能快捷編輯器及所有頁面連結**後方**，窄螢幕需要額外捲動；`src/ui/echo/installGuide.ts` 對 iOS 只有一段精簡句，未說明通訊軟體和完整步驟。

## 本批修復
- 將現成 `<InstallAppButton earlyPrompt=... />` 移至選單的好心情／回首頁後、主題和字體／快捷編輯之前；同一組 props，**只移動一個元件，不複製事件註冊或修改安裝權限**。
- 擴充 `manualInstallHelp.ios` 為原版 Safari 四步教學，加上通訊軟體切換提醒；其他 Android／桌面操作維持原設定。
- `tests/legacy-pwa-install.test.mjs` 以源碼順序與文字測試入口位置、四步說明、沒有新增 Service Worker／私人 R2 存取。

## 範圍限制
只作用於公開 PWA 安裝介面。不變更登入、會員、D1/R2、私人音訊、金流、廣告、Cloudflare DNS；28份核准訪客資料維持 metadata-only 且不得播放。CI/Expo Web build 不是在真實 iPhone Safari 或 Chrome 安裝的 E2E 驗證。
