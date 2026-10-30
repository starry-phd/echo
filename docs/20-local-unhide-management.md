# 2026-10-30｜原版隱藏管理：本機音檔卡個別還原

舊版 `yukidu/Echo-Starry/src/v183DislikeFavoritesPolish.ts` 在收藏/管理區提供「不喜歡的演講者」與單項「取消隱藏」操作；新版 Echo 目前 `⋮ → 我不喜歡` 僅裝置隱藏單張卡片，**只能全部還原**。這批在**相同既有裝置儲存鍵** `echo-device-disliked-track-ids-v1` 上增加 `restoreHiddenTrack(id)`，允許逐張解除隱藏，不冒稱原版完整「演講者級」黑名單或跨裝置同步。

- 收藏頁 `app/favorites.tsx` 加入「不喜歡的音檔卡（本裝置）」清單，**僅從目前合法讀取的 `/api/v1/catalog` 和 `/api/v1/previews`** 反查既存隱藏 ID 的講題、講師；已取消公開或 API 暫時失敗的 ID 不顯示私人 metadata，只以數字說明無法顯示。按「個別還原」只刪掉該本機隱藏 ID；保留「還原全部」。
- 首頁在既有「還原全部」旁增加「管理不喜歡的音檔卡」入口前往收藏頁；不要求 Starry 中央登入、不回寫 Worker D1／R2、不更動既有 28 白名單，也不新增音檔權限。
- `DevicePreferences` 繼續維持 hydration 完成後才能操作，AsyncStorage 快速連點依序寫入；讀取/儲存失敗時不覆寫不明資料；相關拒絕和單筆/全部還原案例新增 Node 回歸測試。
- **原版完整演講者隱藏與授權會員同步尚未實作**，需依中央 ID、用戶同意和舊版規格獨立驗收。此項僅安全本機 UI parity。
- 這一批會改 Expo Web Runtime，但 PR/main CI 成功不等於 Production 上線，仍依既有 `production` 人工審批 Gate。
