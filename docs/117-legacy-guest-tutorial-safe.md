# 117｜原版首頁新手導覽：安全訪客版

## 雙邊來源證據
- 原版 `yukidu/Echo-Starry/src/App.tsx` 539～556 行：`showHomeTutorial`、不再提醒及三種舊偏好 key；2519～2548 行：`TutorialSpotlight` 引導回首頁、會員入口、點封面與不再提醒。
- 原版 `src/components/TutorialSpotlight.tsx` 有可關閉導覽及「打勾不再顯示新手教學」控制。
- 新版 `starry-phd/echo/app/index.tsx` 已具公開訪客卡、回首頁、裝置收藏及安全播放拒絕，但沒有首次進入新手導覽。

## 本批限縮移植
- 加入可關閉的 React Native/Expo Web 導覽，保留原版「回首頁／照片操作／不再提醒」目的；先只教已核准的訪客操作。
- 舊版文案「點照片播放／暫停」或「註冊會員即可解鎖」目前不得照搬：28 張封面僅資訊展示、112 筆音訊 private/copied，Starry ID Auth 尚無正式核准可用的會員契約。因此本版明示 **照片不代表播放授權**、收藏只屬本裝置、正式會員／付費與私人音訊不可用。
- 讀取原版三種 opt-out localStorage key；原版已選「不再提醒」者不被新導覽打擾。新版另將 opt-out 寫入 AsyncStorage；Web 勾選不再提醒也同步原三 key。單純關閉只抑制同次 App 執行期間，維持原版選項意義。
- 僅在裝置偏好載入、當前公開資料已 ready、且有可見已核准卡片時顯示；等待資料、無結果或私密／不合法列表均不彈窗。
- 若本機儲存讀取失敗，不自動打斷訪客；勾選永久不再提醒卻寫入失敗時保留對話框並顯示儲存失敗，避免假稱已記錄設定。

## 測試／釋出邊界
`tests/legacy-guest-tutorial.test.mjs` 覆蓋舊版偏好鍵、公開清單準備 gate、導覽註冊及必要文案。正式 CI 的 TypeScript、Lint、所有單測、未簽章 Hermes iOS／Android、Expo Web、Wrangler dry-run 仍須全數綠燈，並於既有受保護合併後使用唯一 auto production（不可自行觸發第二部署）。

本批不改 Worker/OpenAPI、資料庫、R2、Starry ID、正式域名、商店提交、廣告或金流。導覽是安全的原版目的移植，**不是原版逐像素 Spotlight 幾何效果或真實裝置導覽驗收**；後者仍待真機 VoiceOver/TalkBack/PWA E2E。28/28 訪客資訊/封面以及 28/28 guest stream HEAD 404/no-store，必須在 Production 後沿既有 Gate 複核。
