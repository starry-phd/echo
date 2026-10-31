# 60｜演講者「所有錄音」獎銜／日期文字 1:1 對齊

## 原版證據

原版 `yukidu/Echo-Starry/src/components/SpeakerProfilePage.tsx` 的「所有錄音」每項在標題下顯示：
`{t.speakerRank||'公開'} · {formatSpeakerRecordingDate(t.uploadDate)}`（原版第 90 行）。

## 本批修復

新版 `app/speaker/[name].tsx` 先前 PR #74 加入了安全的日期展示，但額外顯示「上架日期：」而未保持原版獎銜／日期並列。改為直接使用作品既有已核准的 `speakerRank` 與 `uploadDate`，格式和原版相同，缺獎銜時寫「公開」，缺日期沿用「日期未設定」。

必須保留 `authorizedSpeakerProfileTracks`／`visibleTracks` 的公開資訊和本裝置隱藏過濾；保留 `LegacyTrackCard` 現有收藏／隱藏操作。**不增加任何音檔播放資格，也不讀會員／私人內容。**

## 驗收

回歸測試更新原版文字結構斷言，仍覆蓋台灣日期格式及私人端點拒絕。經 branch → PR exact HEAD CI → 一般合併 → main CI → 唯一自動 Worker 部署 → HTTP/private-media smoke → Cloudflare 核對；絕不改 `echo.starry.phd` 舊站網域。Ref #3。
