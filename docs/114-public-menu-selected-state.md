# 114｜原版公開主選單目前頁面標記

## 原始碼比對
- 原版 `yukidu/Echo-Starry/src/components/Navbar.tsx` 約628～675行用 `menuRowClass(currentTab === 'stats')`、`... === 'notifications'`、`... === 'profile'` 等方式，為目前瀏覽頁面提供主選單選取外觀。
- 新版 `src/ui/echo/LegacyHeader.tsx` 原先在 `buttons.map` 中給所有主選單按鈕同一個 `styles.menuItem`，沒有 `selected` 或目前頁面的主題底色；即使已處於排行榜或個人頁也無法從選單辨認。新版的「首頁」與「我的收藏（本裝置）」是安全公開頁面，也可依其實際路由標記。

## 本批
- `src/ui/echo/mainMenuSelection.ts` 定義純公開路由標記：首頁、排行榜、資訊型通知中心、本裝置收藏、個人資料／登入說明；依 `usePathname()` 的精確路由才可選取。**通知項目僅屬已存在的空資料／合約待接說明頁，不代表訪客有私人通知存取權**。
- `LegacyHeader.tsx` 主選單 Pressable 加上 `accessibilityState.selected` 與既有主題 `lightPill` 背景、主色字；維持原本按鈕及 click handler，沒有新增頁面、會員或內容權限。
- 新增 `tests/legacy-main-menu-selected.test.mjs`，驗證每個安全路由、非目前頁的 false、受限路由/占位文字不會標示、實際 Header 接線及無私人讀取。

## 保護邊界
不影響原版快捷置頂功能、使用者已存設定、通知 API Gate、28份唯讀訪客資訊卡或私人音訊。原版登入後菜單／審核權仍需等待 Starry ID 正式授權契約；本批**絕不**從 URL/本機資料推導已登入或審核權。CI、unsigned Expo Hermes/Web build 不能取代真實 VoiceOver/TalkBack E2E。