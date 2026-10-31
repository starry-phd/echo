# 66｜講者作品：在公開 API 精確縮小「&／＆」共同講者結果，避免 100 筆雜訊截斷

## 真實來源與重現

原版 `yukidu/Echo-Starry/shared/speakers.ts` 以半形 `&` 和全形 `＆` 表示共同講者。既有新版 `src/ui/echo/speakerNames.ts` 與 `authorizedSpeakerProfileTracks` 已做真正的逐人驗證。

原新版的 `/api/v1/catalog?speaker=王小明` 只匹配 `speaker = ?`，導致 `王小明 & 林美麗` 消失。PR #77 為避免必漏，改用廣泛 `q=王小明` 找候選，再做 UI 精確過濾，但若多於 100 筆只是**標題含「王小明」或講者名字相似「王小明老師」**的 public+verified 作品先佔滿搜尋 LIMIT，真正講者的錄音仍被漏掉。

## 本次修復

- `worker/index.ts` public verified catalog 的既有 `speaker` 篩選改為使用 **SQL parameter binding** 的分隔符邊界比對：`&` / `＆` 統一為 `&`，移除一般空格，在完整字串首尾補 `&`，用 `instr` 比對 `&姓名&`。仍保留 **`visibility='public' AND migration_status='verified'`**，沒有新資料源，也不放寬媒體權限。
- `app/speaker/[name].tsx` 改回 API `getPublicTracks(signal,{speaker:speaker!})`，再通過現有 `authorizedSpeakerProfileTracks` 的 NFKC、單一講者、共同講者切分、名稱精確比對與隱藏卡過濾；SQL 只作候選收斂，最終展示權限仍由 client exact check。
- `tests/public-co-speaker-candidate-search.test.mjs` 以實際 SQLite 插入 105 筆相似講者、私人與未驗證錄音，驗證真正共同講者與本人作品不因雜訊遭 `LIMIT 100` 擠掉。
- 既有 `tests/worker.test.mjs` 保留參數化惡意輸入測試，並斷言新 SQL 仍使用綁定與必要兩個公開條件。

## 保留限制

真正同一講者若已核准作品本身**超過 100 筆**，仍受現有 `LIMIT 100`；完整分頁須另行設計，不可把未核准私人媒體混入查詢。原版私音、會員身份、廣告、訂閱、商店上架均不涉及。本批只部署新版 `echo-starry` Worker，**絕不改 `echo.starry.phd` 綁定**。Ref #3。
