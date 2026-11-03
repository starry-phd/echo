# 137｜Production 自動截圖與頁面錯誤檢查（唯讀）

## 為什麼
需求狀態表「Chrome／Safari／PWA 真 E2E 待實測」：至今所有 UI 都只有程式與 CI 證據，沒有人在真瀏覽器看過正式網站。業主只用手機、Claude 的工作環境連不到 workers.dev，GitHub Artifact 下載也被 proxy 擋（Azure blob），但**可以讀 Job Log**。

## 做法
- `.github/workflows/visual-check.yml`：在「Deploy Echo public Web shell to Cloudflare Workers」**成功**、來源為本 Repo main 時自動執行；`permissions: contents: read`、`persist-credentials: false`、不使用任何 Secret、不部署任何東西。Playwright 釘選 `1.63.0`，安裝在 `/tmp/echo-visual`，不碰 App 相依套件。
- `scripts/visual-check-production.mjs`：固定正式網址（另只允許 `http://127.0.0.1:<port>` 供本機測試），真 Chromium、zh-TW／Asia/Taipei、reduced motion，只做 GET 頁面載入。截圖：
  1. 首次造訪（含新手教學）手機
  2. 首頁手機淺色　3. 首頁手機深色　4. 主選單展開
  5. 第一張公開預覽卡詳情　6. 會員頁（確認 Starry ID 仍為「API 尚未設定」）　7. 隱私權政策　8. 首頁桌機
  - 只在本機寫入外觀偏好（關掉教學、玫瑰色主題、深／淺色），不寫任何會員資料。
  - 每頁記錄：HTTP 狀態、載入時間、console error、失敗請求、**第三方來源**。
  - 任一頁失敗、出現未捕捉例外、或公開頁面向第三方網域發請求 → 工作失敗（不影響已完成的部署）。
- 截圖以 base64 分段寫入 Log（`VISUALSHOT|名稱|序|總數|資料`），`scripts/extract-visual-screenshots.mjs <log> <dir>` 可逐位元組還原；同時上傳 Artifact `echo-starry-production-screenshots`（14 天）給人看。

## 本機驗證
以 127.0.0.1 假網站跑完 8 張截圖、轉 Log、再還原，8 張與原檔逐位元組相同；單頁失敗會記錄並繼續。

## 界線
這是 Headless Chromium 的自動檢查，**不等於** Safari、iOS／Android 真機、PWA 安裝或 VoiceOver／TalkBack 驗收。

## 擴充（#156）
- 加入 9 排行榜 `/stats`、10 收藏 `/favorites`、11 通知 `/notifications`、12 講師頁 `/speaker/<第一位單一講師>`，共 12 個畫面，作為 CSP 改為強制前的完整 Report-Only 覆蓋。
- 頁面本身回應 4xx／5xx 也算失敗。
- 每頁監聽 `securitypolicyviolation`，Log 印出 `cspViolations=`（#154 起）。
