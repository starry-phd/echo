# 繁星回聲｜舊版功能與 Expo 58 v1.3 移植盤點（2026-10-29）

## 來源與權威界線
- 舊版 GitHub：\`yukidu/Echo-Starry\`。本盤點依可讀的舊 Repo 目錄與部分原始碼；**源程式存在不代表舊功能在線或新案已核准照搬**。
- 新版 GitHub：\`starry-phd/echo\` PR #2（Draft）；新系統以 Starry 生態系 v1.3 技術基座、模組唯一資料擁有權及新的中央 Auth 契約為準。
- 標記：**已建置**指新 PR 中有候選程式；**尚待端到端驗收**及**依賴其他模組**不得宣稱功能已正式遷移。

| 舊版可辨識功能 | 舊版來源範例 | 新版進度 | 後續阻塞／安全規則 |
| --- | --- | --- | --- |
| 音檔清單、關鍵字／講師名稱搜尋、分類 | \`src/App.tsx\`, \`src/components/AudioTrackList.tsx\` | 已建置公開目錄與類別、搜尋 | 新 R2 尚未複製；只顯示 public + verified |
| 音檔詳情、播放、進度拖曳基礎 | \`src/components/DetailView.tsx\`, \`src/components/MiniPlayer.tsx\` | 已建置單筆公開詳情 API、原生／Web 播放入口、HTTP Range | 實機播放與 R2 實際內容待驗 |
| 講師專頁、講師介紹／問答 | \`src/components/SpeakerProfilePage.tsx\`, \`src/components/SpeakerNameLink.tsx\` | 尚未移植 | 名片、權限及 AI 摘要內容不得照搬未驗證權限 |
| 會員收藏、播放紀錄 | \`src/utils/offlineAudio.ts\`, \`src/components/DetailView.tsx\` 等 | 僅有 Echo D1 預留結構 | 需 Starry ID／DEV-D API，會員未授權前禁止寫入 |
| 上傳、音檔管理、社群音檔 | \`src/components/AudioWorkspacePage.tsx\`, \`src/components/UploadModal.tsx\` | 尚未移植 | 管理／上傳需 Starry Admin scopes、後端檔案類型與大小驗證、稽核 |
| 留言、評價與分享 | \`src/components/CommentsSection.tsx\`, \`src/components/ShareModal.tsx\` | 尚未移植 | 留言需身分、審核與防濫用；分享只可公開安全路由 |
| 逐字稿與 AI 問答 | \`src/components/TranscriptQaAdmin.tsx\`, \`src/components/AiQuestionSettingsAdmin.tsx\` | 尚未移植 | DEV-A／AI／權限、費用及內容審核規格尚需確認 |
| 舊登入、會員資料、獎銜 | \`src/authSessionPolicy.ts\`, \`src/components/ProfileModal.tsx\` | 只保留 Starry 中央 API 插槽 | 舊 Session／密碼／管理員繼承一律禁止；Starry ID 在獨立服務中開發 |
| 音訊離線／背景播放 | \`src/utils/offlineAudio.ts\`, \`src/mediaSessionPolicy.ts\` | 僅有 Expo audio 基礎設定 | R2、平台 DRM／授權、背景及離線可見性待驗 |

## 本輪修正的具體問題

舊版講師及音檔列表具大量內容，新版第一版 \`/api/v1/catalog\` 為有限（最多 100 筆）目錄。**不應**再讓音檔詳情頁從前 100 筆列表查找某個 id：加入 \`GET /api/v1/tracks/{id}\` 的單筆公開音檔 API，只有 \`visibility='public' AND migration_status='verified'\` 才返回已安全裁切的資料，404 不揭露私有／尚未驗證內容。新增 OpenAPI → SDK → App Route → CI 契約與安全測試。後續可按需增加真正的分頁，不把音檔 100 筆上限當作資料總量。

## v1.3 強制保持的界線

- **Ads**：Google AdMob Mediation 已選，但 Ads OFF；不得初始化、投放或建立真 Ad Unit。
- **Billing**：RevenueCat 為方向；商品只可非消耗永久買斷、月／年自動續訂；購買需先驗證 Starry ID，同一 App 會員的有效權益跨 iOS／Android 規則待 Sandbox。
- **D1/R2**：Echo 專屬音檔資料庫保留；中央會員資料由另一個 Starry API 服務主責，暫定獨立 D1 \`id-starry\`。
- **Legacy**：舊 App 與舊 Cloudflare 不刪；影音 metadata 暫保持 pending/private，不改成 verified/public。
- **部署**：本 PR 為候選、CI 不等於部署、EAS 原生 Build／正式網站及商店仍未驗收。未經當次明確授權不合併、不部署、不付費。
