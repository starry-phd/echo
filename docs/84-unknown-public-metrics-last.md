# 84｜首頁歷史統計排序不再將「未知數值」視為真正的 0

## 實際問題

新版 `/api/v1/catalog` 在已核准公開音檔中尚未提供 `rating`、`likes` 或 `commentsCount`；只有獲准的 28 張 guest 資訊卡可能帶有唯讀歷史數值。雖然 PR #93 的熱門榜單已排除**沒有發布該項歷史數字**的卡，但首頁排序 `sortEchoCards` 仍使用 `??0`，把**未知**與**公開數字真的等於0**混為一談。

特別是點兩次「按讚」或「評價」切成由低至高時，所有沒有發布該項指標的 verified-public 卡可能被排到真正記錄0的卡之前，誤導成最低分／最少讚。

## 修復

- `src/ui/echo/cardSorting.ts` 分辨：`null/undefined`、NaN、不合法負數或無限值屬「未知」，**不等於0**；評價範圍 0～5、按讚／心得非負安全整數。對每種歷史指標排序，已知的數字依既有升降序排列（包括合法的真0），未知**無論升降都排在最後，且保持原已核准 API 清單順序**。
- `app/index.tsx` 只在首頁資料與偏好已就緒且使用評價／按讚／心得排序時，加入清楚的文字說明：未提供所選已公開數字者排在有數值者後，**不視為0**。
- 新 `tests/unknown-public-historical-sort.test.mjs`：合成 verified-public 與 guest 唯讀卡，涵蓋3指標×正反向、真正0、缺失、NaN/Infinity/負值/非法小數及來源不變，保留既有日期、熱門榜與舊版 toolbar regression。
- **未擴大可發現或可播放的音檔**：輸入仍只來自當前核准 public+verified 與白名單 guest metadata，排序只處理展示順序；不讀 DB/私有R2/會員資料、不新增任何 API 或權限。

此文件不是部署證據，仍須 feature exact PR CI success → 正常 protected squash merge → exact main CI success → 唯一 existing auto workers.dev Worker＋Expo Web assets → 28 guest covers/28 stream HEAD 404 no-store/private refusal HTTP smoke → Cloudflare官方100%與 `echo.starry.phd` 原舊 Worker不變 → GitHub Issue #3。
