# 2026-10-30｜本裝置演講者級「我不喜歡」安全移植

來源：原版 `yukidu/Echo-Starry/src/v183DislikeFavoritesPolish.ts` 與 `src/v184SpeakerRelationship.ts`。原版使用會員側 `/api/member-hidden-speakers`；新版 Starry 中央身分仍未正式發布，**不移植舊帳密、會員黑名單或跨裝置同步**。

## 本輪行為
- 從目前 API 核准卡片的「⋮」選單選「不喜歡這位演講者（本裝置）」，保存該卡目前核准的講師顯示名稱到獨立 AsyncStorage `echo-device-hidden-speakers-v1`。
- 首頁、講師列表、講師作品頁、本機收藏及幸運抽卡都套用演講者級隱藏；原本卡片級 `echo-device-disliked-track-ids-v1` 不變、兩種偏好互不刪除。
- 原版雙人 `&`／`＆` 分講師名字；隱藏其中一位時隱藏含其姓名的核准合講卡。使用正規化後**完整人名比較**，避免字串包含造成錯誤隱藏同名前綴人員。
- 在「我的收藏」只反查 **此刻仍獲 `/api/v1/catalog` 或 `/api/v1/previews` 核准**、且「完整講師顯示名稱」相同的條目，才能秀出名字與逐一取消隱藏；過期／撤銷／載入失敗的講師偏好僅顯示數量，可使用「還原全部」清除，絕不因本機偏好揭露舊私人姓名。
- 講師頁 URL 仍可能由本人手動輸入；隱藏的講師不顯示照片和作品，明示前往收藏頁管理。
- 儲存失敗只留於記憶體並顯示既有錯誤提示；讀取失敗不覆寫未知舊設定，快速連點有序寫入。另設上限100名稱及控制字元／空字串拒絕。

## 不包含
- 不碰 Worker／D1／R2、任何音檔的權限/解碼；112 private/copied、28白名單不變。
- 不登入 Starry ID、無會員或跨裝置同步、無即時資料授權、不改 Ads/RevenueCat。
- 這不是原版完整會員演講者黑名單；真正會員級別要等中央 API、權限、撤回及同意契約另行驗收。

## Gate
本批會改 Expo Web Runtime。先 Branch→PR→CI→protected main 的正常合併；**CI 成功與合併不等於 Production 上線**。正式發布仍須精確 SHA 手動 workflow_dispatch、confirmation、production 人工審批與28照片/private stream 404 HTTP 驗收。
