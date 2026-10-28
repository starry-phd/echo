# R2 跨 Cloudflare 帳號遷移

來源：Cloudflare `yukidu` 帳號 `611de84062006fe96fafd0cf157f2ec0` 的 `echoes-audio-bucket`。
目的：Cloudflare `starry.phd@gmail.com` 帳號 `9ff1b4c261141730ac2fe0683f730062` 的 `echo-starry`。

盤點：598 個 R2 物件，3,122,987,926 bytes（約 3.12 GB，2.91 GiB），最大單一物件約 86.85 MB。

**建議途徑：Cloudflare 官方 Super Slurper**，支援 Cloudflare R2 為來源，伺服器端搬遷且不刪來源。來源與目的分別準備限定 bucket 權限的短期 R2 S3 Access Key，配置跨帳戶 Job，目的設 Skip existing／不覆寫現有檔案。參考：https://developers.cloudflare.com/r2/data-migration/super-slurper/ 。

備用方案：官方 rclone：https://developers.cloudflare.com/r2/examples/rclone/ 。

```bash
# 執行前需先在 rclone config 建立兩個 Cloudflare R2 對應帳戶的 remote
rclone copy old_r2:echoes-audio-bucket new_r2:echo-starry --progress --transfers 4 --checkers 8
rclone check old_r2:echoes-audio-bucket new_r2:echo-starry --one-way
```

不得將 Access Keys 提交 GitHub；不得對來源執行 `sync --delete`、`purge` 或清空。核驗物件數量、總容量、樣本內容雜湊、metadata 與 audioKey 的正確性，並重新審查 VIP／會員等級權限；通過後逐項標記 `migration_status='verified'`，不是一鍵全公開。

## 2026-10-28 交叉核對及安全遷移工作流

GitHub Workflow：`.github/workflows/migrate-r2.yml`，手動觸發 `workflow_dispatch`，禁止自動刪除／覆寫。

經 Cloudflare 兩個帳戶即時資料盤點：來源 598 個物件，總計 3,122,987,926 bytes。新 Echo D1 的 112 筆音檔的 R2 `audio_key` **112 筆全部可以在來源 R2 找到**。這只驗證映射，不代表內容已遷移。

首次執行前，必須在 GitHub repository `Settings > Secrets and variables > Actions` 安全建立 4 個機密，來源帳號使用只能讀取 `echoes-audio-bucket` 的專用 R2 S3 金鑰，目標帳號使用只能讀寫 `echo-starry` 的金鑰：

- `ECHO_OLD_R2_ACCESS_KEY_ID`
- `ECHO_OLD_R2_SECRET_ACCESS_KEY`
- `ECHO_NEW_R2_ACCESS_KEY_ID`
- `ECHO_NEW_R2_SECRET_ACCESS_KEY`

Workflow 的完整操作需等金鑰正式配置；不得把任何金鑰寫入 GitHub 程式碼、issue、PR 或日誌。工作流使用 `rclone copy --ignore-existing`（不刪、不覆蓋），後接 `rclone check --one-way --size-only` 核對路徑與大小。檢查通過後，仍需要抽樣內容雜湊、音檔可播放與 VIP／等級授權核對，不能自動將來源音檔設為公開。

**狀態：工作流程程式已準備；尚未提供秘密憑證、未觸發，目的 R2 尚未完成複製。**


## 2026-10-29：實際搬遷完成（取代上方「尚未執行」的歷史狀態）

已成功執行 GitHub Run #40742932810。新 R2 有 596 個非空物件，總容量 3,122,987,926 bytes；來源 598 個物件中 2 個是 0-byte 目錄佔位，故有內容的 596 個 key／size／ETag 索引完全一致。新版 D1 112 個音檔 audio_key 全部匹配，已安全改為 `migration_status=copied` 但仍全部 `private`，`verified=0`、`public=0`。舊版 `guestVisible` 是訪客首頁清單標記，不是播放授權；參見 `docs/09-r2-migration-acceptance.md`。後續須人工內容權限與實際播放測試。
