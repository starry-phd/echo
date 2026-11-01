# 118｜舊版新手教學：Web 真實元件聚焦、原生平台保留安全對話框

## 實際舊新原始碼差異
- 原版 `yukidu/Echo-Starry/src/components/TutorialSpotlight.tsx` 用 `getBoundingClientRect`、透明遮罩、箭頭與依視窗調整的提示框，直接指出首頁標誌及第一張封面；`src/App.tsx` 約 2519～2548 行以 logo／visitor／photo 三個目標啟動。
- 新版 PR #132（`docs/117-legacy-guest-tutorial-safe.md`）僅恢復彈窗內容與同裝置 opt-out，尚無直接指向首頁元件的引導。
- 新版目前的「訪客」會員入口及 private 影音權利與原版不同：不得指向不存在的完整會員功能，或把封面說成可以播放。

## 本次變更
- 新版 `LegacyHeader` 品牌標誌新增 `nativeID=echo-tutorial-home-logo`；目前公開卡片中的第一張實際封面新增 `nativeID=echo-tutorial-first-public-photo`。這兩個錨點只供當前 UI 測量，不影響路由、讀取或權限。
- `LegacyGuestTutorial` 在 **Expo Web** 的真正 DOM 元件上量測可見矩形並逐步展示「① 回首頁／② 查看已核准作品」。四片不透明遮罩包圍可見控制項，callout 在畫面內自動選擇上下位置；resize、旋轉、scroll 會重新量測。
- 正式音訊未公開，封面提示明確寫播放尚未開放；收藏限本裝置，會員登入／金流亦不冒稱完成。未取用任何私人資料；不會直接呼叫音訊 API。
- 原始 Web 聚焦目標如果不存在、不可見、超出畫面或量測不可靠，回退 PR #132 的安全純文字對話框。Native iOS／Android 暫保留對話框，不假稱原生定位、真機或螢幕閱讀器 E2E 已完成。
- 繼承 PR #132 的 Legacy 3 opt-out keys＋ AsyncStorage 儲存與失敗告知。單純關閉仍只抑制同一次 App 執行。Web 量測完成前不顯示定位導覽以避免快速閃爍。

## 風險／驗證
- 新增純函式 `legacyTutorialSpotlightGeometry.ts`，測試 `legacy-tutorial-spotlight-geometry.test.mjs` 覆蓋 320×568、390×844、844×390、1024×768及短螢幕；拒絕非有限/超出視窗/無面積的錨點，校驗遮罩不遮住所指物件、提示框不超出邊界、兩個錨點來自已核准展示 UI。
- 持續執行完整 PR/main CI：typecheck、lint、Expo Doctor、全部tests、API／monetization／release／staging/UI guards、未簽章 iOS/Android Hermes export、Web build、Wrangler bundle。
- 僅走既有 protected PR → exact main CI → 唯一自動 Workers Production → HTTP/public API/private404 + 28 guest cover no-store + 28 guest streams HEAD404/no-store → Cloudflare exact/latest 100%、舊域名 unchanged。
- **不碰** Worker/OpenAPI、D1/R2、Starry ID、金流、廣告、Secrets、DNS、正式舊站、分支保護、商店提交、私人音檔。舊版的多箭頭全目標同時顯示並未逐像素還原；這是小螢幕可操作的安全逐步指引，仍需 Web Safari/Chromium 真正 E2E 視覺驗收。
