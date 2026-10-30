# 2026-10-30｜裝置偏好各儲存鍵獨立還原與安全寫入

問題：PR #33 為演講者新增第三個 AsyncStorage key。此前 `devicePreferenceStore.hydrate()` 採 `Promise.all`，任何一鍵 `getItem` 失敗，都會讓**已成功讀取的收藏、單張卡片不喜歡及講師隱藏**在本次開啟期間一起變成空值，即使舊資料仍完整存在裝置中。這是本機使用體驗與保存可靠性問題，不是伺服器會員或授權問題。

## 本輪修復
- 對 `echo-device-favorite-track-ids`（實際常數以 `deviceFavorites.ts` 為準）、`echo-device-disliked-track-ids-v1`、`echo-device-hidden-speakers-v1` 分別 `Promise.allSettled` 讀取，彼此不互相清空。
- 只有真正成功讀取且為 JSON array 或原本不存在的 key 才開放其寫入；**單鍵拒絕讀取、JSON 破損、非陣列**時不覆蓋原始未知資料。該鍵 UI 可在當次操作使用，但不冒稱已永久保存。
- 保留快速連點依序寫入；成功讀取的其他 key 仍可正常保存。畫面儲存提示改為「部分偏好無法讀取／儲存」，不再誤稱全部設定均無法使用。
- `tests/device-preference-store.test.mjs` 新增新講師鍵拒讀但舊收藏可還原/持久保存、舊收藏格式損壞時不覆寫但其他鍵正常寫入，以及全鍵拒讀的回歸。

## 安全及發版 Gate
本輪僅前端 AsyncStorage 本機偏好，無任何會員、Worker/D1/R2、私人錄音、廣告、計費的權限更動。仍需 PR CI / protected main 正常合併；任何 Expo Web Runtime 改動必須另走精確 SHA GitHub Production 手動審批及28封面/私人 stream 404驗收，CI 不等於正式上線。
