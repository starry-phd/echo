# 119｜舊版「不再顯示新手教學」勾選當下儲存

## 原版程式碼差異
- `yukidu/Echo-Starry/src/App.tsx` 545～556 行：`handleHomeTutorialNeverRemind(checked)` **在勾選／取消勾選當下**分別 `localStorage.setItem(...,'1')`／`removeItem(...)`，涵蓋原版三組舊 key；`TutorialSpotlight.tsx` 的 checkbox 直接呼叫此 handler。
- 新版 PR #132/#133 `src/ui/echo/LegacyGuestTutorial.tsx` 之前僅在勾選後再點「我知道了／知道了」時寫入；**反向取消勾選並不刪除已存鍵**。這是可從雙方原始碼確認的行為差異。

## 本次修正
- 兩種新手教學（原生安全對話框及 Web 真實聚焦導覽）共用同一按鈕 handler；勾選立即保存新的 `GUEST_TUTORIAL_KEY`、取消勾選立即移除，且在 Web 同步原版三個 localStorage key。
- 使用 `legacyTutorialPreferencePersistence.ts` 小型可測試存取器：先寫主 AsyncStorage，再鏡像舊瀏覽器鍵；若主儲存失敗，**不更改 checkbox 成功狀態**，並明示失敗；如主設定成功但舊瀏覽器鏡像失敗，明確標示『本 App 已儲存，但舊版未同步』而非謊稱完全失敗。
- 同一時間僅容許一筆偏好變更；儲存中的 checkbox／完成按鈕 disabled，阻止半完成狀態關閉。保留原有當次進入僅關閉教學、不永久 opt-out 的行為；關閉不再重複寫鍵。
- 不修改已存在的已 opt-out 判斷；讀取失敗仍不打擾訪客。

## 回歸驗收
新增 `tests/legacy-tutorial-preference-persistence.test.mjs`：勾選即寫入4鍵、取消勾選移除4鍵、主儲存失敗不寫鏡像、鏡像失敗不誤報主儲存，以及 UI兩處立即接線/儲存期間禁止關閉；更新原 `legacy-guest-tutorial.test.mjs` 的存取器斷言。
只改本機功能與測試，不觸及 Worker/OpenAPI、D1/R2、Starry ID、私人音訊、Ads/金流、DNS/舊正式域名、Secrets、原生簽章/商店。維持 Draft PR exact HEAD CI→正常 protected merge→exact main CI success→唯一既有 auto Production→28/28 public-only/no-store＋private 404/no-store→Cloudflare official latest+exact 100%／舊域名 unchanged→ Issue #3。
