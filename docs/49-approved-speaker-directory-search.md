# 49｜講師名錄：已核准資料的本地姓名搜尋

## 舊版差異與本批修復
- 新版 `/speaker` 先前只提供講師卡片的完整清單，手機使用者若要找單一講師需要逐張滑動。
- 這批新增可操作的「搜尋講師姓名」輸入列及「清除」，保留原本玫瑰主題、RWD 單欄卡片、觸控 ≥44px、讀取錯誤/重試/部分成功提示。
- 忽略查詢前後空白、名稱中空白、全半形差異和英文大小寫；最多 80 字，遇到非法控制字元 fail closed；無符合條件時明確顯示搜尋結果為空，不會宣稱已不存在。
- 只針對 `visibleSpeakerDirectory()` 已由 **當前 public speaker API + 已核准 28 筆 metadata-only guest previews** 合併、再依本裝置隱藏講師/卡片剔除後的畫面資料進行本地篩選，不會向 API 發送姓名查詢或讀取舊版私人名錄，不能透過搜尋找回被隱藏的封面。
- 保留 `ready` hydration gate，不會在本機偏好尚未讀取完成時顯示講師或封面。搜尋不提供播放/分享/會員權限。

## 變動與測試
- 新增 `src/ui/echo/approvedSpeakerSearch.ts`，修改 `app/speaker/index.tsx`，新增 `tests/approved-speaker-directory-search.test.mjs`。
- 用 Node 回歸測試確認中英姓名/全半形/空白、非法輸入、未突變統計資料、已隱藏講師/卡片不會重新出現，以及 UI 確實使用本地核准清單。
- PR CI/受保護 main CI 必須通過；若合併觸發既有唯一自動 Production，依 exact SHA 核對 GitHub Actions、Cloudflare Worker 100%、28/28 核准封面/no-store 與未授權 audio/cover 404/no-store，才可標示 Web 已上線。

## 不包含
沒有修改 Worker/D1/R2/Starry ID、音訊權利/串流、私人音訊、AI、Ads/金流。沒有執行需獨立授權的 `audit-private-audio.yml`。舊版完整 1:1、真人會員功能及 iOS/Android 真機上架仍未完成。
