# 132｜商店圖示（1024）與隱私權政策頁 /privacy

## 背景
2026-11-02 業主指示：「1. 你幫我生成一張圖」「4. 隱私權政策的網址你自動幫我生成內容與網址」（健檢 A3、B3）。

## 圖示
- 原始來源：`public/icon-512.png`（#141 確認的真正品牌圖示，新舊 Repo byte-identical）。舊版 `yukidu/Echo-Starry@82cbf4f` 沒有更大的原始檔。
- `public/icon.svg` 的漸層、半透明圓、星點座標與 PNG 吻合（非音符區平均差 0.27/255），**但音符字形不同**，所以不採用 SVG 音符。
- 產生方式（不重新設計）：背景＝SVG 原始漸層＋圓以 1024 向量輸出；音符與三顆星點＝以「PNG − SVG 背景」精確分離出白色遮罩，8 倍超取樣、平滑後抗鋸齒縮回 1024，再合成。縮回 512 與原 PNG 平均差 1.75/255。
- 檔案：`assets/images/icon.png`（1024×1024 RGB 無透明，App Store 規格；系統自行加圓角）、`adaptive-background.png`、`adaptive-foreground.png`（圖案置於 66% 安全區、透明底）、`adaptive-monochrome.png`（Android 13 主題圖示）。`app.json` 設定 `icon` 與 `android.adaptiveIcon`。
- 啟動畫面：需新增 `expo-splash-screen` 相依套件，留待下一批（本批不加新套件）。

## 隱私權政策
- 網址：**https://echo.starry.phd/privacy**（Expo Router 靜態輸出 `app/privacy.tsx`；主選單底部也有連結）。2026-11-04 起正式網域為 echo.starry.phd（docs/144）。
- 內容依 2026-11-02 實際資料行為撰寫（`src/legal/privacyPolicy.ts`）：不需登入、不收集可識別個資；偏好、隨機訪客暱稱、收藏／隱藏清單只存在裝置；伺服器只讀取公開資料，Cloudflare 短暫處理 IP 等技術資料；無廣告、無分析、無追蹤、不出售；未滿 13 歲；個資法權利；未來功能上線前更新；聯絡 starry.phd@gmail.com；附英文摘要。
- `tests/privacy-policy-and-store-icons.test.mjs` 會在程式行為改變時失敗（加入分析／廣告／付費 SDK、Worker 開始寫入或記錄、新增定位權限等），提醒先更新政策。
- Production smoke（`scripts/check-production-guest.mjs`）新增：`/privacy` 必須 200 text/html 且含政策標題、聯絡信箱、更新日期。
- 本政策為依實際行為撰寫的範本，非律師意見；上架前業主可再請法律專業審閱。

## 未做
啟動畫面、正式網域、EAS 建置與真機檢視圖示。
