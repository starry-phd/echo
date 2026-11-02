# 122｜新手教學：只框選真實品牌圖示與標題、字體變更即時重測

## 可驗證的舊版差異
原版唯一來源 `yukidu/Echo-Starry/src/components/TutorialSpotlight.tsx` 的 `boundsForTarget(key,element)` 明確標示：首頁品牌 Pressable 為了填滿 header 可伸縮，**只能聚焦麥克風 logo＋「繁星回聲」四字，不要框住不可見 flex 空白和波形裝飾**。它會從子元素取得各自 `getBoundingClientRect`，取聯集作為 spotlight target。該元件也使用 `ResizeObserver` 在字體/排版動態變更時重新量測，及 scroll、orientation、resize。
新版 `starry-phd/echo/src/ui/echo/LegacyGuestTutorial.tsx` #133～#135 一律使用整個按鈕的 `getBoundingClientRect`；只監聽 window resize/orientation/scroll。在寬版 header，logo 白框會包含大量空白；調整字體時目標尺寸變動不一定有 window resize，因此高亮位置可能過時。

## 最小安全修補
- `legacyTutorialSpotlightGeometry.ts` 加入純函式 `tutorialBrandBounds(icon,label)`：有限/非空幾何檢核後取聯集，再沿用原版安全 `normalizeTutorialTarget`。任何無效/消失座標回傳 `null`，不偽造高亮，也不把整個超寬 header 當作品牌。
- `LegacyGuestTutorial.tsx` 在 step 0（品牌）以原有 `echo-tutorial-home-logo` 的前兩個**真實 DOM 子元素**（品牌圖示和精確文字）計算焦點。標題必須等於「繁星回聲」，兩個子元素都要可見；否則回退上一批的安全文字 modal。step 1（右上角主選單）及 step 2（核准公開封面）仍走原量測，不改任何控制項 onPress/路由。
- 使用原生瀏覽器 `ResizeObserver` 只觀察真正首頁目標及兩個品牌子節點，**僅在觀察元素身份改變時**重新 observe（避免 `observe()`→callback→RAF 的無限迴圈）。無 ResizeObserver 的舊 Web 瀏覽器仍以 window resize、orientation、scroll 和 180ms delayed measure 為 fallback。離開教學/切換步驟/卸載時停止觀察並取消 RAF。
- 新增 `tests/legacy-tutorial-brand-bounds.test.mjs`：寬版 flex 紋理、字體/布局變化、NaN/Infinity/無面積輸入、可見性、精確子元素和 observer cleanup 回歸。原 #133～#136 導覽、即時本機 opt-out、權限說明、尺寸定位仍保留。

## Gate 與不可越界
Draft PR latest HEAD full PR CI → Ready → protected squash merge → exact main push CI → 唯一既有 workflow_run Production → 公開清單28 metadata/no-store，28/28 covers no-store，28/28 guest streams HEAD404/no-store，私人音訊/未列出封面404/no-store → Cloudflare官方 latest+exact 100%、原正式網域未切換→ Issue #3 留下 SHA/CI/版本交接。若任一步失敗不得跳過。
此批**只改訪客公開 UI 渲染/幾何/測試**，不動 Worker、OpenAPI、Starry ID/D1/R2、音訊/會員、Secrets、DNS、舊 Worker、Apps 商店簽名、Ads、計費或分支保護。不能宣稱有 Safari/Chromium/Native 真機 E2E；CI只是程式/建置與 API 既定驗收。
