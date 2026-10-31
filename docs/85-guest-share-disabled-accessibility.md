# 85｜未取得公開分享資格的資訊卡：分享選單無障礙狀態一致

## 真實 UI／無障礙問題

`src/ui/echo/LegacyTrackCard.tsx` 的「分享尚未開放」選項在無可用的 `approvedPublicTrackShareMessage` 時，原本只標記 `accessibilityState={{disabled:true}}`，卻沒有真正對 React Native `Pressable` 設 `disabled`。這會讓讀屏軟體告知使用者按鈕已停用，但滑鼠／觸控依然能觸發 `onPress`，造成介面狀態與實際互動不一致。

## 修復

- 對該按鈕加上與公開分享資格相同的 `disabled={!publicShareMessage}`，並在停用時降低透明度，讓視覺和無障礙描述都一致。
- 加上具體 `accessibilityLabel`、`accessibilityHint`；只有成功從既有 `approvedPublicTrackShareMessage` 生成合法**公開資訊頁**才開放分享，無法分享的 28 張 curated guest metadata-only 卡仍不可分享／不可播放。
- 保留 `share()` 裡 `!publicShareMessage` 的獨立防線，確保其他途徑誤觸也不會向系統分享任何 URL；已核准公開作品的分享仍由既有 helper 限制只產生 `/track/:id` 頁面網址，不是媒體 stream URL。
- 新增 `tests/guest-share-disabled-accessibility.test.mjs` 合成 guest/public 授權回歸與 UI Pressable disabled/assistive semantics 的 source contract 驗證。
- 不改 Worker/API/DB/R2、私有音訊/Starry ID/中央會員資料、28 guest preview 遷移政策、正式舊域名、Ads/Billing、native signed/商店送審。

## 發布條件

只有 PR exact HEAD CI、正常 protected merge、main exact CI、唯一既有 workflow_run workers.dev Worker＋Expo Web Assets、28 guest covers/28 guest stream HEAD404 no-store/private refusal 的 HTTP smoke、Cloudflare 官方100%與現役 `echo.starry.phd` 仍舊 Worker 全通過後才算完成。此文件本身不是部署證據。
