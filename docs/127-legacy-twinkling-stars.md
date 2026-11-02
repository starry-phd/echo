# 127｜還原原版「繁星閃爍特效」背景（公開裝飾 UI）

## 舊新版的確實來源證據
- 唯一原版 `yukidu/Echo-Starry@82cbf4f112af57fcfed12ff2f6cf86010c03560e`：
  - `src/components/TwinklingStars.tsx`（164 行）：以固定公式 `seed=(i*9301+49297)%233280` 產生 **subtle 18／normal 28／dense 42** 顆星；`sparkle`（8–14px 四芒星，白色 3px 光暈）、`cross`（5–9px 四芒星，opacity .9）、`dot`（2–4px 圓點，`0 0 size*2px` 同色光暈）；七色金／琥珀／玫瑰／粉／天藍／白／淡紫；`aria-hidden`、`pointer-events-none`。
  - `src/index.css` 第 241–293 行：`starTwinkleSlow 4s`（0/100% opacity .15 scale .75；50% opacity 1 scale 1.25）、`starTwinkleMedium 2.8s`（.85/1.15 → .2/.7）、`starTwinkleFast 1.8s`（.25/.85 → .95/1.3），皆 `ease-in-out infinite`；每顆星 `animation-delay=(i*0.35)%3.5s`。
  - 掛載點三處：`src/components/Navbar.tsx:549` 頁首 `density="subtle"`、`opacity-75 dark:opacity-90`；`src/components/DetailView.tsx:700` 詳情頁介紹卡（原註解「Requirement 4：詳細頁面介紹背景使用繁星閃爍特效」）`density="normal"`、`opacity-80 dark:opacity-95`；`DetailView.tsx:998` 說明與資訊卡 `density="subtle"`、`opacity-40 dark:opacity-60`。
  - `src/index.css:64` 全域 `prefers-reduced-motion: reduce` 把 animation 縮為 0.01ms 一次，星星停在 inline opacity 並以 `translate(-50%,-50%)` 置中。
- 新版 `starry-phd/echo` 在此 PR 前**完全沒有**任何繁星背景（搜尋 `twinkl`／`閃爍` 皆無），Issue #3 也未曾處理；屬可由原版直接證明的公開 UI 落差。`App.tsx:70` 雖 import 但未使用，不新增首頁掛載點。

## 實作
1. `src/ui/echo/legacyTwinklingStars.ts`：純函式與常數。星點序列與原版迴圈**逐值相同**（測試以原版程式實際執行結果的 SHA-256 指紋鎖定三種密度）；CSS `ease-in-out` 以 `cubic-bezier(.42,0,.58,1)` 二分求解；每顆星依原 delay 轉為相位落差，產生首尾連續的 33 個 opacity/scale 關鍵格。
2. `src/ui/echo/LegacyTwinklingStars.tsx`：React Native `View` 背景層（`absoluteFill`、`overflow:hidden`、`pointerEvents:none`、`no-hide-descendants`），**不新增 react-native-svg 依賴**：四芒星以兩個交叉菱形組成，菱形腰寬比由原 SVG 頂點推得（sparkle 0.2、cross 1/3），與原多邊形完全重合。三種速度各一個共用 `Animated` 線性時鐘（原生 native driver、Web JS driver），只動 opacity/transform。
3. 動態／減少動態：讀取 `AccessibilityInfo.isReduceMotionEnabled()` 之前及偏好為減少動態時，星星靜止於原 inline opacity 並置中；動畫中如瀏覽器實際行為，keyframe transform 取代 inline translate，以左上角定位。卸載或偏好變更會停止 loop 並移除 listener。
4. 掛載：`LegacyHeader.tsx` outer 第一個子元件（品牌按鈕內部不變，新手教學 precise bounds 不受影響）；`app/preview/[id].tsx` 與 `app/track/[id].tsx` 的 hero 第一個子元件；`LegacyLectureNotes.tsx` 卡片第一個子元件並加 `overflow:'hidden'` 讓星點依圓角裁切。
5. `tests/legacy-twinkling-stars.test.mjs` 8 項：原版常數／掛載不透明度、三密度指紋、邊界、CSS 緩動與 0/50/100% 關鍵格、相位落差與首尾連續、四芒星幾何、減少動態／無障礙／無資料存取、三處掛載順序。

## 已知差異（刻意且有界）
- 原版每顆星在首次 delay 期間停在置中位置、delay 結束才開始動畫；新版以相位落差讓**穩態時序完全相同**，首次載入即進入穩態。
- 光暈以 React Native `boxShadow` 近似原 CSS `drop-shadow`；實際像素需真瀏覽器／裝置驗收。

## 權限與發版界線
- 純裝飾：不讀 API、AsyncStorage、D1、R2、音訊、會員或裝置識別；不改 Worker、OpenAPI、Ads／RevenueCat、DNS 或舊網域。星星動畫不是播放動畫，也不代表任何錄音可播放。
- 發版仍須 Draft exact HEAD PR CI 全綠 → Ready → 正常 protected squash merge → exact main push CI → **唯一既有** workflow_run Production → 28 metadata-only／28 封面 no-store／28 guest HEAD 404／private 與 unlisted 404 原始 log → Cloudflare 版本 → Issue #3 交接。
- CI 與 unsigned Hermes export 不等於 Chrome/Safari/PWA/iOS/Android、VoiceOver/TalkBack 或減少動態偏好的實機驗收。
