# 75｜核准詳情分類連結安全化（guest 與 verified-public 一致）

## 實際缺漏
- 舊版音檔卡能按分類檢視同類作品；新版首頁以 `categoryFromRoute` 接受經驗證的分類篩選。
- `LegacyTrackCard.tsx` 的分類操作已經以 `categoryFromRoute` 驗證，但 `app/preview/[id].tsx` 與 `app/track/[id].tsx` 直接把原字串當成路由參數，當來源資料包含控制字元、過長字串或不適合路由的標籤時，不能維持安全一致的點擊行為。

## 修正
- 兩種經核准詳情頁都先 `const selected=categoryFromRoute(category)`。合法分類保留完整點擊、首頁原有篩選及「新人」標籤動畫；無效分類只顯示唯讀文字，不提供連結。
- 依現有 `tests/legacy-approved-detail-category.test.mjs` 擴充來源安全、路由正規化及 fallback 靜態回歸測試。保留原始名稱供展示；不猜測或新增欄位。

## 發布與安全
仍然只從已核准 guest preview 或 verified-public detail 來源顯示公開 metadata。**未修改** Worker、OpenAPI、D1/R2、Starry ID、播放權限、28 張 guest metadata-only 不可播政策、舊網域、金流、廣告、原生簽章或商店。此文件不是部署證據；以 exact PR CI、正常保護合併、exact main CI、唯一 auto deploy、安全 HTTP smoke、Cloudflare 官方100%與現役舊網域未變為發布 Gate。
