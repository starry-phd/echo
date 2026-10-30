# 2026-10-30｜原版 A−／A＋ 字體大小：Expo 多頁持久化修復

## 舊版來源與新舊差異

原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 具有主選單與快捷工具列中的 `A−`、`A＋`，步進 10%，上下限 100–140%，本機持久化。新版原本完全缺少字體調整，所有網頁只有固定 CSS-like RN StyleSheet 字體值。

## 本輪真實完成

- 新增 `src/ui/echo/fontZoomPreferenceStore.ts`：預設 100%、上下限 100–140%、每次 10%、輸入／儲存值有限性驗證、異步 AsyncStorage 保留選擇、寫入序列化、讀取失敗不覆蓋未知既有值。
- 新增 `src/ui/echo/FontZoom.tsx` provider，在 Expo Router 的 root layout **一次裝載**；跨首頁、講師、排行及音檔詳情維持相同 zoom，重新啟動同裝置可還原。
- `LegacyHeader` 頂部及展開主選單都有真實 `A−`／`A＋`，依上下限與本機存取載入狀態禁用，顯示當前百分比。最低觸控約42–44px、對應 `accessibilityLabel`。
- Zoom **實際作用**於主選單及快捷文字、音檔卡標題／講師名／類別／歷史統計及更多功能，並同步作用首頁摘要、抽選結果、錯誤/空態、講師雙分頁與摘要、排行榜標題/分頁/榜單和訪客音檔詳細頁。
- 新增 `tests/legacy-font-zoom.test.mjs`：上下限、10%步進、持久化重載、選擇先於原生讀取仍可保留、儲存失敗不寫、非正常輸入、全頁 hook wiring／文字實際 zoom 的 regression。原 RN 系統文字無障礙 font scaling 仍保留，不會全域關閉。

## 清楚界線

- 這是**大部分重要閱讀文字**的首批字級調整；其他所有未列出的細部圖示及每個深層第三頁文字尚未做原版 1:1 全像素比較。未使用不受支援的 DOM/HTML 全頁 scale 改寫 RN layout，維持 320px 手機優先與標題截斷，需手機實際 QA 更進一步確認。
- 此偏好只存本裝置 **UI 外觀**，非 Starry ID 會員帳號或中央同步設定；不讀、下載、串接私人媒體/評論/會員/貼紙，不改 Worker/D1/R2、28張 guest allowlist、Ads OFF。
- CI、GitHub main、Production 運行狀態以[Issue #3](https://github.com/starry-phd/echo/issues/3)最新為準。安全受保護 PR 合併後，由既有 `main` 成功 CI 自動觸發公開 Web shell 部署，完成 28/28、private stream 404 的實際安全驗收才能宣稱上線。

後續待辦：主選單快捷 pin/drag 排列、PWA 安裝、完整音檔詳情/跨頁播放器、會員/通知/貼紙/音檔管理深層安全版型，最後同尺寸手機/桌機逐屏還原。
