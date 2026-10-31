# 86｜訪客唯讀歷史統計：缺值不再由 API 偽造為 0

## 實際錯誤與必要性

Worker `/api/v1/previews` 只回傳 owner-reviewed allowlist 中 28 張 guest metadata-only 卡，本身**不授予錄音播放**。但歷史資料 SELECT 的 `m.rating`、`m.rating_count`、`m.comments_count`、`m.likes` 可能為 NULL；先前 `worker/index.ts` 把 `Number(null)||0` 強制變成數字 0，甚至將不合法數據經 `Math.max`／`Math.min` 強行改成0～5或非負整數。

這會使「原始資料沒有發布該數字」被顯示成「真實紀錄0」，直接破壞已實作的 `readHistoricalEngagement`（缺值應顯示「未提供」）、熱門榜單 PR #93、首頁 metric 排序 PR #99 的資料誠實性。

## 安全修復與契約

- 僅在**原本已允許的** guest preview API response serializer 裡，將評價限定有效數字 0～5，按讚／心得／評分數限定非負 safe integer；**NULL/undefined/負數/NaN/Infinity/不合法小數**保留未知，不冒充0。
- 現有 **OpenAPI v1 Track 的 `rating`、`ratingCount`、`commentsCount`、`likes` 本來就是選填 `number`**。以 `undefined` 在 `JSON.stringify` 自動省略這些選填屬性，不修改已發布的 API schema、不新增 `null` 到數字型別。真正數值為0的紀錄仍以 number `0` 返回。
- 用合成 DB rows 的 Worker 真請求測試 `tests/guest-missing-historical-metrics.test.mjs`，驗證：missing 省略後 client 顯示未知；實際0保留；非法值不被偽造；允許部分合法、部分未知的混合；OpenAPI 選填數字契約仍一致；所有 SQL 保留原有 `echo_guest_previews` allowlist、private copied gate，**MEDIA.get 次數必為0**。
- 沒有新增/查詢音訊 R2、私人檔案欄位或其他會員資訊，**不解碼/下載任何私人音訊**；28 guest 仍不可播放、不可從 ID 推定權利。Starry ID Auth、金流／廣告、正式舊域名／原 Worker、原生商店完全不變。

## 發布 Gate

僅在上一批 PR #100 的 exact main CI＋唯一 existing auto workers.dev deployment＋28 guest covers/28 stream HEAD 404/private refusal smoke＋Cloudflare官方100%與 `echo.starry.phd` 仍舊 Worker 全成功後，才可合併本批。此文件不是部署證據。此後也必須 exact PR HEAD CI success → normal protected merge → exact main CI → 唯一 auto Worker/Assets → live HTTP private refusal/28 cover/28 HEAD no-store smoke → Cloudflare官方100%且正式舊站不變 → GitHub Issue #3 完整交接。
