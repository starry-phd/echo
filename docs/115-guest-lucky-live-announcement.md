# 115｜原版「召喚繁星解答」得獎結果即時朗讀

## 舊版可查證行為
- 舊版 `yukidu/Echo-Starry/src/App.tsx` 約3131～3139行：抽選完成時，得獎提示 `lucky-answer-notice` 有 `role="status" aria-live="polite"`，得獎標章亦有 `aria-live="polite"`，讓螢幕閱讀器在結果改變時能知道得獎。
- 新版 `starry-phd/echo/app/index.tsx` 有抽中資訊卡結果、`accessibilityRole="summary"`，但沒有即時結果朗讀／`accessibilityLiveRegion`。新訪客只拿 metadata-only 作品，不能宣稱抽到可播放音訊。

## 安全修復
- 新增純函式 `guestLuckyResultAnnouncement`，只有 `luckyPhase==='win'`、catalog已`ready`、而且抽中的是當前仍在已授權可見列表、經 `isApprovedPreview` 檢查且不含私人 description 的資訊卡時，才回傳標題、講者及「錄音未開放」說明。
- `app/index.tsx` 給**實際得獎結果**加 `accessibilityLiveRegion="polite"`；用 `AccessibilityInfo.announceForAccessibility` 在抽中時播報，守住減少動態效果、抽選取消、篩選改變後不朗讀舊結果的條件。僅朗讀已在畫面可見的公開標題與講者，不讀取音訊、會員資料、原始舊 D1 或 R2。
- 加上 `tests/guest-lucky-result-a11y.test.mjs`，測試讀取前置條件及被隱藏／私有／失效結果一律不能朗讀。

## 驗收保留
只屬公開訪客 UI 無障礙改善，不開放播放、分享或解鎖。保留完整 GitHub PR/main CI、唯一自動 Workers 部署和 28/28 安全測試；真正的 VoiceOver/TalkBack 朗讀需真人實機驗收，CI 不能取代。