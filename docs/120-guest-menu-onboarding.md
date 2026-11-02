# 120｜首頁訪客新手教學：補齊原版主選單的第三個真實聚焦目標

## 雙邊原始碼依據
- 唯一舊版 `yukidu/Echo-Starry/src/App.tsx` 約 2519–2548 行：`TutorialSpotlight` 原本包含 `logo`、`visitor`、`photo` 三個目標，visitor selector 為 `[data-tutorial-target="visitor-profile"]`。
- 唯一舊版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 約 568 行：**訪客**的 `data-tutorial-target="visitor-profile"` 加在右上角 `data-main-menu="hamburger"` 主選單按鈕，而非登入頁、私人會員或隱藏元件。
- 新版 `starry-phd/echo/src/ui/echo/LegacyHeader.tsx` 已有真正的右上角主選單，裡面有首頁、排行榜、本裝置收藏、個人資料（中央登入待串接）等已授權入口。上一批 PR #133 只聚焦 logo／第一張核准封面，**漏了訪客主選單目標**；#134 完成 opt-out 即時持久化。

## 限縮實作
1. `LegacyHeader` 在**現有** hamburger Pressable 增加 `nativeID="echo-tutorial-visitor-menu"`；不改 onPress、任何路由、登入/授權。
2. `LegacyGuestTutorial` 由兩步變成 **① 回首頁 → ② 訪客主選單 → ③ 已核准資訊卡**。Web 僅從真實可見 DOM 測量，不能量測則退回原本安全 modal；iOS/Android 仍採 RN 文字教學。只有從訪客公開卡組成的首頁會啟動教學，仍受使用者選取「不再提醒」本機偏好保護。
3. 右上角主選單的提示僅教「排行榜、此裝置收藏、個人資料」，並明示 **Starry ID 中央會員登入尚未串接**；照片只為 metadata 展示，不可宣稱播放器、完整會員或 VIP 已啟動。
4. 先前兩批的安全音訊拒絕、即時 opt-out、三舊 localStorage key、本機 AsyncStorage、縮放重測量、深淺色及原生 fallback 保留。

## 必經 Gate／限制
- 新增 `tests/legacy-guest-tutorial-third-anchor.test.mjs` 驗證來源錨點、三步狀態、Web 真實 DOM 路徑、非會員說法及原生 fallback。
- Draft PR exact HEAD CI → protected squash merge → exact main CI → **唯一既有** workflow_run Workers Production → 首頁/API smoke、28 metadata-only/no-store、28/28 covers no-store、28/28 guest streams **HEAD404/no-store**、私人媒體/未公開封面 404/no-store → Cloudflare 官方 exact/latest100%＋正式舊域名 unchanged → Issue #3。
- 此批不讀、不下載或稽核私人音訊／會員 D1，不動 Worker、OpenAPI、R2、Starry ID、Secrets、DNS、付費資源、Ads、RevenueCat、signed EAS、商店提交或受保護設定。不是 Safari/Chrome 實際滑動／VoiceOver/TalkBack 端對端驗收，不可聲稱已上架。
