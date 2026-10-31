# 58｜已驗證公開音檔詳情：原版照片優先 Hero 順序

## 舊版真實來源
2026-10-31 核對 `yukidu/Echo-Starry/src/components/DetailView.tsx`：主講者圓形照片在詳情頁頂部，接續分類標籤、置中標題、講者/獎銜與歷史互動摘要；照片點擊透過原本的播放切換操作。PR #71 已恢復圓形照片尺寸，但新版 `app/track/[id].tsx` 仍將照片放在播放器卡片內，且以姓名首字母代替 Hero 照片，順序不符原版。

## 本輪實作
- `app/track/[id].tsx` 改為與訪客詳情一致的 photo-first hero：圓形照片 → 分類 → 20/24px 置中標題 → 講者/獎銜 →（若有核准歷史 snapshot）唯讀摘要 → 錄音長度。
- 將既有 `AudioPlayback.toggle` 以穩定 callback/ref 傳到 Hero 照片；播放器仍只在已 hydration 的客戶端掛載，沒有 SSR 音訊副作用。
- 保留既有 gate：`getPublicTrack`、`track.playable`、`getPublicStreamUrl` 與 `available` 檢查；未授權時照片不會變成可點擊播放。播放器控制、Range/seek、速度與現有授權不變。
- 不虛構講師肖像：只顯示 API 已核准的 `coverUrl`，否則維持 🎙 fallback。當前 Public Track API 沒有核准封面欄位，不能從 private metadata 或 R2 任意讀取。
- 更新 `tests/legacy-detail-portrait-parity.test.mjs`，驗證 Hero 順序、照片 callback 與公開播放 gate。

## 安全邊界
不改 Worker/OpenAPI/D1/R2/Starry ID/音訊授權；不查看、下載或稽核私人錄音。訪客 preview 仍無播放器、stream、分享或評論寫入。此修正僅調整已驗證公開詳情頁的 UI 層級及既有播放器 callback，不新增播放權。依 exact PR CI → protected merge → main CI → 唯一自動 Production → private-media refusal + 28 guest covers nonplayable smoke → Cloudflare官方100%驗收。Refs #3。
