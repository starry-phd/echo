# 私人錄音原檔／搬遷檔逐筆驗收

此流程只讀舊 `echoes-audio-bucket/uploads` 與新 Starry `echo-starry/uploads`，不部署Worker、不寫D1、不修改R2物件／公開設定、不產生播放或分享權。

## 執行條件

- 使用既有 `migration` Environment、彼此獨立的舊／新 scoped S3 Secrets；不新增Secrets、不把值寫入log。
- 新工作流 `audit-private-audio.yml` **僅手動**，必須main、精確40字approved_commit與 `AUDIT-PRIVATE-ECHO-AUDIO-NO-PUBLICATION`；保留現有Environment保護，不為執行更改設定。
- 與舊sample probe共用concurrency group，避免重複大量讀取。30分鐘timeout、最多3筆並行；預期112筆M4A/MP3/AAC，數量、路徑或大小不符即停止。

## 驗收內容

1. 來源與目的音訊清單的相對路徑／大小必須112/112一致；拒絕不安全路徑、重複key和0-byte音訊。
2. 每筆各讀取舊原檔及新複本到Runner隨機暫存目錄，用完整檔案SHA-256比對，能發現同大小的內容損壞。所有copy目的地都是本機暫存檔，沒有remote write命令。
3. 新複本經ffprobe找到真音軌，再由ffmpeg解碼前8秒。此為**每筆抽段解碼**，不是每筆全長解碼或手機實機播放。
4. 逐筆暫存目錄離開時清除；不列出標題、R2 key、hash或媒體資料。rclone／ffmpeg原始stderr可能含私人資訊，因此只回報固定錯誤碼。
5. 唯一可上傳artifact為 `/tmp/echo-private-audio-audit-summary.json`，只含彙總數量、格式、codec、bytes、失敗類別及權利限制；不允許改為整個tmp目錄。release guard及負面測試阻擋自動觸發和私人目錄artifact。

## 本機驗證與真正執行分開

- Python測試涵蓋同大小SHA損壞、路徑／大小／數量拒絕、stderr不外洩、copy只能到local及暫存清除；npm test會執行這些測試。
- **測試腳本通過不等於112筆R2已驗收**。真正main工作流的run ID、結果及彙總必須寫回Issue #3；未實際success前不得填完成。
- 即使全通過，112音訊仍private/copied；不得因此自動改public/verified。內容權利、原會員／VIP／貼紙規則、正式Starry ID/Battery API及Web/iOS/Android實際播放仍是獨立門檻。
