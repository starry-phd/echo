# 105｜原版主選單：一般深淺色按鈕點擊後收合、連續設定例外保留

## 原版實碼
`yukidu/Echo-Starry/src/components/Navbar.tsx` 約239～254行，當 `isMobileMenuOpen` 為真時，文件 bubble click listener 在點擊主選單內一般 `button` 後會 `setIsMobileMenuOpen(false)`；但明確排除 `.navbar-menu-font-row`、`.navbar-menu-palette-shortcut` 與 `.navbar-inline-pin`，讓字體縮放、好心情和釘選可以連續操作。原版 `onToggleTheme` 在約616行，是一般選單 `button` 而非豁免項目。
新版 PR #117 以 RN `Modal`/背景 Pressable取代 document handler，已修復點外側；然而 `LegacyHeader` 內選單「切換深／淺色模式」仍直接 `onPress={colors.toggleDark}`，按完選單不收合。和原版普通按鈕不同。

## 小範圍修正
- 僅將主選單內 **深／淺色切換那個 Pressable** 改成 `onPress={()=>{colors.toggleDark();closeMenu();}}`，先完成原有主題切換再收合選單與拖曳狀態。
- 頁首置頂深／淺色快捷鍵仍維持既有功能；原版例外 **好心情、色票、字體、快捷釘選/長按拖曳** 不會被強制關閉，方便連續操作。
- 選單的外側點擊、Android Back、輔助使用者 Escape、明確關閉仍沿用 PR #117；無需 DOM 或新的狀態機。
- 沒有任何會員/權限、音檔、API/Worker、R2/D1 或金流修改。

## 驗證與限制
新增 `tests/menu-theme-dismiss-parity.test.mjs`，並保留與更新舊 `tests/header-menu-outside-dismiss.test.mjs` 的 theme click assertion。完整 CI/Pure regression 不能代替真人觸控、TalkBack/VoiceOver E2E。
發布必須 exact PR CI → Ready → protected merge → exact main CI → 唯一 auto workers.dev → 公開首頁/API/private-media拒絕、28張metadata no-store封面＋28 guest stream HEAD404/no-store → 官方 CF 100%／正式舊 domain不動。
