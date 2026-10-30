# 2026-10-30｜通知中心原版二級導覽：安全先行

## 原版依據
`yukidu/Echo-Starry/src/components/NotificationsView.tsx` 的三個分頁順序：「我的訊息／未審核／新會員」。原版只有 `canSeePending` 時才會露出「未審核」，會員通知包含 @ 提及、心得連結、回覆與略過；管理核准功能屬高權限操作。

## 本批實際可操作的範圍
- `/notifications` 是真實 Expo Router 畫面，主選單「通知中心」可進入；「我的訊息」及「新會員」可切換，並依既有玫瑰主題、深淺模式與 A−／A＋ 字級呈現。提供有效的「查看會員登入進度」導覽至既有 `/profile`。
- 只有**經正式中央 API 核實的審核職務**才可能出現「未審核」tab；目前尚無該驗證連線，因此強制 `hasVerifiedReviewerScope=false`，**所有訪客均不可見**。未接入前不信任本機設定、舊 session 或歷史會員資料。
- 訊息、新會員資料目前**沒有可信授權 API**：明確說明「不可判定是否有訊息」，不是假「0 未讀／沒有新會員」，不顯示舊訊息、人名、頭像或可點的假「已讀／同意審核／快速回覆」。
- 無 Worker、D1、R2、中央 Starry ID 或支付變動；28張 approved preview 與112筆 private/copied audio 權限不變；Ads OFF。
- 新增 `tests/legacy-notifications-tabs.test.mjs` 檢驗三分頁原版名稱與順序、訪客不得取得審核 tab、空態不假造、真實主選單與 Router 導覽、無私有資料讀取。

## 仍未完成／不可稱 1:1
中央 Starry ID 的**真實登入 session + reviewer scope + center 權限**、Echo 會員通知服務、@提及/回覆/略過、審核 API、新會員列表、未讀 badge、推播及手機/桌面互動驗收，仍需後續有權契約、內容權利、CI、實機與正式授權驗收。**此版本只有實際可切換的二級 UI 與安全限制，不代表通知已投入服務。**

依既有受保護 PR→CI→main merge→main CI→GitHub自動Production流程驗收。禁止直接 Cloudflare 發布與私人音訊稽核。進度以 Issue #3 頂端最新回寫為準。
