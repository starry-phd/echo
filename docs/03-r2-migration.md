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
