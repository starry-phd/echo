# 2026-10-30｜本機「我不喜歡」重載閃現與講師封面修正

## 發現
- PR #33/#34 將本機單卡與演講者隱藏套用於多頁；然而 `DevicePreferencesProvider` 透過 AsyncStorage 非同步 `hydrate()`，初始值是空白且 `ready=false`。原首頁與講師目錄在 API 比偏好先讀完時，可能短暫呈現使用者已隱藏的講師、音檔卡、封面，然後才消失。
- 講師目錄在組合 28 張核准訪客卡的照片及收錄數時，僅濾演講者級隱藏、**未排除單張 `dislikedIds`**；講師作品頁的頂部照片也直接從 `p.data` 取第一張，可能取到已隱藏卡的照片。

## 已修
1. 首頁內容卡列表要在 `ready=true` 後才開始渲染；偏好讀取期間顯示 spinner，抽選按鈕不可啟動，訪客卡片數顯示「—」，避免暴露短暫的未過濾內容與誤觸。
2. 講師目錄在 `ready=true` 之前不顯示列表；新的純函式 `src/ui/echo/visibleSpeakerDirectory.ts` 僅處理**目前合法讀取的 public speaker aggregate 和 guest preview allowlist**，略過單卡已隱藏 ID 和演講者隱藏。訪客卡片對目錄的照片與數量貢獻一併排除；仍遵守拆分姓名及原先排序。
3. 講師作品頁在偏好讀取期間不顯示卡片，也不顯示封面；首圖只挑未被單張或講者級隱藏的當前核准 guest preview。沒有合適照片則顯示既有的姓名字首 fallback。
4. 新增測試驗證單卡/合講者隱藏後封面不回顯、預覽卡計數調整、Hydration 前畫面及抽選 Gate。
5. **界線**：公開講師 API 的 `trackCount` 是後端彙總數，並不是本裝置的逐曲名單；本輪只能精確扣除可辨認的核准 guest preview，不能假稱對公開曲目彙總做逐曲扣除。卡片隱藏只是本機 UI，不改權利、內容可見性或公開網址。

## 工程及 Production
本輪只動 Expo Web/React Native 前台與純函式，**不動 Cloudflare Worker / D1 / R2、112 private/copied 音訊、28 張核准封面權限、Starry ID、付費或廣告**。完成 PR CI 與 GitHub 保護合併後仍**尚未正式發布**；正式發版須按既有 `.github/workflows/deploy-worker.yml` 精確 main SHA 人工 dispatch、production 人工審批，並做 28 封面 no-store、私人音訊 404、手機與桌面回歸。最新真相以 Issue #3 為準。
