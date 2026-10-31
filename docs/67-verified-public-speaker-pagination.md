# 67｜公開已驗證講者錄音的安全分頁與「載入更多錄音」

## 原版來源與問題

原版 `yukidu/Echo-Starry/src/components/SpeakerProfilePage.tsx` 有 `hasMore`、`nextOffset`、`loadMore()`，在「所有錄音」列表下面顯示「載入更多錄音」。之前新版 `/api/v1/catalog` 固定 `LIMIT 100`；即使 PR #81 已把共同講者的精確比對放在公開 API SQL 篩選前端，當**真正同一講者已核准公開作品超過 100 筆**時，舊版「載入更多」仍缺失。

## 本批實作

- 只有**verified-public** `/api/v1/catalog` 支援選填 `offset`，接受 `0～999999` 的不含前置零之十進位整數；不合法立即 400、不得查詢 DB。
- 繼續先用 `visibility='public' AND migration_status='verified'` 與 `speaker` bounded query 再 `ORDER BY updated_at DESC, id ASC LIMIT 100 OFFSET ?`。穩定 id tie-break 避免相同時間戳時的頁面重複／漏項。
- `openapi/echo-public.v1.json` 描述選填 offset；`packages/echo-api-sdk/src/index.ts` 支援 `CatalogFilters.offset`。產生的 TypeScript 類型由既有 `postinstall` OpenAPI codegen 在 CI 中產出，不手工冒充生成檔。
- `app/speaker/[name].tsx` 改用 `useInfiniteQuery`，將多頁 `public+verified` 結果與原有 **28 張訪客資訊卡**獨立授權來源合併，再經 `authorizedSpeakerProfileTracks` 逐人 exact+local-hide 過濾；頁滿 100 顯示「載入更多錄音」，下一頁錯誤保留已載入結果並提供重試。
- 真 SQLite 測試建立 205 筆已驗證共同講者、120 筆相似講者、30 筆未核准私人音檔；測試 offset 0/100/200 的 100/100/5、SQL 綁定、惡意輸入拒絕與 DB 避免查詢；SDK URL/ UI gate 測試。

## 明確界線

這不是私人資料分頁；`/api/v1/previews` 仍是原有 28 張核准 metadata-only 卡、**不支援本 offset**；未讀寫任何私有音檔、R2 或 Starry ID。當前可能沒有真正 public+verified 音檔，因此不能以合成 SQLite 測試宣稱已完成實機播音。跨頁時若後端增刪作品，offset 分頁可能移位；仍需在未來以真正資料驗證。本批不修改舊正式網域 `echo.starry.phd`，維持新版 workers.dev、PR→CI→merge→main CI→單次自動部署→HTTP smoke→Cloudflare 官方 100%。Ref #3。
