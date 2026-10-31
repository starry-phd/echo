# 70｜熱門音檔排行榜：核准公開清單跨 100 筆分頁與部分排名提示

## 已發現的真實缺漏

目前新版 `app/stats.tsx` 的「熱門音檔排行榜」從 `/api/v1/catalog` 取單頁最多 100 筆已驗證公開 metadata，再依歷史公開評價/按讚/心得欄位排序取前 10；對第 101 筆以後的核准作品未排序，形成假性排行榜完整度。PR #82 已提供驗證公開 catalog 的 `offset` 安全分頁，PR #83 也已加入首頁的按鈕；排行榜仍未使用。

## 修正與安全界線

- `app/stats.tsx` 改用 `useInfiniteQuery`，從既有 **verified-public-only** API 逐次取得 `offset=0/100/200/…` 的 100 筆資料，重新套用本裝置隱藏/不喜歡過濾、歷史 metadata 排序與只顯示前 10 筆。
- 28 張核准 metadata-only guest 資訊卡仍透過單獨 `getGuestPreviewTracks` 取得，不對未公開／未授權音檔做分頁、不改變 `playable` 資格。
- 未載入所有公開頁前，文案明示「目前已載入」與「名次非全量」；下方提供「載入更多公開作品以更新排名」及 loading 防重複機制，若後續頁失敗仍有重試，既有成功的資料保持可用。
- 保留其他四個會員相關排行頁的**未啟用**與授權提醒，不能假裝私人會員排名或 AI 數據已到位。
- 回歸測試 `tests/public-hot-rankings-load-more.test.mjs`、`tests/legacy-ranking-five-tab.test.mjs`。SQLite 的 205 筆 public+verified/120 筆近似/30 筆 private 合成資料分頁與 SQL refusal 已於原本 `tests/verified-public-speaker-pagination.test.mjs` 測過。

## 尚未完成

完整會員互動與中央 Starry ID 未接通，公開錄音歷史指標依既有核准 metadata；沒有真實大量音訊／付費／私人 R2 的查核。本批不部署 iOS/Android 簽章版、不動 `echo.starry.phd` 舊正式站，只部署新版 `echo-starry` Worker 技術站。Ref #3。
