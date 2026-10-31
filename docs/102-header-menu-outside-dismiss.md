# 102｜原版主選單點外側關閉｜React Native 與 Expo Web 一致

## 真實原版差異
原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 約239～254行，主選單開啟時綁定 `document click`：點選主選單外面會 `setIsMobileMenuOpen(false)`，且不以 capture listener 搶先卸載 menu。
新版 `src/ui/echo/LegacyHeader.tsx` 原先只用 `open&&<View style={styles.menuPanel}>` 顯示面板、主選單按鈕再次切換或選單內導覽可關閉，但**點擊其他頁面區域並沒有關閉主選單**，在手機上尤其容易遮住內容。

## 跨平台修法
- 使用 React Native `Modal`（透明）與先畫的全畫面 `Pressable` backdrop，後畫的選單 panel 同層疊放：點外部先收起，操作面板內主題色、字體、釘選與長按拖曳不被背景層誤攔截；不複製 Web-only `document.addEventListener`。
- Android 返回鍵 `onRequestClose`、VoiceOver/TalkBack accessibility escape、明確「✕ 關閉主選單」均可收合。所有關閉都清理目前拖曳 ID。
- 視窗旋轉/尺寸變更時關閉選單與拖曳狀態；以 `headerMenuMaxHeight(height,headerTop)` 避免短橫向畫面沿用舊 `Math.max(300,height-160)` 而使面板超出螢幕底部。
- 不修改原有快捷功能個數、釘選排序、主題顏色、裝置儲存、登入/身份或會員後端邏輯；前批 PR #114 Logo reset 的 `go('/')` 仍照常運作。
- `tests/header-menu-outside-dismiss.test.mjs` 驗證 backdrop/modal 層次、所有操作接線、尺寸及跨平台無 DOM listener；需再以完整 exact CI+唯一自動 deploy 安全驗收。

## 仍需區分的限制
Source regression、TypeScript/Web bundle、RN unsigned export 不等於已完成真人 Web/native 點選主選單拖曳與 VoiceOver 手勢 E2E。此批不碰私人 R2音訊、中央 D1、正式舊域名、金流、廣告或 EAS 簽章。
