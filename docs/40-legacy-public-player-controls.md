# 2026-10-30｜舊版公開播放器進階操作（權限不變）

## 實際原版對照
`yukidu/Echo-Starry/src/components/DetailView.tsx` 近 862–955：播放器在進度時間軸上，播放控制按「−30、−10、播放/暫停、＋10、＋30 秒」排列，倍速為 0.7／1／1.25／1.5／2／2.3×；原版拖曳時間軸只能從目前進度圓點約28px範圍啟動，不能直接亂點跳轉。

## 本批實作
- `app/track/[id].tsx`：只在 `getPublicTrack(id)` 返回合法 `track.playable` 且有公用 `getPublicStreamUrl` 時可載入媒體；後續播放控制仍檢查 `status.isLoaded`。動作按鈕與六種速度真實連接 Expo Audio 的 `seekTo`、`setPlaybackRate`。
- `src/ui/echo/LegacyPlaybackTimeline.tsx`：新增 React Native/Web 共通的 thumb-only 時間軸，點位需靠近既有 thumb 28px 才啟動，拖動放開才 seek，邊界歸零或到結尾；提供可存取的 `adjustable` 進度及增減10秒語意。
- `src/media/legacyPlaybackControls.ts`：純函式控制合法選項與手勢座標邊界。既有 `src/media/playback.ts` 的 seek clamp 保持不變。新增 `tests/legacy-public-player-controls.test.mjs` 覆蓋跳秒/速度、thumb起始位置、NaN/Infinity、裝置/權限路由防線。
- `/preview/[id]` 絕對**不**載入 player、串流 URL、速度、時間軸；28張預覽卡仍僅含核准 metadata + 封面。無任何 Worker/D1/R2、權限、電池/貼紙、登入、Ads、付費、音訊檔案變更。

## 合規界線與驗收
全部112筆歷史音訊依先前快照仍 `private/copied`（並非本批新查），0 public+verified；即使公開播放器 UI 程式上線，當下**沒有任一已證明可以播放的真人音訊**，不得聲稱已恢復真播放功能或通過實際音訊播放測試。私人音訊完整性稽核未經具體另行授權不得執行，也不以本次 PR 暗中下載/解碼/公開。

必須 PR CI 綠燈→受保護 main 合併→main CI→唯一合法自動 Production→28/28 metadata/no-store/private stream 404；iPhone/Android 真機上的 thumb drag、speed、更換音源及音訊中斷行為需等日後合法公開的測試音訊實測，不能把 CI 模擬當真機/串流驗收。
