# 72｜公開錄音詳情返回來源畫面（原版行為對照）

- 舊版來源：`yukidu/Echo-Starry/src/components/DetailView.tsx` 的 `onBack?: () => void`，由外層保留返回原畫面的控制。
- 新版起點：`app/track/[id].tsx` 先前的「返回音檔列表」一律 `router.push('/')`；從講者頁、收藏或排序結果進入詳情後，會丟失原本的瀏覽路徑。`app/preview/[id].tsx` 原已使用 `canGoBack/back/replace`。
- 本次修復：已驗證公開詳情也採 `router.canGoBack() ? router.back() : router.replace('/')`。有歷史紀錄時返回前一頁；直接開啟深層連結且無歷史紀錄時安全返回首頁。
- 測試：`tests/legacy-detail-back-navigation.test.mjs` 對兩個詳情入口的返回策略和既有公開播放門檻建立靜態回歸守衛。完整手機真人 UI 操作仍需另行驗收。
- 安全界線：**不改** `getPublicTrack`、`track.playable`、stream 來源、28 張 metadata-only 訪客封面、API、Worker、D1/R2、Starry ID、商店或私人音檔。訪客詳情仍沒有音訊播放器。
- 發布驗收：必須以本 PR 最新 HEAD 的 CI、正常受保護合併、合併後 main CI、唯一自動 Worker 部署、私媒體拒絕、28 張訪客不可播放、Cloudflare 100% 與舊站 domain 不變為實際證據，**不得從本文件直接宣稱已發布**。
