# 112｜還原原版訪客預設字體＋深淺模式快捷列

## 原版實證
`yukidu/Echo-Starry/src/components/Navbar.tsx` 約330～332行明確對 `!currentUser`（訪客）固定顯示 `['font','theme']`；`renderPinnedAction('font')` 提供 A−／A＋，`renderPinnedAction('theme')` 提供深淺色切換。

新版 `starry-phd/echo/src/ui/echo/quickActionStore.ts` 的**無儲存設定**狀態，手機預設 `['home','palette']`，平板／桌機預設 `['home','palette','profile']`；這是可從原版和新版程式碼直接核實的介面差異。

## 小範圍修改
- 僅新裝置／無 AsyncStorage 設定時，將 mobile/tablet/desktop 預設都改為原版訪客 `['font','theme']`。新版仍允許訪客自行釘選、移動／取消置頂；此行為是已核准的本機 UI 功能，**不恢復原版舊身分或會員讀寫**。
- `normalizeQuickChoices` 在有合法已存數組時**不覆蓋、不轉換、不自動儲存**，原本選過首頁／好心情／會員等的使用者仍維持自己的順序，空快捷列亦可恢復。
- 保留手機3／平板5／桌機7的既有數量上限與受控的 `allowedQuickActions`，不增加通知、管理、付費、私人音訊入口。
- `LegacyHeader` 既有釘選 font 時不重複顯示固定 A−／A＋ 的邏輯不變，主題切換繼續走 `legacyTheme`。

## 測試與永久限制
擴充 `tests/legacy-pinned-quick-actions.test.mjs` 的原版 defaults、原限額、順序持久化、不改已存 home/palette、字體移除再釘選等測試。CI、iOS/Android unsigned Hermes、Web build 不等於真人短螢幕／手勢／VoiceOver/TalkBack 驗收。

沒有 Worker/OpenAPI/D1/R2、private stream、Starry ID、金流、廣告、新資源、DNS 或 Secrets 更動。28 張訪客 metadata-only，不播、不分享、不解鎖。
