# 50｜回歸原版選單：移除不存在的獨立「講師作品」入口

## 原版真實證據
- `yukidu/Echo-Starry/src/components/Navbar.tsx`（最新 main）：主選單沒有獨立「講師作品」項或可釘選的講師名錄。
- `src/components/SpeakerNameLink.tsx`：點擊卡片中的單一講師姓名，派送 `echostars:open-speaker`。
- `src/App.tsx`：相同畫面上的 compact 演講者個人資訊 dialog。
- `src/components/SpeakerProfilePage.tsx`：人物摘要、「所有錄音」、「歷史問答」、會員權限篩選，以及播放前確認；目前公開 API 未提供真人個資、逐字稿、會員問答或私人媒體授權，不能虛構。

## 本批實際修復
- 新版 `LegacyHeader` 原先擅加「講師作品」主選單與可釘選快捷。正式撤下這個舊版不存在的入口，不添加替代新功能。
- `quickActionStore` 將 `speakers` 從允許選單移除，也會自動忽略過去本機儲存的該捷徑，不影響其他已儲存捷徑。保留原本裝置型態、數量上限及可操作的排序。
- 已核准卡片／兩種合法詳細頁的**講師姓名連結仍可點**，已有按講師準確比對與隱藏安全 Gate 的個別頁。獨立目錄 route 目前為既有歷史路由、主選單不提供入口；後續另批逐項比對並恢復原版 compact modal，不能把舊版未有的名錄當作完成 1:1。

## 權利與部署
不更動 Worker/D1/R2，私人音訊、媒體公播 Gate、Starry ID、廣告、金流與 AI 均不變；不運行需獨立授權的私人音訊稽核。須 PR CI、protected merge、main CI、唯一自動 Production、28/28封面/no-store與私有串流404、Cloudflare 100%驗收後才標記 Web 已上線。
