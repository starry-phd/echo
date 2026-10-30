# Echo PR #56｜舊版評價／心得收穫二級分頁安全版（2026-10-30）

依據原版 `yukidu/Echo-Starry/src/components/DetailView.tsx` 的評價區及 `CommentsSection`，新版過去只有一行歷史統計文字，沒有可切換的第二層版面。

本輪將 `/preview/[id]` 和 `/track/[id]` 共用 `LegacyEngagementDetail`：兩個可點擊、各48px以上的「評價／心得收穫」分頁。從既有 `Track` **正式公開 API** 的 `legacySnapshot/rating/ratingCount/commentsCount/likes` 讀取可信的**歷史彙總數據**；只在 `legacySnapshot===true` 讀取，缺少欄位顯示「未提供」而非 0，可信的真0才顯示0，非有限值/負數等拒絕。原有玫瑰主題、深色模式與字級設定保留，切換音檔時重設為評價。

**範圍與邊界：** 分頁有真實本地 UI 互動；不是登入後真實評論清單或可新增評價/心得/按讚。沒有向私有舊版 D1、R2、會員、評論、私人音檔發送請求，不揭露會員姓名/個人歷史，也不設任何假評分寫入權。訪客28張資訊卡仍不載入 AudioPlayer/串流；原有 public+verified 音檔播放 Gate 不變，Starry ID 會員 API 未核准前禁止真社交業務操作。Ads/付款/AI/貼紙/後台不變。112舊錄音 private/copied及0 public+verified 仍僅為先前快照，不能以 UI 視為恢復錄音播放。私人音訊完整性稽核 `audit-private-audio.yml` 仍需業主另行具體授權，**本輪不得執行**。

新增 `src/ui/echo/legacyEngagementSnapshot.ts`、`src/ui/echo/LegacyEngagementDetail.tsx`、`tests/legacy-approved-engagement-tabs.test.mjs`；改兩個詳細頁。需 PR CI 成功→受保護合併→main CI→唯一自動 Production→28/28安全公開驗收及Cloudflare版號核實後方可稱上線。手機/平板/桌機真機逐畫素與真會員互動未驗。
