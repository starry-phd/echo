# 104｜原版主選單「回首頁」應重新整理已核准公開資訊

## 原版程式根據
`yukidu/Echo-Starry/src/components/Navbar.tsx` 約271～279行的 `handleMenuHomeRefresh` 是原版選單**專用**「回首頁」操作：當網址已在首頁即 `window.location.reload()`，其他頁面則 `window.location.assign('/')`；約596行按鈕直接使用此函式，title 明確為「回首頁並重新整理」。
新版 `LegacyHeader.tsx` 的主選單小按鈕「⌂ 回首頁」先前只用 `go('/')`，它只重設 UI 篩選＋網址，不會主動重新驗證目前快取的公開資料。原版 Logo 另外是 `onLogoClick`，不是強制刷新。

## 安全且小範圍的恢復
- 透過根目錄已存在的 `QueryClientProvider` 使用 `useQueryClient()`，只在**主選單「⌂ 回首頁」**執行 `refreshApprovedHome()`。
- 先沿用既有 `go('/')`：關閉選單與搜尋建議、重設本地篩選、移除過期 category/rank 網址。
- 接著對四個**現有公開** React Query cache family 逐一 `invalidateQueries({queryKey:['echo',name],refetchType:'active'})`：`public-tracks`（仍受 Worker 已核准公開 gate）、`guest-previews`（28 metadata-only）、`categories`（公開分類）、`public-health`（公開健康狀態）。目前在首頁的 active query 會重新驗證；從其他頁面返回首頁，失效的 inactive cache 會在再次掛載時按既有 public query 重新取得資料。這不是伺服器新 API 或 private query。
- 不採用原版 Web-only `window.location.reload/assign`，避免在 Expo native 失效和無意重置使用者本機偏好；Logo／釘選快捷首頁仍保持單純本地 reset（不強制多次 API 請求），與原版按鈕區分。
- 不變更權限／播放／分享／收藏／隱藏或快取中其他非公開查詢；不增刪資料。

## 交付要求
`tests/menu-home-public-refetch-parity.test.mjs` 檢查原版行為差異、4個核准公開 query keys、不同入口與舊深連結清理。原生／Web bundle + CI 是程式驗證，不等於已手動真機測試。
每批 exact feature HEAD CI→Ready→protected merge→exact main CI→唯一既有 workflow_run workers.dev→首頁/API/private refusal、28/28 cover no-store、28/28 stream HEAD404/no-store→CF最新100%與正式舊 `echo.starry.phd` 不變。
