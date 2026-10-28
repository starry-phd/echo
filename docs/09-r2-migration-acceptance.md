# 繁星回聲｜R2 搬遷與權限驗收紀錄
日期：2026-10-29（台北時間）｜專責：Echo 開發工作流｜階段：**COPIED（尚未 VERIFIED / PUBLIC）**

## GitHub／Cloudflare 實證

- 搬遷成功：https://github.com/starry-phd/echo/actions/runs/40742932810
- 搬遷 Workflow：`.github/workflows/migrate-r2.yml`，使用唯讀來源、指定目標 Bucket、`rclone copy --ignore-existing`；rclone check `--one-way --size-only` 成功。
- 來源 Cloudflare 帳戶：`yukidu`，來源 Bucket `echoes-audio-bucket`；新帳戶：`starry.phd`，目標 Bucket `echo-starry`。**來源不刪除**。
- 來源 R2 598 個物件，3,122,987,926 bytes。其中 `Pin-Level/` 與 `Success_Crown/` 為兩個 0-byte 資料夾佔位物件。
- 目的 R2 596 個有內容物件，3,122,987,926 bytes。已逐一核對整體 **key + size + ETag** 索引的雙重指紋與數量一致，源／目兩側索引一致。這是物件中繼資料一致性，**不是所有音檔逐 byte SHA-256 或實機播放驗收**。
- 新 Echo D1 `echo_tracks` 112 筆，全部唯一 `audio_key` 均在目的 R2 找到非空檔案，無遺失；新舊 112 筆 legacy ID 索引一致。
- 在上述條件下，已以有條件 D1 更新將 112 筆 `migration_status` 從 `pending` 改為 `copied`，且 `echo_migrations` 總狀態設為 `copied`。**112 筆仍全部 `visibility='private'`，`verified=0`，`public=0`**。

## 舊版實際權限讀取（必讀）

來源：`yukidu/Echo-Starry/src/types.ts`、`src/visitorTrackPolicy.ts`、`src/App.tsx`、舊 Cloudflare D1 `echoes_db`。

- 舊資料共 112 筆，`guestVisible=1` 有 **33 筆**；**這只影響舊版首頁訪客清單，不會授予播放權限**（`src/types.ts` 明確註解），不可據此開放 33 筆。
- `requiredRank` 設定會員門檻 **35 筆**；私人 VIP **2 筆**；`tracks.authorizedOnlyVisible=1` **3 筆**；另 `track_visibility_settings.authorizedOnlyVisible=1` **1 筆**。
- 貼紙解鎖費用大於零 **78 筆**；即使音檔獎銜為「無」也不代表可免費播放。
- 依據舊 `visitorTrackPolicy`「免費瀏覽候選」的保守組合：獎銜為 `無/公開`、非 VIP、兩處皆非 authorizedOnly、貼紙數量為 0，**31 筆**符合。這個數字僅供後續逐筆內容／權利確認，**尚未核准上線**。
- `guestVisible`、各種權限與費用標記可能重疊，不能相加求總筆數。

## 下一個驗收 Gate（暫不開放）

1. 抽樣實際音訊物件前幾位元組、格式與裝置播放（至少 m4a、mp3、aac）；必要時逐 byte 抽樣內容 SHA-256。
2. 對 31 筆免費候選逐筆核實素材授權、來源身分與內容；新 Starry ID／Battery／VIP 契約未驗證以前，**不自動將任何一筆改成 `public + verified`**。
3. 其餘包含會員獎銜、貼紙、私人 VIP、授權清單音檔，必須等 DEV-D／DEV-A 正式驗收；不得藉舊密碼、VIP token 或本機旗標繞過權限。
4. 重新測試 `GET /api/v1/catalog`、`GET /api/v1/tracks/{id}`、`/stream` 僅允許 `visibility='public' AND migration_status='verified'`。
5. 媒體驗收完成並部署前，檢查 R2 來源仍完整、Ads OFF、無新的外部分享 URL。

附註：本紀錄不含任何 R2 API／S3 Secret。不可將 copied 或 Workflow Success 誤稱「音檔已公開」或「原生 App 已上架」。

## 自動私有音訊格式抽樣 Gate

新設 `.github/workflows/probe-r2.yml`：僅取目的 R2 之 m4a／mp3／aac 各一筆私有檔案的前 128 bytes，判斷 media signature；在自有 `main` 的 push 初次建立 workflow 時自動執行，或以 `workflow_dispatch` 手動重新檢查。使用已建立、限定目的 Bucket 的 S3 憑證。**不公開物件、不讀取完整音訊、不建立新的音檔分享 API、不在日誌列出私有檔名或原始位元組**。此成功僅證明三筆檔頭，不是逐檔解碼或完整播放驗收。
