# 130｜原生 App 安全區（瀏海／動態島／Android 狀態列）

## 為什麼
- 2026-11-02 上架準備度健檢（Issue #3）發現：`react-native-safe-area-context` 已安裝但整個 App 沒使用，`LegacyHeader` 沒有 top inset。
- iPhone 瀏海／動態島與 Android edge-to-edge（Expo SDK 58／RN 0.88 預設）會把 App 畫到狀態列下面，標頭與主選單會被時間、電量圖示蓋住；底部「回到最上面」按鈕會壓到 iOS Home 指示條。

## 舊版比對（`yukidu/Echo-Starry@82cbf4f`）
- 舊版是瀏覽器頁面，`index.html` viewport 為 `width=device-width, initial-scale=1.0`，**沒有** `viewport-fit=cover`，所以瀏覽器本身就把內容放在狀態列下方；舊版另有少數彈窗用 `env(safe-area-inset-top)` 留白（`src/index.css:300` 等）。
- 新版 Web（`app/+html.tsx`）同樣沒有 `viewport-fit=cover`，Web 上 inset 全為 0 → **Web 版面完全不變**；只有原生 App 取得實際 inset。

## 實作
- `src/ui/echo/legacySafeArea.ts`（純函式）：`legacyHeaderPaddingTop`、`legacyHeaderMenuTop`（60＋44＋top）、`legacyBackToTopBottom`（原 24px＋bottom）；負值、NaN、undefined 一律視為 0。
- `app/_layout.tsx`：最外層 `SafeAreaProvider initialMetrics={initialWindowMetrics}`。
- `LegacyHeader.tsx`：外層 `paddingTop=insets.top`（標頭底色延伸到狀態列）；主選單 Modal 為全螢幕，面板 `top` 改用含 inset 的 `menuTop`，`maxHeight` 同步；加入 RN 核心 `StatusBar`（RN 0.88 edge-to-edge 只保留 `barStyle`），狀態列圖示顏色跟隨 App 自己的深／淺色切換（Web 上無作用）。
- `LegacyBackToTop.tsx`：`bottom = 24 + insets.bottom`。
- 測試：`tests/native-safe-area-insets.test.mjs`（4 項）；`tests/header-menu-outside-dismiss.test.mjs` 更新 menuTop 斷言。

## 刻意不改
- 健檢 A2「EAS production profile 沒有 API 網址」：查證 `docs/64-eas-internal-preview-public-api.md` 後確認是**刻意 fail-closed**（正式網域未決定、上架未授權），本批不改，留待業主決定正式 App 使用的網域。
- 其他置中對話框（講師、發布紀錄、教學）在畫面中央，不受狀態列影響；分類下拉以量測座標定位，與全螢幕 Modal 同座標系。

## 未驗證
- 尚未在真機（iPhone 有瀏海／動態島、Android 15）上目視確認；CI 只驗證 TypeScript、測試與 iOS／Android unsigned export。
