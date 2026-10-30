# 2026-10-30｜舊版「安裝到桌面」移植：Expo 58 Web / Cloudflare Workers

## 原版對照
舊版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 的「安裝到桌面」由 `InstallAppButton.tsx` 實作。原始 `public/manifest.webmanifest`、`public/icon-192.png`、`public/icon-512.png`、`public/icon.svg`、`public/icon-monochrome.svg` 已確認存在。新版先前沒有 `public`、PWA manifest 或安裝控制。

## 本批完成內容
1. 保留舊版**原始二進位** 192/512 PNG（GitHub blob SHA 直接複製，不重新繪製或壓縮）、SVG／單色 SVG 圖示。新 Web manifest 保留品牌、繁體中文、`display=standalone`、本地 scope/root，同時**移除舊站特定 `related_applications`**，防止安裝來源指錯舊網域。
2. `app/+html.tsx` 使用 Expo SDK 58 `useServerDocumentContext` 將 manifest、Apple Touch Icon、主題色等放入 Web 靜態 HTML 頭部。Expo `public` 檔案由 `expo export --platform web` 複製到 `dist`，沿用 Cloudflare Worker `[assets]` 部署。
3. `LegacyHeader` 主選單恢復「安裝到桌面」。瀏覽器真正送出 `beforeinstallprompt` 時，可從當次使用者點擊開啟原生安裝提示；安裝後監聽 `appinstalled` 與 standalone。未支援的 iOS/iPadOS、Android 或桌機會顯示可操作的替代步驟。不在 RN iOS/Android 原生 App 顯示這項 Web 安裝操作。
4. 安裝資料不連結 Starry ID、不更改私人媒體權限。不註冊舊版 `sw.js` 或任何離線 cache，避免 R2 音訊、尚未驗證的卡片或已撤銷封面在瀏覽器/桌面安裝版被離線保留。
5. `tests/legacy-pwa-install.test.mjs` 對圖示的 PNG 格式標頭、manifest、HTML、平台說明與安裝事件／安全限制測試。

## 仍待驗收
- 只有 **GitHub CI/Web build 成功＋正式 Cloudflare HTTP 上線**，才能說新版 manifest 有部署；是否收到 Chrome/Edge 的可安裝事件需正式瀏覽器互動測試。
- iOS Safari/Android Chrome/桌機 Chrome 逐一測試「安裝到主畫面」，確認圖示、名稱、獨立視窗與分享/安裝路徑。各瀏覽器政策可能不同，未收到 `beforeinstallprompt` 不代表安裝必然失敗，應使用手動步驟。
- 這不是原版舊 SW 離線播放；**離線音訊播放**仍需逐曲權利核准、安全設計、重新建立專用快取撤銷策略，不屬於本批，禁止直接從舊版移植。
- 進度和剩餘 UI 第二/第三層功能，繼續更新 GitHub Issue #3；目前 112 歷史私人音檔不能開放，Ads OFF。
