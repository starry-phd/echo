# 繁星回聲｜媒體 copied 安全驗收與 Web API 發布
發布日期：2026-10-29 台北時間

## 本次 Production 更動
- 來源 R2 598 件（2 個 0-byte 目錄）、目標 R2 596 個有效物件，3,122,987,926 bytes。有效檔名/大小/ETag 清單一致。
- Echo D1 112/112 筆音檔來源映射和目標 R2 存在性已核對，狀態更新為 copied（仍全部 private，verified 0，public 0）。
- 舊版權限已讀取：guestVisible 只是首頁清單標記；不得解讀為訪客音訊授權。31 筆免費候選需要逐筆內容和使用權審核。
- API /api/v1/health 的 legacyMediaMigration 改為從 Echo D1 讀取 copied，遇到資料庫故障回 pending；會員 Auth 仍 pending。
- 音訊串流 Content-Type：來源 R2 沒有 metadata，已確認 m4a 為 MP4、mp3 為 MPEG、唯一 .aac 檔為 MP4 ftyp；回傳正確 MIME，若未來提供明確 audio/* metadata 則優先依新 metadata。
- 私有音檔格式抽查通過：https://github.com/starry-phd/echo/actions/runs/40747302169
- 合併 PR #7/#8/#9 且 CI 成功：https://github.com/starry-phd/echo/actions/runs/40747939932

## 範圍及 Gate
Web Worker / 公開唯讀 API，保留 public AND verified 雙 Gate。**本次沒有公開任何音檔**，無 Starry ID／Battery／VIP 權限變更、無商店發版、廣告仍 OFF、舊帳戶資料仍保留。

回退：上一個可用 Workers deployment 為 2026-10-28 17:48 UTC，Cloudflare deployment b0426e34-96a9-425e-a7c2-a5683aeb57a8。如現有發布失敗應回復已知正常版本，不能放開 media Gate。
