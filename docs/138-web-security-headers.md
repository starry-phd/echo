# 138｜網站安全標頭（CSP 先 Report-Only）

## 為什麼
Starry ID 串接回覆（`starry-phd/id` 指南 §11.2c）建議網頁版設定嚴格 CSP；先前因無法目視驗收而延後。#153 的 Production 自動截圖現在可以在每次部署後檢查頁面是否正常，所以分兩階段導入。

## 第一階段（本批）：Report-Only
`public/_headers`（Expo 匯出時複製到 `dist/`，由 Cloudflare Workers Static Assets 套用到所有靜態頁面；`/api/*` 由 Worker 自己設定 `default-src 'none'`，不受影響）：
- `Content-Security-Policy-Report-Only`：`default-src 'self'`；`script-src 'self'`（無 inline、無 eval、無第三方）；`style-src 'self' 'unsafe-inline'`（react-native-web 執行時注入樣式需要）；`img-src 'self' data: blob:`；`font-src 'self' data:`；`connect-src 'self'`；`media-src 'self'`；`manifest-src 'self'`；`worker-src`／`frame-src`／`object-src 'none'`；`base-uri`／`form-action 'self'`；`frame-ancestors 'none'`。
- 立即生效：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`（關閉相機、麥克風、定位、付款、USB、Topics）、`Cross-Origin-Opener-Policy: same-origin-allow-popups`（保留日後 Google／Apple 登入彈窗）。

## 驗證
- PR CI：`npm run build:web` 後 `cmp public/_headers dist/_headers`，沒帶進網站就無法合併。
- Production smoke（部署 Gate）：`/` 與 `/privacy` 的標頭必須完全符合 `scripts/web-security-headers.mjs`（同一份驗證器也用在單元測試）。
- Production 自動截圖：每頁監聽 `securitypolicyviolation`，Log 印出 `cspViolations=` 與每筆被擋的指令／網址。

## 第二階段（下一批）
自動截圖連續回報 **0 筆違規**後，把 `_headers` 的標頭改成 `Content-Security-Policy`、`WEB_CSP_MODE` 改成 `'enforce'`（測試會要求兩者一致）。

## 與 Starry ID 登入的關係
測試守門：任何建置開啟 Starry ID 時，CSP 的 `script-src` 必須已加入 `https://accounts.google.com`、`https://appleid.cdn-apple.com`（屆時也要加 `connect-src` 的 Starry ID 網址與 `frame-src` 的 Google／Apple），否則 CI 失敗。

## 第一階段結果與內嵌腳本 hash（#154 → #155）
- #154 上線後自動截圖每頁回報 1 筆 `script-src-elem inline (report-only)`。
- #155 在 CI 加入 `node scripts/check-inline-scripts.mjs dist`：掃描匯出的所有 HTML，只計算會執行的內嵌 `<script>`，以 SHA-256 比對 `INLINE_SCRIPT_HASHES`；出現未登記的內嵌腳本或已失效的 hash 就無法合併。
- 掃描結果：12 個頁面只有 1 種內嵌腳本 `globalThis.__EXPO_ROUTER_HYDRATE__=true;`（Expo Router 靜態水合旗標，內容固定），hash `'sha256-67fhrP0+BkBqmgGGXTtgiVO/9EQs3QruYNU/7fnRkI8='`（本機 openssl 驗算一致），已精確加入 `script-src`。
- 仍為 Report-Only；自動截圖確認 0 筆違規後才改為強制。Expo 升級若改變內嵌腳本，CI 會先失敗並印出新內容與 hash。

## 第二階段：強制（#157）
- #155、#156 部署後的自動截圖：12 個公開畫面（首頁首次造訪／淺／深、主選單、預覽詳情、會員、隱私權政策、桌機、排行榜、收藏、通知、講師）**CSP violations=0**。
- `_headers` 改為 `Content-Security-Policy`，`WEB_CSP_MODE='enforce'`；Production smoke 改驗強制標頭且不得同時存在 Report-Only。
- 自動截圖改為：任何 CSP 違規（現在代表資源被擋）都讓檢查失敗。
- 回復方式：如有頁面異常，revert 本 PR 即回到 Report-Only。
