# 51｜原版點擊講師姓名的演講者個人資訊覆蓋視窗

## 原版確認
`yukidu/Echo-Starry/src/components/SpeakerNameLink.tsx` 點講師姓名後，`src/App.tsx` 在當前頁頂層開啟 570px 寬、最多 79dvh 高的「演講者個人資訊」覆蓋視窗；可點 X、背景或 Escape 關閉，再回到原本頁面。內容由 `SpeakerProfilePage.tsx` 提供「綜合人物摘要／所有錄音／歷史問答」。

## 目前修復
- 將 Expo Router 的 `speaker/[name]` 從整頁導覽改成 `transparentModal`。既有卡片、公開詳情和核准訪客資訊卡上的講師姓名連結不改 URL，導覽時保留上一頁。
- 新增半透明背景、手機友善且最多 570px 寬的面板、頁首「演講者個人資訊」、關閉鈕、背景點擊關閉、Web Escape 關閉及返回上一頁；維持 A± 字級和玫瑰主題。
- 現有兩分頁、公開人物資訊 gate（必須當前核准 public/guest＋本機隱藏偏好 hydration 完成）、故障重試都保留。拒絕未核准路由建立任何私人媒體連結。
- 此批還沒有恢復原版「播放前確認後留在本頁使用浮動播放器」與會員問答/人物逐字稿。舊版資料接口未獲授權串接，不得用舊 D1/R2 猜測；原生真機 overlay 操作仍待安裝驗收。

## 部署
只改 Expo Router screen 及講師 UI，未碰 Worker、D1、R2、Starry ID、Ads、金流、AI 與音訊 Gate。繼續走受保護 PR CI → main CI → 唯一自動 Production → 28/28 approved covers/no-store、private stream 404/no-store → Cloudflare version 100% 才記錄 Web 已上線。
