# 2026-10-30｜原版會員四分頁第二層導覽（安全階段）

## 原版對照
`yukidu/Echo-Starry/src/components/ProfileModal.tsx`（最新可讀 main）：`profile` 自我介紹、`ratings` 評價、`comments` 心得、`listening` 學習進度，四個分頁可切換。原始碼原本使用舊登入資料、會員評價、個人心得與播放紀錄。**這些會員資料不能直接搬到新 Echo 或給訪客查看。**

## 本批實際可運作
- `/profile` 保留原中央會員的 API 未接通提醒、預定 `id-starry`、跨生態系同意 Gate。
- 四個分頁依舊版名稱及次序，手機優先兩欄、至少48px觸控，支援目前玫瑰/深淺主題與 A−／A＋ 字級；點選確實變換對應狀態說明，而不是一張靜態卡。
- 「自我介紹」與「學習進度」提供**真正可前往** `/favorites` 的本裝置收藏操作，清楚區分**收藏不等於已聆聽、可播放或已取得會員權限**。
- 其餘分頁標明需 Starry ID 本人 session 與 Echo 評價、心得、進度的可信業務 API。沒有這些資料時**不可假裝查詢成功為 0 筆**，不仿造私人個人資料，也不設假編輯／登入／評價按鈕。
- 新 `src/ui/echo/legacyProfileTabs.ts` 是純 UI schema，不授權任何會員 scope；測試 `tests/legacy-profile-four-tabs.test.mjs` 驗證原版順序、真實可切換、敏感個資拒絕、中央 API fail-closed。

## 保護與仍待事項
不改 Worker、D1、R2、112 private/copied 歷史音訊、28張白名單封面、Ads/金流/AI Gate；不進行私人音訊稽核。真正 Google/Apple 登入、姓名頭像及獎銜本人資料、生命靈數、個人評價/心得讀寫/學習進度/跨裝置同步與權限顯示，需等中央正式 session、Echo 業務 API 與權利審核。iPhone/Android/平板的實際截圖、觸控及無障礙驗收仍須真機測試。

應經 PR CI、受保護 main 正常合併、main CI 和合法自動 Production，完成28/28與私人 stream 404/no-store 後才能稱**上述安全 UI 上線**；不得稱會員四分頁真資料服務完成。
