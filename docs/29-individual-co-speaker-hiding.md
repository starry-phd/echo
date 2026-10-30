# 2026-10-30｜雙講師卡片的「我不喜歡」改為逐人選擇

## 發現問題
`src/ui/echo/LegacyTrackCard.tsx` 更多選單原本只有單一「不喜歡這位演講者」按鈕，直接將整張作品的 `track.speaker` 字串寫入本裝置 `hiddenSpeakers`。當原版核准資訊卡的講者是 `王小明 & 林美麗` 時，現有 `isSpeakerHidden` 會把**兩位講師各自的其他作品都隱藏**，不符合「這位演講者」的個人選擇語意，也可能非預期刪減首頁、講師目錄與搜尋篩選內容。

## 已改的使用體驗
- 沿用既有 `splitSpeakerNames`（只按 `&` / `＆` 拆分、正規化、去重），`LegacyTrackCard` 選單對每位目前核准卡片裡的講師分別顯示「不喜歡講師：姓名（本裝置）」。
- 點擊指定人名只對 `preferences.hideSpeaker(name)` 寫入**那一位講師**；不再把 `track.speaker` 整組存入本機偏好。單講師也維持一個按鈕。反映在提示文案的是被選的人，不會說兩位都被使用者隱藏。
- 因原本隱藏規則基於共同作品涵蓋任一被隱藏講師，所以**共同作品仍會隱藏**；另一位講師的單獨作品不會受影響。此操作是裝置顯示偏好，不是會員資料同步或媒體 DRM。
- 使用者可以到「我的收藏」逐人恢復；PR #39 的安全回復對共同作品的單一講師已支援。原先已存在本機的整組隱藏偏好保留原資料及整組還原方式，不偷偷改寫/清除。

## 測試／保護範圍
`tests/individual-co-speaker-hide-menu.test.mjs` 驗證單人、雙人、重複姓名、隱藏共同作品／不隱藏另一位的個人作品、批准 metadata 的個別還原，以及 UI 不再呼叫 `hideSpeaker(track.speaker)`。

本次只改 Expo 前台、既有 AsyncStorage 偏好操作，沒有 API 或後端寫入，沒有讀取／下載／解碼／公開112私人音檔，28張許可照片白名單、Worker/D1/R2、Starry ID、Ads/RevenueCat、H-Global皆不變。完整 CI、受保護 PR 合併不等於正式網站已發布；Production 仍需當下 main CI、精確 SHA 的 GitHub Actions 手動 dispatch、`production` 審批和手機/桌機/28封面/私人 stream 404 驗收。最新交接請看 GitHub Issue #3。
