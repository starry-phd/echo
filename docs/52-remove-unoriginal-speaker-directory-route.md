# 52｜停用非原版講師作品獨立名錄 URL

## 原版事實

原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 沒有「講師作品」主選單或獨立講師名錄；`src/components/SpeakerNameLink.tsx` 在使用者點卡片講師姓名時，直接開啟 `src/App.tsx` 中的 `SpeakerProfilePage` 疊層視窗。

## 本次 1:1 校正

- 新版原有 `app/speaker/index.tsx` 仍可透過直接網址 `/speaker` 開啟人工新增的「講師作品」名錄；雖然主選單已在 PR #65 清除，但該新路由仍未符合原版。
- 將 `/speaker` 改為 Expo Router `<Redirect href="/" />`，保留舊連結的安全返回首頁，不列舉講師；點擊核准作品的講師姓名仍導向 `/speaker/[name]` 並在原頁開啟覆蓋視窗（PR #66）。
- 不碰 Worker、D1/R2、會員權限、封面 API、私人音檔、Starry ID、金流、廣告。
- 調整兩份靜態原版 parity 測試；保留 `visibleSpeakerDirectory` 純函式的權限/本機隱藏回歸測試，以防未來授權用途回歸。完整舊版會員內容與私人音訊仍需獨立資料授權。

## 發布條件

必須 PR CI 綠燈→受保護 main 合併→main CI→唯一自動正式 Production→健康/API/私人媒體 404、28 張核准封面不可播放 smoke→Cloudflare 新版 100%。
