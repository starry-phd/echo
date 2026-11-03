# 139｜無障礙自動檢查（axe-core，WCAG 2.1 A/AA）

## 做法
- `.github/workflows/visual-check.yml` 在截圖之後執行 `scripts/a11y-audit-production.mjs`：真 Chromium、手機尺寸、zh-TW、reduced motion；axe-core `4.10.2`（固定版本）檢查 WCAG 2.0／2.1 A 與 AA 規則。
- 10 個畫面：首頁淺色／深色、主選單展開、預覽詳情、會員、隱私權政策、排行榜、收藏、通知、講師。
- axe 只注入在「測試專用、略過 CSP」的獨立 context；網站本身的強制 CSP 由截圖步驟繼續驗證。只做 GET 頁面載入。
- Log：每頁 `A11Y <頁面>: N rule(s) violated — critical=… serious=…`，逐條列出規則、影響程度、節點數與前 3 個 selector；總結 `A11y audit: …`。報告也存為 Artifact 的 `a11y-report.json`。
- `ECHO_A11Y_FAIL_ON`：第一輪為 `none`（只回報）；修正後提高到 `serious`，之後嚴重以上的無障礙退步會讓檢查失敗。
- 純邏輯在 `scripts/a11y-summary.mjs`，`tests/a11y-audit.test.mjs` 測試。

## 界線
自動檢查約能找出一部分 WCAG 問題；不取代 VoiceOver／TalkBack 真人測試、鍵盤實測與讀屏語意判斷。
