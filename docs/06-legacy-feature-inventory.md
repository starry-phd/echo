# 繁星回聲｜原版功能移植盤點

更新2026-10-29。唯一原版參考`yukidu/Echo-Starry`；新案`starry-phd/echo`採Expo58/RN0.88.1、Router、StyleSheet及Starry v1.3架構。最新main、CI、Production與驗收一律先讀[Issue #3頂端](https://github.com/starry-phd/echo/issues/3)。本表不把原版有程式碼、候選碼或CI當作功能已正式完成。

## 已部署到PR20的範圍

| 原版功能／來源 | 新版實際狀態 | 剩餘依賴與界線 |
| --- | --- | --- |
| 首頁清單、照片、姓名、獎銜、分類；`AudioCard.tsx`/CSS | 28張核准訪客資訊卡及28張照片；8個新人彩虹框、拆分講師連結、歷史星級／按讚／心得數（唯讀） | 私人錄音不因展示照片而可播放／分享；84筆未核准metadata不公開 |
| 搜尋、分類及排序；`App.tsx`/`v145FourFilterToolbar.ts`/`utils/ranks.ts` | 已准許欄位多字AND、穩定分類選項、獎銜篩選、時間及三種熱門排序 | 網友關鍵字及收藏人數無可信新API，不虛構 |
| 音檔詳情；`DetailView.tsx` | `/preview/[id]`純資訊詳情已部署；公開音檔單筆API及播放器/Range候選程式具安全測試 | 全部112仍private/copied，0 public+verified，沒有真實公開音檔播放驗收 |
| 講師專頁；`SpeakerProfilePage.tsx`/`SpeakerNameLink.tsx` | 講師列表、拆分姓名連結、核准照片與安全作品頁 | 簡介、AI問答、名片不得擅自照搬未核准內容 |
| 本機收藏與偏好；`AudioCard.tsx` | 全App共用AsyncStorage裝置收藏／隱藏、收藏清單；PR20 Modal修復選單被下排遮住，正式回歸通過 | 不宣稱會員或跨裝置同步；不喜歡另依使用者明確需求新增 |
| 24主題、深淺模式、好心情；`utils/theme.ts`/`App.tsx` | 24色UI已部署；下一批修復原生持久化、隨機另一色及主題底色，待該PR CI/部署 | 外觀只存本機，無中央會員或資料權限 |

## 仍須逐項移植與驗收

| 原版功能／來源 | 具體未完成項目 | 依賴 |
| --- | --- | --- |
| 會員、個人資料與獎銜；`authSessionPolicy.ts`/`ProfileModal.tsx` | 中央登入、登出/revoke、可信user/admin scopes | Starry ID正式契約；目前公開OpenAPI仍DRAFT/not deployed、僅health；不讀中央D1或沿用舊session/密碼 |
| 播放、續播、背景及離線；`MiniPlayer.tsx`/`mediaSessionPolicy.ts`/`utils/offlineAudio.ts` | 逐曲權利、全長/抽段解碼、HTTP Range與四端實測、平台音訊中斷 | 私人音檔完整性稽核尚0 runs，自動核准審查阻擋Runner下載／彙總artifact，需具體核准；不得批量公開 |
| 收藏與播放紀錄同步；`DetailView.tsx` | 會員收藏、學習進度與跨裝置同步 | 中央身分與Echo業務API；不能把裝置收藏當會員資料 |
| 心得、評價、按讚及分享；`CommentsSection.tsx`/`ShareModal.tsx` | 寫入、審核、防濫用、公開安全分享 | 中央身分、內容權利與新業務API；歷史aggregate唯讀 |
| 排行榜；`StatisticsView.tsx`/`KeywordsTab.tsx` | 模範生／會員／熱門關鍵字及新即時統計 | 不公開舊會員名單或個人學習資料；需可信scope與統計契約 |
| 通知；`NotificationsView.tsx` | @提及、審核、會員晉升與快速回覆 | 中央身分、Echo事件API與收件人授權 |
| VIP、貼紙與付費；`StickersModal.tsx` | entitlement、貼紙扣發、VIP/特定帳號內容權限、商店Sandbox | Starry ID/Battery契約；RevenueCat未初始化，Ads OFF，不沿用舊權限 |
| 上傳、管理、社群音檔；`AudioWorkspacePage.tsx`/`UploadModal.tsx` | 管理scopes、檔案驗證、審核與稽核 | Starry Admin及Echo業務API；不直接開放寫入 |
| 逐字稿／AI；`TranscriptQaAdmin.tsx`/`AiQuestionSettingsAdmin.tsx` | 內容權利、AI權限與費用、管理及引用 | 未核准API、資料與費用前不偽造摘要或問答 |
| 原生與商店 | PR20 iOS/Android Hermes export成功；簽章Build、安裝、真機、商店Sandbox未驗 | EAS project/credentials及商店核准；Web部署不是App上架 |

## 資料與部署事實

- R2跨帳號複製已完成：來源有效596物件／3,122,987,926 bytes，新端相同；舊端保留。不要沿用早期「新R2為空」快照。
- 112音訊全private/copied；28卡whitelist、28封面與歷史metadata已在D1。原版guestVisible只控制清單展示，不能作播放使用權。
- 最新已驗證release至PR20：`bc8f5f9d9f39afe42172acae4c5d4a20107c6287`；Production #40881561931 success、Cloudflare deployment `c0c5b7f2-ee28-401a-8271-208d7f78625e`。見`docs/13-work-ui-acceptance.md`修復前後截圖與實測限制。
- 本輪已獲自主開發、合併及正式部署授權；仍走受保護PR/CI/main CI/精確SHA手動Production及Environment審批，不改保護、不直推main、不直接Cloudflare發布繞過gate。
- AdMob Mediation已定案但Ads OFF、RevenueCat未初始化；不動H-Global、不刪舊系統或媒體、不改DNS、不將Secrets寫入repo/log/Issue。
