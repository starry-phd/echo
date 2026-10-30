# 2026-10-30｜本機隱藏偏好應涵蓋直接開啟的詳細頁

原版 `yukidu/Echo-Starry` 的演講者級不喜歡屬於全畫面的呈現偏好。新案 PR #32/#33 已將卡片級/演講者級隱藏套用至首頁、收藏、講師目錄及講師作品，但直接開啟 `/preview/[id]` 或 `/track/[id]` URL 仍會顯示已隱藏作品詳情，且公播音檔可能建立播放器，造成呈現偏好不一致。

## 已修正
- `src/ui/echo/localCardVisibility.ts` 集中判斷本裝置卡片 ID 與演講者級隱藏；只接受**當前 API 核准取得的卡片資料**，不以本機 ID 直接查資料。
- 訪客資訊卡 `/preview/[id]`：先檢查目前 `/api/v1/previews` 的公開白名單，再等待 AsyncStorage 偏好載入；如符合本機隱藏，**不渲染封面/標題/講師/舊版統計**，改顯示提示與「我的收藏」管理入口。
- 公播詳細頁 `/track/[id]`：同樣先檢查現行 public+verified 受保護 API 回覆與本機偏好。已隱藏卡不會掛載 `AudioPlayback`／啟動音訊播放器；未隱藏、合法公播卡維持原行為。
- 裝置偏好不是伺服器播放權限，也**不能撤銷**任何已核准的公開網址。此修復只恢復使用者的本機顯示選擇；無法存取已撤銷的私有曲目，亦不能把隱藏當 DRM。
- 本輪未動 Worker、R2、D1、112 私人音檔、中央會員或廣告/付費權限。

## Gate 與驗收
新增 `tests/local-card-visibility.test.mjs` 覆蓋單卡、合講者、錯誤姓名、空卡與兩個深層頁面的條件渲染。PR → CI → 受保護 main 正常合併；**不是 Production 上線**。正式發版仍依 GitHub 精確 SHA 手動 `workflow_dispatch`、`production` 人工審批、28/28 封面及私有 stream 404、手機/桌面 UI 驗收；所有結果續寫 Issue #3。
