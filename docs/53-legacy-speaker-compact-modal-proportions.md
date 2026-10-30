# 53｜演講者資訊 compact modal 複製比例與返回鍵修正

## 原版證據
- `yukidu/Echo-Starry/src/App.tsx` 的演講者資訊浮層採 `max-w-[570px] max-h-[79dvh]`，內層顯示 `<SpeakerProfilePage compact />`，外層有獨立 X 關閉。
- `src/components/SpeakerProfilePage.tsx` 在 `compact===true` 時**不渲染內文「返回上一頁」**；講者頭像採 `w-20 h-20 rounded-full`（80px 圓形）。

## 本批校正
- `/speaker/[name]` 本就以 Expo Router `transparentModal` 保留原來頁面、X/背景/Escape 可關閉；調整內容 panel 高度為至多約 79% 目前可用視窗高（保留面板內捲動）而非以「視窗減 80px 再乘 .79」縮小視窗。
- 移除 modal 內重複的「返回上一頁」按鈕，因原版 compact 模式只用上方 X/背景/Escape 關閉；仍保留用於本機隱藏講者訊息的 `styles.back`。
- 講者頭像恢復 80×80 圓形。**不新增私人逐字稿/音檔/AI API**，現有核准訪客 metadata gate 與 28 張不可播放封面保持不變。
- 回歸測試 `tests/legacy-speaker-profile-overlay.test.mjs` 精確檢查比例、圓形頭像、無額外返回鍵與既有 modal 關閉/授權路由。

## 發布
- 必須 exact PR SHA CI、受保護 merge、main CI、唯一自動 Production HTTP 安全 smoke、Cloudflare 100% 確認。原版所有內容/原生真機 1:1 仍未驗收，勿把本批 UI 當全 App 上架。
