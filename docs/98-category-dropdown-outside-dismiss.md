# 98｜分類下拉選單點外側關閉（Expo Web／React Native）

## 真實原版缺口
原版 `yukidu/Echo-Starry/src/App.tsx` 在分類開啟時渲染 `fixed inset-0 z-[90]` 的點外側背景，選單本體 `z-[110]`；背景點擊會關閉，但不攔截選單選項。新版 `LegacyFilterToolbar.tsx` 在本批前只有再次按分類、選取分類及明確「✕ 關閉」，點其他非工具列區域不收合。

## 安全修正
採 React Native 內建透明 `Modal`，在同個視窗圖層內先渲染全頁透明 `Pressable` 背景，再渲染選單本體（同層、晚於背景，維持選項可點），不使用 `document` 或 Web 專用事件、不建立新的模組或依賴。`measureInWindow` 量測分類按鈕相對視窗座標；無 DOM 的純函式按可視範圍限縮寬度、底部空間不足則上方顯示，最多 315px 並保留明確關閉按鈕。旋轉或視窗尺寸變化會先關閉舊定位，過期量測 callback 不會再打開。

- 點選遮罩：只關閉分類選單，不選取分類或觸發底下的背景控制項。
- 點選選項：`onCategory(value)` 正常執行後關閉，不被遮罩搶先處理，分類仍是原有已核准的 exact 標籤。
- Android 系統返回鍵、iOS accessibility escape、可見「關閉」控制可安全收合；RN Web 使用相同元件。
- 使用鍵盤或螢幕報讀操作時，仍有具名的可選分類與關閉按鈕。本批沒有宣稱真實 iOS/Android 裝置或瀏覽器手勢 E2E 已完成，後續應補手動可及性/觸控驗收。

## 回歸與界線
`tests/category-dropdown-outside-dismiss.test.mjs` 覆蓋幾何、安全遮罩疊放、舊分類選取路徑、原生返回及過期量測。既有分類、搜尋、排序與 28 張不可播放 metadata 卡、私有音訊拒絕 API 完全不變。本批不改 Worker/OpenAPI/D1/R2、正式 `echo.starry.phd`、Starry ID、Ads、RevenueCat、EAS signed build 或商店。
部署證據以 exact PR HEAD CI → protected merge → exact main CI → 唯一既有 workflow_run 的 Worker＋Web assets → homepage/API/私人拒絕＋28/28封面與HEAD404/no-store → Cloudflare 最新版本100%及舊domain核實為準。
