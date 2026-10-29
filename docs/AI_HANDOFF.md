# 繁星回聲｜AI 接手入口

更新：2026-10-29（台灣）。**先讀 [Issue #3 頂端](https://github.com/starry-phd/echo/issues/3)，再查 main、PR、CI、Production run 和 Cloudflare。** 本檔是版本快照；Issue #3 持續記錄即時證據，不依聊天推定線上狀態。

## 已驗證里程碑

- 技術：React Native **0.88.1** + Expo SDK **58** + Expo Router + TypeScript strict；React Native StyleSheet、Echo 專屬玫瑰品牌及24主題；Cloudflare Workers Static Assets / Hono / Zod / D1 / 私有R2；版本化OpenAPI SDK、TanStack Query。不得另建Web-only前端。
- PR #14–17已合併。28張原版訪客資訊卡、照片、講師獎銜、唯讀歷史統計、新人2.4s彩虹框、講師姓名連結、熱門排序、裝置收藏／不喜歡已移植。
- 原待審 [Production #40843216888](https://github.com/starry-phd/echo/actions/runs/40843216888) **已先完成審批**，但Expo Doctor要求RN0.88.1，在upload前失敗。不要重跑舊SHA或稱其成功。
- [PR #18](https://github.com/starry-phd/echo/pull/18)修復RN patch及兩處版本guard；[PR CI #40844811791](https://github.com/starry-phd/echo/actions/runs/40844811791)與[main CI #40845068580](https://github.com/starry-phd/echo/actions/runs/40845068580)均success。
- **已正式部署**：[Production #40845273994](https://github.com/starry-phd/echo/actions/runs/40845273994)，release SHA `36cffe43977587b3d2de6009b44959cd776c0a03`。原production Environment審批、SHA雙重校驗、Worker+Assets upload、28/28圖片HTTP smoke、private audio 404全部success。
- Cloudflare於2026-10-29 **08:55:23 UTC / 16:55:23台灣**：Deployment `8e709f30-f426-4ac3-a820-effa670911c4`，Version `c9cb0032-9d9a-4fc7-97a4-53da603c9fad`，100%流量。這是該次release證據，之後版本須查Issue。
- 正式瀏覽器驗收：28/28圖片成功解碼、8個新人標籤、390×844 CSS viewport無水平溢出、桌面雙欄；收藏重載保留／取消、不喜歡28→27→重載27→還原28、拒絕分享、拆分講師連結通過。

## PR #19 已上線與後續修復

PR #19已合併並正式部署，release SHA `ed1262b2c1e0097a7a531aee6491d68008cc7a3c`：[PR CI #40848189420](https://github.com/starry-phd/echo/actions/runs/40848189420)、[main CI #40848492058](https://github.com/starry-phd/echo/actions/runs/40848492058)、[Production #40848841175](https://github.com/starry-phd/echo/actions/runs/40848841175)均success。Cloudflare deployment `59d2dd9a-f3a7-4705-ad4b-e01dcfba159b`，2026-10-29 09:22:44 UTC，version `dc61b95e-1f8b-4876-b041-0a26b3f4b7c9` 100%。

該版新增本裝置收藏清單 `/favorites`、全App共用收藏／隱藏狀態、Expo58相容AsyncStorage2.2.0（沿用既有Web keys）、獨立純資訊詳情 `/preview/[id]`、講師獎銜篩選、跨欄位多字AND搜尋、穩定分類選項，修正熱門排序的時間標籤、Web彩虹循環及responsive hydration。

- 偏好只存格式檢查後的音檔ID；不是會員同步或播放資格。讀取失敗時保留記憶體操作，不覆蓋未知的原偏好；儲存失敗向使用者明示。
- 收藏／詳情只解析當前公開catalog或既有28筆whitelist；不以本機ID讀私人內容。純資訊詳情不建立audio source。
- 講師獎銜是作品當時公開metadata的顯示篩選，不讀會員身份或提升權限；沿用原版去GAR／創辦人前綴規則。
- 搜尋用bound JSON token list及SQLite JSON_each交集，不拼入使用者輸入。public+verified與preview白名單gate維持。
- 該版68 tests及完整遠端CI通過；正式390px UI實測照片28/28、獎銜篩出9張、多字交集13張、分類在無結果仍保留、收藏頁／詳情取消／首頁同步、詳情無audio元素。彩虹transform兩次影格不同，重新載入未再出現原hydration/native driver警告。原生iOS/Android實測仍未完成。
- 21時續驗確認跨頁隱藏可由講師頁同步到首頁27張；同時找到桌面卡片彈出選單被下一排卡片遮住，造成部分選項點不到。不是儲存失效；修復改用React Native Modal及螢幕內定位。修復部署及重測狀態以Issue #3為準。
- 後續分支 `test/echo-private-audio-integrity-20261029` 同時新增只讀112筆原檔／複本完整SHA-256+逐筆前8秒解碼，僅上傳彙總artifact；詳見 `docs/12-private-audio-integrity-audit.md`。本機73 tests通過。**實際112筆run未成功前不可填媒體驗收完成，更不可改公開權限。**

## 部署與保護

- 使用者本輪已明確授權自主判斷、修復、測試、合併與正式部署，禁止繞過保護或擅自公開音訊；舊PR11「暫不合併／不部署」限制已被最新指示取代。
- Branch → PR → 必要check CI → GitHub允許的正常合併 → main CI → 精確40字SHA手動workflow_dispatch及confirmation → production審批 → upload及HTTP/UI驗收。禁止直接Cloudflare deploy繞過Environment。等待exact-SHA發布時不要先合併其他main commit。
- 2026-10-29 16:47讀回Rule #85496404：Require PR / Actions check / up-to-date / conversation resolution / no-admin-bypass ON；force push/delete OFF；**Require approvals OFF**，與早期一人批准快照不同。本輪沒有修改保護。不要聲稱目前要求獨立一人PR review，不擅自降低／改變設定。
- production required reviewer為yukidu，本輪兩次觀察waiting→approval→執行，非僅有設定畫面。

## 尚未完成的邊界

1. **音訊**：112/112 private/copied，0 public+verified。28張照片與資訊卡不是播放／分享授權。不得批次公開R2或把guestVisible當使用權。逐曲權利、完整解碼/Range及Web/iOS/Android播放仍待驗收。
2. **Starry ID/Battery**：只接正式可信契約；Echo不持有會員主檔、不讀中央D1、不沿用舊密碼/session。2026-10-29重查starry-phd/id main `a1d3ced10e2bbeed03434b4747fa7f003fae55ac` 的apps/api/openapi.yaml，仍明示DRAFT/not deployed，僅/v1/health liveness，沒有authenticated user/admin endpoints。離線Auth候選source不是正式登入API。
3. **原版剩餘功能**：網友關鍵字、完整詳情／評論／評分／按讚、AI/逐字稿、會員收藏及進度同步、排行榜、VIP/貼紙、通知、管理上傳、背景／離線播放仍須逐項契約、資料權利及端到端驗收。可安全移植的顯示功能繼續小PR，不用假狀態補齊。
4. **Native/商店**：EAS profiles存在，沒有實際iOS/Android build、簽章、實機或商店Sandbox證據；不得宣稱已上架。AsyncStorage程式及測試不代替真機驗收。
5. **營利**：AdMob Mediation定案但Ads OFF，無真SDK／廣告請求；RevenueCat未初始化；商店發布未核准。
6. **隔離**：不動H-Global，不刪原yukidu/Echo-Starry或舊R2/D1，不改DNS，不公開私人檔案，不將Secrets放入commit/Issue/log。

## 接手工作方式

- 以同一Issue #3持續更新最新頂端；每次里程碑寫明SHA、PR、CI、deployment、實測、未測範圍及下一步，Issue保持open直到真正完成。
- 原版唯一參考yukidu/Echo-Starry；重點為AudioCard.tsx/CSS、App.tsx、DetailView.tsx、SpeakerProfilePage.tsx、shared/speakers.ts、src/utils/ranks.ts。
- 規範參考starry.app.json、docs/adr/0002-starry-v13-framework.md、docs/11-legacy-card-parity-audit.md。其他文件可能保留過時Expo57、R2未搬或圖片未完成快照，按新證據辨識。
- 每批跑必要檢查，不降低guard、不重複觸發workflow、不高頻輪詢。權利或契約不足時記錄具體阻塞，繼續不依賴它的工作。
