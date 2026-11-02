# 126｜依原版最新 CSS 還原真正 App 圖示與四條動態音波（公開品牌 UI）

## 舊新版的確實來源證據
- 唯一原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 約第 549～567 行的標誌包含品牌圖示、`繁星回聲`、**四條小音波**；但它原本 JSX 裡的 `Mic` 與 `animate-ping` 不是最後的有效外觀。
- **重要：要以最新完整串接後的 CSS cascade 為準**。原版 `src/components/Navbar.v124.css` 約第 123～146 行明確把 `brand-logo-glow > div:first-of-type` 設成 `background:url('/icon-192.png')`，同時**隱藏**舊 Mic SVG 與 `animate-ping`；`echo-wave-text` 的舊發光漸層 animation 也覆寫成 none。
- 同 CSS 第 163～182 行規定四條迷你等化器：`1.15s` 一輪，延遲 `0/0.14/0.28/0.42s`，0/100% 為高度4px與 opacity .52，50% 為高度14px與 opacity1。這是最後覆寫後的原版視覺，而非較早 `src/index.css` 裡的舊版 brandGlowBreath、echoWaveGradient。
- **原始圖片檔未變**：兩個 GitHub repo 的 `public/icon-192.png` Git blob SHA 均為 `f3a703a8c0850062a396fd7025a09a6e8055a946`（8,915 bytes）。新版 `LegacyHeader.tsx` 之前卻以 `🎙` 文字代替圖片，右側四條 bar 為固定 `8/13/20/11px` 沒有動畫。

## 實作
1. `LegacyHeader.tsx` 的第一個 `brandIcon` 子 View，改為 React Native `Image source={require('../../../public/icon-192.png')}`，**重用現有位元完全相同 PWA 圖檔**，不修改圖案/字體/顏色，也不用網路下載或替換素材。保留品牌名稱 Text 為第二子節點（原有品牌教程的 DOM precise bounds 依賴），及 `onPress={()=>go('/')}`。
2. `legacyBrandWaveMotion.ts` 以原版 4 bar/1150ms/140ms stagger 產生有界且首尾連續的 scaleY/opacity 關鍵格；React Native `Animated` 只對 transform/opacity 動畫，原生可用 native driver、Web 用 JS driver；比動畫每幀改 layout height 更適合 RN 及 Web。
3. `LegacyBrandWave.tsx` 於螢幕寬度≥550時顯示（延續原先新版的容積保護），使用唯一同步 phase 讓四條 bar 一直以相同間隔運動，隨使用者選定主題色顯示。先讀 `AccessibilityInfo.isReduceMotionEnabled()` 才開始，且監聽 `reduceMotionChanged`；減少動態效果時只顯示 4px 靜態低透明度 bars，避免動畫；離開元件/變更偏好會停止 loop 並移除 listener。純裝飾音波不進語音導覽焦點。
4. `tests/legacy-original-brand-icon-wave.test.mjs` 6 項回歸：最後 CSS 規格、四線動畫有界/首尾連續及 140ms 錯開、原版**Git blob SHA**完全相同、精準教程 brand 首兩個元素維持圖示+文字、減少動態與 cleanup/non-API 隔離。
5. 未改舊網域、任何 Worker、R2/D1、會員/權限、音訊、計費/Ads/RevenueCat 或原生簽章。品牌動畫不是錄音播放動畫，也不表示可播放授權。

## 發版與人工驗收界線
- 必須 Draft exact HEAD PR CI 全綠→Ready→正常 protected squash merge→exact main push CI 全綠→**唯一既有**workflow_run 自動 Workers Production→28 public metadata-only policy2/no-store、28/28 cover no-store、28/28 stream HEAD404/no-store、private audio/unlisted cover404/no-store→Cloudflare官方 latest + exact deployment version100%、原 `echo.starry.phd` 仍是舊 Worker→Issue#3精確交接。
- CI/Web/iOS+Android unsigned Hermes export 並不能取代 Chrome/Safari/PWA/iOS/Android 實機畫面、減少動態偏好、VoiceOver/TalkBack 實測。若真機結果不同，優先遵照最新 CSS（實際使用 PWA icon，**不恢復舊 ping**），且不開權限。
