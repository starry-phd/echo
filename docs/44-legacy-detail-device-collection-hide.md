# 2026-10-30｜兩種音檔詳細頁的本裝置收藏／不喜歡／個別還原

## 本輪實際差異
- 原版列表卡片更多功能包含收藏、不喜歡／隱藏；新版 `LegacyTrackCard.tsx` 已有實際本機儲存與 `/favorites` 還原入口。
- 之前新版訪客 `/preview/[id]` 有單獨的本裝置收藏按鈕，但沒有從詳細頁直接不喜歡或個別還原；新版合法公播 `/track/[id]` 沒有收藏與不喜歡操作，只有跳轉收藏頁以調整隱藏偏好。
- 本輪新增共用 `LegacyDetailDeviceActions`，**兩種詳細頁皆可真實加入/取消本裝置收藏，以及「我不喜歡 · 隱藏」**；依既有 `DevicePreferencesProvider` 的本機 `toggleFavorite`、`dislike` 持久化，重新開啟本裝置仍由既有 `/favorites` 列表顯示目前批准的收藏項目。
- 隱藏後不顯示詳情與播放/分享/收藏等操作，只有通知、前往 `/favorites` 與當初由本張卡隱藏時的「還原此張卡片」。若因整位講者被隱藏，仍須去收藏頁還原講者，不能錯誤解除整個黑名單。
- 新共用元件使用原有主題／A−A＋、至少48px互動區、aria 無障礙標籤與 selected/disabled 狀態；本機儲存失敗明確提示可能只在目前期間有效。

## 安全界線
- 新 `mayChangeLocalDetailPreference` 需當前路由 id 與目前核准詳情 track id **精確一致**。
- `source=public` 只允許既有 `GET /api/v1/tracks/{id}` 取得且 `playable=true` 的公開音檔；`source=preview` 只允許 `GET /api/v1/previews` 已核准 `legacySnapshot=true, playable=false` 的 metadata-only 卡片。
- 本機收藏和隱藏只是 UI 偏好，**從不開放媒體、分享、會員登入、積分、私人音訊或新 API**，亦不能把收藏 ID 作成授權。未讀、下載、解碼、hash 或公開私有媒體；私人媒體稽核 `audit-private-audio.yml` 仍待獨立具體授權。
- 只修改 `app/track/[id].tsx` 和 `app/preview/[id].tsx`，新增 `src/ui/echo/LegacyDetailDeviceActions.tsx`、`detailPreferenceEligibility.ts`、`tests/legacy-detail-device-preferences.test.mjs`。不改 Worker/D1/R2、Starry ID、Ads、金流/AI/貼紙、舊評論等。
- 必須完成 PR CI、合法 protected merge、main CI、唯一合法自動 Production、28/28 approved cover/no-store/private404 smoke 與 Cloudflare 100% 部署版本，才能記為 Web 上線。不能宣稱已做 iOS/Android 真機、所有原版功能或可合法播放歷史私人音訊。
