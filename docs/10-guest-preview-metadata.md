# Echo metadata-only guest previews (2026-10-29)

The new Cloudflare D1 contains 112 imported tracks, all private/copied; zero are public/verified. The legacy guest homepage showed 33 tracks but guestVisible is **NOT** a playback grant. An independent read-only audit of the source D1 found exactly 28 of those 33 have no VIP, authorized-only, rank or sticker restrictions; new Echo D1 has the same 28 IDs as private/copied.

Owner approved restoring guest **information cards** and independently authorized controlled development and release; this scoped preview provides only public-facing metadata (id, title, speaker, duration and categories). No descriptions, external links, uploader info, R2 key, stream URLs, likes, accounts or member details are revealed. The whitelist is in `echo_guest_previews`, added separately by the SQL migration. Only entries both in the whitelist and still private/copied qualify. They are returned from `/api/v1/previews` with `playable=false` and `description=null`. Cards clearly say playback is unavailable. The existing `/api/v1/catalog`, `/api/v1/tracks/:id` and `/stream` retain their **public + verified** restrictions. This does not clear individual publishing rights or audio rights.

Manual migration: `database/migrations/20261029_guest_metadata_previews.sql`. Validate curated row count=28 before deployment. No mass UPDATE to `echo_tracks` or source DB. Remove an ID from the whitelist to revoke metadata immediately; do not change media visibility to restore a card.

## 2026-10-29 補充：卡片封面撤銷與快取保護

來源舊版授權僅允許 28 筆資訊卡與封面展示，不等於私人音訊公開授權。原封面端點回傳 `Cache-Control: public,max-age=3600`，導致移除白名單後原本已快取的圖片仍可能顯示一段時間。修復改為 `Cache-Control: no-store`，每次新請求重新依 D1 白名單檢查；列表回傳的圖片 URL 追加固定 `?policy=2` 版本參數，以避開已發布舊版的 1 小時瀏覽器快取。原來已經被下載／截圖的封面無法藉此收回；真正的撤銷仍需 D1 刪除白名單。公開＋已驗證音訊的 Range 串流也改為 `no-store`，避免撤銷公開權後由中介快取再次交付（會增加正常播放時的來源請求量，待有合法可播放曲目時另測效能）。

此項不讀取私有音訊檔案或執行 `audit-private-audio.yml`，不變更任何 D1/R2 資料、網域或發布設定。網頁底部原文「已驗證公開內容」會讓訪客誤認已有公開音訊，已改為「訪客資訊卡（唯讀）｜播放須另經授權」，首頁數字也以目前篩選後可播放數為準。
