# 繁星回聲｜舊版 UI 視覺保留基準

**問題：** 先前 Expo v1.3 移植以開發便利性重設首頁，把原版玫瑰色品牌版型誤改為藍紫 Hero + 簡化音檔列表，並未符合使用者要求。此文件定義不可重新設計的視覺規格。

## 來源（唯一 UI 設計基準）

- \`yukidu/Echo-Starry/src/index.css\`：預設 rose #c06c84 與玫瑰淡色背景。
- \`yukidu/Echo-Starry/src/utils/theme.ts\`：預設「經典玫瑰」#c13f6f，24 組主題及固定深色背景。
- \`yukidu/Echo-Starry/src/components/Navbar.tsx\`／\`Navbar.css\`：白底浮動品牌列、麥克風圖示、繁星回聲字樣／音波、右上角漢堡、置頂快捷列、右上方會員選單。
- \`yukidu/Echo-Starry/src/App.tsx\`：左側「💫召喚繁星解答」和玫瑰搜尋欄、進階篩選入口及卡片清單。
- \`yukidu/Echo-Starry/src/v141HomeVisualRefresh.ts\`：淺色玫瑰頁面、寬 52rem 主內容、訪客統計卡、圓角小卡片。
- \`yukidu/Echo-Starry/src/v145FourFilterToolbar.ts\`：4 欄「全部分類／最新上架／熱門推薦／進階篩選」紅色工具列。
- \`yukidu/Echo-Starry/src/components/AudioCard.tsx\`：桌機雙欄／手機單欄、左 112px 講師照片（待授權圖片資料）、右標題／講師／分類標籤／星等／心得／按讚／更多功能。
- \`yukidu/Echo-Starry/src/components/DetailView.tsx\`：詳情播放操作外觀另批逐頁比對；不能誤稱已完成精準還原。

## 本輪落實

1. \`packages/ui/src/tokens.ts\` 全部預設顏色恢復原始 rose；保留 React Native + Expo SDK58，**不再另建 Web-only Tailwind**。
2. \`LegacyThemeProvider\` 保留 24 主題、深色模式；Web 只在本機保留視覺偏好，不持有會員資料。
3. \`LegacyHeader\` 還原左麥克風品牌、右漢堡選單及快捷列，未授權功能明確標記「待移植」。
4. \`LegacyFilterToolbar\` 的 4 欄顏色、圓角、間距取自 v145，搜尋／排序有效，舊會員與貼紙排序未完成時提供清楚提示。
5. \`LegacyTrackCard\` 以左媒體圖 + 右標題／講師／分類／評分和心得位置還原；媒體封面待原圖授權及來源資料恢復，**不得虛構講師肖像或評價／貼紙數據**。
6. 空清單仍須有原版「找不到符合條件的演講音檔」布局，不得用虛構演講資料填滿畫面。
7. 驗收需同時截圖比對：桌機 1440×900、手機 390×844（前後對照）、查驗導覽功能與所有公共 API 的公開權限。

## 尚未完成的項目

舊版真實講師圖片、詳細頁組合、通知/個人中心、收藏數據、貼紙、會員登入、音檔權限、音檔搬遷與 iOS/Android UI 視覺回歸。CI 編譯通過不代表全部畫面已像素相同；未比對原始視覺截圖前不可稱完美還原。

**廣告**：Google AdMob Mediation 仍維持 Ads OFF，不改 SDK 初始化。

## 手機版第一優先（2026-10-29 更新）

- **320 / 360 / 375 / 390 / 414 / 430 px**：以一欄音檔卡片、玫瑰搜尋列、四個篩選按鈕、可見漢堡選單、44 px 以上觸控區優先；主選單寬度永遠不超過 viewport - 20。
- **600–899 px 平板**：以單欄寬版呈現，避免狹窄雙欄截斷音檔名稱和操作。
- **≥900 px 桌機**：最多 832 px 主欄，雙欄音檔卡片；不以桌機排版當原始設計尺寸。
- `src/ui/responsive.ts` 是唯一手機／平板／桌機 breakpoints 來源；`tests/responsive.test.mjs` 持續驗證。
- 版面順序：手機版 → 平板 → 電腦；未完成舊版內容來源（封面肖像、評分、會員、貼紙）不可用虛構資料填充。

## v1.3 已核准 D-08 工程基座符合性（2026-10-29）

來源：《Starry生態系共用技術基座與AI開發前交接包｜v1.3 廣告平台定案版｜2026-10-28》第 2.1 節、D-08、第六節。
本 App 的技術遵循 D-01/D-08：React Native New Architecture + Expo SDK 58 / RN 0.88 + Expo Router + TypeScript strict。UI 由 React Native StyleSheet、`packages/ui/src/tokens.ts` Design Tokens、`@starry/ui` v0.1.0 版本化自有元件（Header/Filter/Card）組成。沒有使用 NativeWind、Tamagui、Tailwind 或 Web-only 重寫，也沒有單獨換一套 UI 框架。

**設計來源分工：** v1.3 文件決定 UI 技術基座；舊版 `yukidu/Echo-Starry` 決定繁星回聲本身的品牌視覺與互動。只共用元件機制，不將全部 Starry App 做成同一套樣板畫面。手機 320–430px 第一優先，平板／桌面視為漸進適配。伺服器狀態採 TanStack Query；主題顏色為本機偏好，不存取會員或付款真相。

**CI 防偏移：** `scripts/check-ui-v13.mjs` / `npm run ui:check` 審查套件、元件、原生樣式、Mobile-first 入口、Ads OFF；`tests/responsive.test.mjs` 對 280–1440px 做邊界檢查。無原始手機截圖比對、iOS/Android 實機測試時，不能宣稱舊版 UI 已 100% 還原。

### 專屬品牌模組與共用元件分離
- `@starry/ui` (`packages/ui/`, v0.1.0)：**共享技術基座**（可版本化的 Tokens 與通用元件），不輸出繁星回聲首頁。
- `src/ui/echo/`：**Echo 專屬品牌/畫面**，承載玫瑰主題、24 色選擇、LegacyHeader、LegacyFilterToolbar、LegacyTrackCard；其他 Starry App 不自動引入。
- 這個隔離對應 v1.3 文件 2.1 D-08「共用技術機制不等於相同畫面」。

## 2026-10-30 勘誤／開始執行舊版最新 UI 的 1:1 修復（第一批）

**舊 `v145FourFilterToolbar.ts` 不是最新舊版 `main` 的首頁！** 本文件先前列出四欄「分類／時間／熱門／進階」是歷史過渡規格，不能再作為最新一比一驗收標準。查證 `yukidu/Echo-Starry/src/App.tsx` 當前 main（`82cbf4f112af57fcfed12ff2f6cf86010c03560e`）實際以「權限、評價、心得、按讚、貼紙、時間、分類」七控制項呈現，直立手機隱藏「評價、按讚」而保留五控制項，按相同排序欄位再點可切換升／降。

本批 PR 對此差異進行**實際程式修復**：
- `LegacyFilterToolbar` 依舊版最新欄位次序輸出桌面七項／手機五項，分類下拉選單置右側，保留原本首頁獨立的「按此展開進階篩選」。
- 已有可信合法歷史統計的「評價／心得／按讚」及上架「時間」皆可點擊並重複切換升降，穩定排序只針對已核准公開結果，不修改 API 或任何原始資料。
- **「權限」與「貼紙」**因中央 Starry ID/權利與電池／貼紙成本可信資料尚未核准接入，顯示相同按鈕位置但以半透明區別，點擊明示未提供排序，不用未知 private audio/會員數據假造結果。
- 回歸測試覆蓋 280、320、360、390、430、599、600、1440 寬度的五／七項、六種已授權歷史數值方向、分類控制與資料安全。這是**完成一項具體修復**，不代表完整舊版 UI 100% 還原；第2／第3層、PWA、浮動播放器、會員／逐字稿等仍在 Issue #3 舊新差異盤點中。
- 新增 `src/ui/echo/legacySortFields.ts` 為基準映射。**這次 PR/CI/合併不自動等於 Production：** 需依最新 SHA GitHub Actions workflow_dispatch + `production` Environment 審批、正式 HTTP smoke 28/28/私人流404，並於真實設備做畫面比較。
