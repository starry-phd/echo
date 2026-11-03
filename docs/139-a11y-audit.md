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

## 第一輪基準（#158 部署後）與修正（#159）
基準：10 頁共 4 種問題 — `document-title` ×10、`aria-required-attr`（critical）×7、`color-contrast` ×40、`scrollable-region-focusable` ×1。
#159 修正：
- `app/+html.tsx` 加 `<title>繁星回聲｜演講資訊與知識收藏</title>`。
- react-native-web 0.21 不再把 `accessibilityState.checked` 轉成 `aria-checked`：主選單「置頂快捷功能」與新手教學「不再顯示」勾選框加上 `aria-checked`（原生仍用 accessibilityState）。播放進度條補 `aria-valuemin/max/now`。
- 隱私權政策捲動區 `focusable`，鍵盤可捲動。
- 檢查報告對 `color-contrast` 印出文字、前景／背景色、對比值與所需值，供下一批精準修正對比度。

## 對比度修正（#160）
#159 部署後，40 處 `color-contrast` 全部屬於 4 類：主題主色當文字色（淺色 4.34、深色約 3.3）、灰色說明字 4.1、「進階篩選」琥珀字 3.48、「權限／貼紙」待開放按鈕 72% 透明度造成白字 3.11。
- `src/ui/echo/contrast.ts`：WCAG 相對亮度與對比計算；`accessibleAccent(primary,dark)` 以最小幅度把主色往黑（淺色）或往白（深色）推，直到在背景、卡片、主色 10%／16% 淡底等所有表面都 ≥4.6。
- 主題新增 `accentText`；全 App 69＋4 處「主色當文字色」改用 `accentText`（主選單 `activeColor` 亦同）。按鈕底色仍是品牌 `palette.primary`。
- 淺色模式灰字 `#64748b` → `#525d6e`（24 種主題最差 4.96）；深色維持 `#94a3b8`。
- 「進階篩選」使用 `accessibleAccent('#b47a08', dark)`。
- 待開放篩選鈕改為淡底＋虛線框＋`accentText` 字，不再整顆半透明。
- `tests/a11y-contrast.test.mjs`：24 種主題 × 淺／深色全部 ≥4.5。
- 已知待辦：橘、琥珀、芥末、橄欖、萊姆 5 種主題的「白字在主色按鈕上」對比 3.6–4.3，下一批處理按鈕底色。
