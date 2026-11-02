# 133｜原生啟動畫面（expo-splash-screen）

## 為什麼
健檢 A3 後半：原生 App 開啟時需要品牌啟動畫面，否則 iOS／Android 會顯示空白或 Expo 預設畫面。

## 舊版比對（`yukidu/Echo-Starry@82cbf4f`）
舊版是 PWA：`manifest.webmanifest` `background_color=#fdf8f9`、`theme_color=#c06c84`，由瀏覽器以背景色＋圖示產生啟動畫面。新版沿用同一背景色與 #148 的品牌圖示。

## 實作
- 新增相依 `expo-splash-screen ~58.0.0`（Expo SDK 58 對齊版本，CI 的 expo-doctor 會驗證）。
- `app.json` plugin：`assets/images/splash-icon.png`（#148 的 1024 品牌圖示＋與 `public/icon.svg` 相同比例的圓角透明邊），寬 200、contain；淺色背景 `#fdf8f9`、深色背景 `#0d0f17`（與 App 內 `legacyTheme` 的 bg 相同，避免開啟時閃色）。
- 由 Expo Router 在首頁渲染後自動隱藏，不呼叫 `preventAutoHideAsync`，不會卡在啟動畫面。
- 測試：`tests/native-splash-screen.test.mjs`（3 項）。

## 未驗證
需 EAS 內部測試版在真機上看實際效果。Web 不受影響。
