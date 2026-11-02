# Claude 交接附件 C｜全量需求、路由／API、完成狀態與跨生態系依賴

**截至 2026-11-02 的產品／開發狀態；實際接手須重新驗證 GitHub [Issue #3](https://github.com/starry-phd/echo/issues/3) 和所有 Repo 現行 main。**

導覽：[Claude 主交接](CLAUDE_DEV_HANDOFF_2026-11-02.md)｜[原版 607＋新版 381 全檔路徑／52 組映射](CLAUDE_OLD_NEW_PATHS_2026-11-02.md)｜[發布與安全手冊](CLAUDE_RELEASE_OPERATIONS_2026-11-02.md)。

## A. 系統定位與核心原則

- **產品**：「繁星回聲 Echo Starry」，要把舊版 `yukidu/Echo-Starry` 的**經核准**產品功能、文字、介面及合理互動安全移植到新 Expo App `starry-phd/echo`，不能變成另一套不相容的 Web-only 前端。
- **三個系統必須清楚分離**：Starry/繁星生態系中央會員（獨立 `starry-phd/id`）、Echo 音訊 App（本 Repo）、H-Global/寰宇全球生態系。資料與身份主權各自清楚，跨系只經版本化的中央 API、核准的用途與授權執行。Echo 自己的 D1 不是 Starry ID 會員主資料庫。
- **原始素材**：兩 Repo `public/icon-192.png`、`icon-512.png` 已存在且 Git blob 相同，不能自行重畫 Logo 或用 Emoji 代替；#141 已恢復 `icon-192.png` 的真正品牌圖示，動態音波尊重 reduced-motion。
- **先對照舊版**：舊版 JSX + 最後實際生效 CSS + 原始資源 + 完整功能操作，不只是看截圖；安全上不允許照抄舊的 deviceId、Auth/session、管理資料或媒體 API。
- **不要把 UI 當成已啟用**：已顯示的卡片、資訊按鈕、收藏、統計或登入進度提示，可能只是安全公開外殼。本文件用「已完成／部分／阻擋／待設備驗收」明確區分。

## B. 新版全部路由與對應需求

| Expo 路徑／URL | 需求／目前狀態 |
|---|---|
| `app/_layout.tsx` | 共用 App root + Header／Providers，已存在 |
| `app/+html.tsx` | Expo Web HTML，已存在 |
| `app/index.tsx` ／ `/` | 公開首頁、卡片、分類、搜尋、排序、抽選、Footer，**已部署公開訪客功能** |
| `app/preview/[id].tsx` ／ `/preview/:id` | 28 件 guest 核准資訊卡詳情，metadata only，**無錄音播放** |
| `app/track/[id].tsx` ／ `/track/:id` | 僅真正 verified/public 才可進入合法媒體流程，目前音檔 0 verified，**不能視為可播** |
| `app/speaker/index.tsx` ／ `/speaker` | 已核准公開講師索引／搜尋 |
| `app/speaker/[name].tsx` ／ `/speaker/:name` | 舊版講師個人資料彈窗、公開作品列表、可讀取更多、歷史問答**未對接 AI** |
| `app/stats.tsx` ／ `/stats` | 公開唯讀排名與歷史統計；非完整私密排行榜 |
| `app/favorites.tsx` ／ `/favorites` | 本機收藏、我不喜歡、隱藏／個別還原；**未做中央會員同步** |
| `app/profile.tsx` ／ `/profile` | 個人中心／登入進度的安全外殼；**中央會員 API 未部署** |
| `app/notifications.tsx` ／ `/notifications` | 已有安全 UI；真正私有通知／申訴／回覆依中央鑑權與 DEV-H 待對接 |

## C. 確實完成並通過 PR／Production 的公開訪客功能

以下「已完成」僅表示**程式、CI 與既有公開 Web Production 安全驗收**；不代表原生真機操作已完成：

1. **28 件允許公開的訪客 metadata-only 資訊卡、28 張核准封面**：現有政策 `policy=2`，標題、講師、類別、獎銜、公開日期、已核准歷史統計。正確顯示及手機／桌機版型、卡片彈出功能、詳情。**所有音訊 stream 仍 404/no-store**。
2. **公開搜尋與篩選**：依核准講師、標題、分類／獎銜、可使用的 metadata 做 multi-term AND 搜尋；建議只有已核准分類，不得把舊站未驗證的「網友關鍵字」當可見資料。空結果保留分類顯示；可重設。考量獎銜去頭銜／共同講師姓名精確匹配。
3. **排序與數字**：最新／最舊／公開歷史評價、喜歡、留言等；沒有公開數據時視為「未提供」不是編 0，不以不可信資料抬升順位。需要 stable paging/partial failure retry，不能以 API 暫時故障顯示「真的沒有作品」。
4. **分類及講師連結**：拆分共同講師、公開講師彈窗及列表、可查看更多核准作品，支援原版作品時間／獎銜展示。任何名稱/URL 不足以使未授權項目可見。
5. **公開視覺**：原版 React Native 尺寸／玫瑰色系、24 好心情主題、深／淺、本機字級 100–140%、彩虹「新人」標籤、公開封面、資料卡、選單定位。
6. **個人化只在本機**：收藏與取消、我不喜歡隱藏／還原、隱藏講師、不同版型快捷列釘選／排序／重設、主題／字級／教學偏好。應保持 storage read/write failure fail-soft、不能覆寫無法讀取的未知舊值。
7. **「召喚繁星解答」安全抽選**：只在目前合格、可見、當次已取得的公開資訊卡中作視覺抽選；不會播放私人音訊，不會宣稱能真正提供私有錄音答案；可取消、可看卡。
8. **安全詳情／回頂／本機互動**：首頁與詳情浮動回頂、已核准公開摘要、歷史統計唯讀模組、裝置偏好按鈕；真正評分、留言和音訊分享需獨立授權，不得假稱上傳成功。
9. **原版主選單**：品牌標誌、菜單、可用的快捷功能、選中狀態、手機/桌機滾動及保護；原版 member/admin/sticker 操作如需鑑權則顯示待整合。
10. **新手教學 #132～#138**：Logo → 訪客主選單 → 第一張核准公開卡片三個步驟；Web 真實元件 spotlight 幾何、ResizeObserver 和**只監控已批准公開卡片 grid**的 MutationObserver；RN Native 安全文字對話框、skip 和「不再提醒」即時持久化、取消勾選；後續定位狀態失效需 fail closed。
11. **訪客暱稱 #139**：原版 20 正面形容詞 × 20 動物 Emoji，重開改變、避免連續重複；本機僅記上一個顯示文字，**不儲存 deviceId、不登入、不追蹤或發 API**。
12. **公開改版紀錄 #140**：首頁 Footer 「！」顯示只有新版已部署的功能摘要，截至 2026/11/02，**不是原版全部 v3.x 版史**；舊 Admin changelog 編輯不能移植。
13. **原版真正品牌 Icon 與四條音波 #141**：使用新舊 byte-identical `public/icon-192.png`，不用麥克風 Emoji；四條 1150ms 動畫錯開140ms、主題色、reduced-motion 及卸載停動畫，原版最新版 CSS 明確把舊 ping 與發光文字效果關掉。品牌教程前兩個 DOM 子元件仍是圖示+文字。
14. **安全公開資訊的匯出／分享基座**：只有現有公開且符合再次 server-side 驗證條件的資料才可輸出；不得將 28 guest 封面的存在誤認音訊可分享／可播。已有安全模組，不等於分享私密錄音功能已開通。
15. **PWA／安裝圖示與導引**：manifest、原圖素材與提示元件存在，不能宣稱所有手機安裝、離線操作、瀏覽器不相容情境已真測。

歷次已合併 PR 覆蓋 #1～#141，詳細工程逐 PR 的證據以 Issue #3 及 Repo `docs/` 為準；**不要用最初 docs/06 功能盤點（較早期快照）誤判以上功能沒做**。

## D. 尚未完成／受權限阻擋的真需求（不得用假資料硬做）

| 需求 | 狀態 | 真正啟用前需要的依賴／可安全先做的工作 |
|---|---|---|
| **112 件私人音訊及實際播放** | **BLOCKED** | 逐曲著作權/授權、verified/public 分級、R2 音訊內容稽核單獨核准、Range/MIME、Web/iOS/Android 真機；可先做不讀音訊的公開 UI |
| **播放／暫停／Seek／速度／上一首／下一首／MiniPlayer／背景播放** | **BLOCKED** | 合法 playable API 契約與資料 + 權限，真機測試；舊 `src/components/MiniPlayer.tsx` 僅可作交互參考 |
| **離線下載／PWA Service Worker 音檔快取** | **BLOCKED** | 可離線授權、過期/撤銷、加密／資料清理；絕不能搬原版 `public/sw.js` 私人快取 |
| **Starry ID 真登入、會員主資料** | **BLOCKED** | `starry-phd/id` 正式 deployed OpenAPI/issuer/audience/scope/PKCE/session revoke，Echo 僅使用中央 API；不得複製舊密碼/session |
| **Starry↔H-Global 雙向會員資料同步** | **BLOCKED / 中央專責** | 雙方帳戶所有權證明、同意／法律依據、版本/衝突/CAS/撤權/刪除/稽核；Echo 無權直連 H-Global D1 |
| **會員跨裝置收藏、進度、個人頁** | **BLOCKED** | 中央驗證身份、會員資源授權、API/資料保留刪除規範；本機功能不可冒充 |
| **真正留言、按讚、評價、社群／通知** | **BLOCKED** | 真會員主體、反濫用、可見性、隱私、審查、發送/撤銷權限；現在只有公開歷史唯讀數字 |
| **VIP／等級／限定音訊** | **BLOCKED** | 中央會員資格及新 Echo 後端 policy，不能信任舊頁面標籤或裝置資料 |
| **Starry Battery／貼紙／獎勵／扣發** | **BLOCKED / 中央專責** | 特定 DEV-A/API、權益原子性與風控；不可將舊 `worker/batteryRouter.ts` 直接引入 |
| **AI 講師摘要、歷史問答、逐字稿、LLM/RAG** | **BLOCKED** | 私人語料使用權、模型/成本/審核、人員資料授權與正式 API；空白 UI 不能冒稱有 AI |
| **音檔上傳、管理、分類編輯、舊超級管理員權限** | **BLOCKED** | 安全後台 Auth、最小權限、資料審查、稽核與新 D1 接口；不使用舊 admin API |
| **Google AdMob Mediation 廣告** | **OFF** | Provider 已選但 SDK 未初始化、AdRequests 禁止、Consent/Privacy/Store 審核需獨立核准 |
| **RevenueCat 內購與訂閱** | **NOT INITIALIZED** | 僅選 provider，沒有產品／entitlement/SDK/商店 sandbox；需真 Starry ID、Apple/Google合規 |
| **App Store／Google Play 上架** | **未授權、未驗收** | Expo EAS signing、bundle／privacy data、商店憑證、圖文、沙盒/真機、審核；`storeSubmissionAuthorized=false` |
| **Chrome/Safari/PWA、iOS/Android、VoiceOver/TalkBack 真 E2E** | **待實測** | 需真瀏覽器與設備／授權環境，不能拿 CI 或模擬 HTML 作證 |
| **舊正式 `echo.starry.phd` 切到新 Worker** | **未核准** | 所有資料、Auth、播放、安全、商業與使用者正式 cutover 核准；目前舊 domain 應維持原 Worker |
| **舊 R2/D1 清理／轉移後刪原資源** | **禁止擅自進行** | 另需完整回復/備份/資料保留與主體同意；目前原資源必須保留 |

## E. 中央會員契約的已知精確五欄

`docs/02-central-member-api-contract.md` 和 `src/auth/centralMemberContract.ts` 有**預定** `GET /v1/starry-id/members/me` 回傳五欄：
`s_user_id:string`（穩定不透明 ID）、`display_name:string`、`directory_opt_in:boolean`、`display_name_public:boolean`、`profile_revision:positive safe integer`。

**此路徑是規格需求，不是已部署 API。** 2026-11-02 查 `starry-phd/id` main `dd05316794c4fc47c1ba3b8e9e214fb33d617840` 的 `apps/api/openapi.yaml` 仍 DRAFT/not deployed，當時只列 `/v1/health`。不要以 Echo 端自行 REST 偽造或直查中央 D1，不能以相同 Email、姓名、手機自動合併 Starry 與 H-Global 帳戶。

## F. 與其他模組／第一波工程包的關係

這些都是**跨生態系規格／依賴**，不表示 Echo 需要自行開發全部：

| 第一波模組 | 專責內容 | 與 Echo 的關係 |
|---|---|---|
| DEV-A / AI-3 | Starry Battery 電池艙 | 權益資料和反重領由專責 API；Echo 不直接寫 |
| DEV-B / AI-2 | 數位 Billing、訂閱、內購 | 產品與 RevenueCat、Apple/Google 批准後才接 |
| DEV-C / AI-2 | H-Global 實體票券與 PAYUNi | 與 Echo 的數位播放權不同系統，不可混收 |
| DEV-D / AI-1 | 雙獨立 Auth 與登入安全 | 分離 Starry/H-Global 身份主體；Echo 消費 Starry 驗證 |
| DEV-E / AI-1 | 會員資料、名片與搜尋 | 經中央有權限的欄位 API；不可把 Echo 卡片資料當會員名錄 |
| DEV-F / AI-1 | H-Global 教育中心、獎銜與職務 | 獎銜/職務權威不等於每筆音訊可播 |
| DEV-G / AI-4 | OpenAPI、SDK、API 管理／跨系同步 | Echo 公開 OpenAPI 與中央相依契約都要版本化 |
| DEV-H / AI-3 | 通知、申訴、隱私、稽核與復原 | 真通知需要會員權限、內容可見性及稽核政策 |
| DEV-I / AI-4 | React Native／Expo、商店、DevOps | 本 Repo 跨平台基座／CI／EAS／Workers 發版 |
| AI-0 | 九模組總管及整合驗收 | 裁決跨模組衝突、嚴格驗收與發版節點 |

**標準與交接來源文件**（需接入使用者已提供的 Google Drive 存取、依最新版確認）：

- [最新開發技術規範](https://docs.google.com/document/d/1urLja9i9A63jHuz4jQPhPMTgoCtoq-i1TafXPQd3PYU)
- [開發基座技術規範 v1.3 廣告平台定案版](https://docs.google.com/document/d/1wHBuIJCA1cMhLcI25MR_EYEdgmpXmzXx_D0UlEWHBAQ)
- [第一波《開發清單交接包》](https://docs.google.com/document/d/1o9luZIfaeMVBVT5XWD4fSiFHtG3F-viqNbsjmtoq_Cw)
- [第一波 AI-0 總管交接包](https://docs.google.com/document/d/1R_iEz9TC4p-z7V3EZlDmRNoB_pPa319z8SF0eCugkSQ)
- [第一波 AI-4 OpenAPI／Expo／DevOps（DEV-G／I）](https://docs.google.com/document/d/1dUpVy_FPZjqVTJJJvMCAIWty_dn8Vf0VCvjN10XOnoc)
- [DEV-G OpenAPI／SDK 專責包](https://docs.google.com/document/d/1ZHgNd7tvaddQVvaGZHZbmF3UrQwpqOUaxrYEzW3X_xk)
- [DEV-I Expo／DevOps 專責包](https://docs.google.com/document/d/1dsMcGBT5PO43aQVMhZOBO5uyNTE8QHYSnBmC4y2rMSI)
- [第一波 GitHub AI 自動化合規與防封鎖 SOP](https://docs.google.com/document/d/1yEhoMtLL-WN8r-AOPl66tyQCuH3cOukh_CD3bOYgnCA)

此處僅提供**由使用者事先配置的權威文件 URL**和分工，不以標題推論其中尚未核實的細節。確切需求、最新版本、跨品牌資料法遵以當前有權限的文件本體和使用者最後指示為準。

## G. 建議 Claude 安全地排優先順序

**先做**：根據舊版可直接證明的新舊 UI 差異，選公開訪客不涉及私人媒體及 Auth 的完整可驗收功能。每次都包含 RN 實作、source 路徑、失敗狀態、無障礙、單元/整合測試和正式安全 Gate。

**同時可以做**：不讀私人媒體的 Web 實際 UI／a11y／reduced motion 驗收、CI 健全性、深連結回退、公開標籤文字準確性、D1/R2 私有 gate 靜態與 HEAD 拒絕測試。需要設備或雲端權限時先確認是否有權限再宣稱驗收。

**不要先做**：直接把舊版會員、私有播放、付費、貼紙、AI、管理面板移植成「看起來可用」；不得啟用新計費資源、顯示未核准資料或做音訊 GET 稽核。

**完成定義**：單批有來源、程式、測試、正常 GitHub 受保護 PR、精確 main CI、唯一 auto Production、28/28 no-store 與 private 404、CF latest/exact100%、舊網域未變、Issue #3 詳細可讀回交接。沒有這些證據就只報「候選／進行中」，不報正式完成。
