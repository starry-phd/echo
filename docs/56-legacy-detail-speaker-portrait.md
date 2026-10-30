# 56｜舊版第二層音檔詳情：圓形講者照片與置中資訊

## 舊版實際來源
2026-10-31 核對 `yukidu/Echo-Starry/src/components/DetailView.tsx`：
- 第二層詳情的主講者照片有 `w-36 h-36 sm:w-44 sm:h-44 rounded-full`，即手機 144px、640px 起 176px，原本可以點擊切換播放。
- 分類標籤放在大標題上方；標題 `text-xl sm:text-2xl`（20/24px），照片、分類、標題、講者資料均中央對齊。
- 原版可播放是舊權限模型，不得從照片或封面延伸推斷新版公開音訊授權。

## 本次實作
- 新增純 UI `legacyDetailHeroSizing(width)`：以 640px 斷點還原原尺寸，無播放器或權限副作用。
- 新增共享 `LegacyDetailSpeakerPortrait`，只從目前經授權的公開 API track 封面相對路徑載入照片；圖片異常時回落 🎙，不讀私人音訊。
- `app/preview/[id].tsx` 公開訪客資訊頁還原圓形 144/176px 照片、分類在標題上方、置中 20/24px 標題與講者/獎銜；**沒有 onPress、沒有 audio source、沒有 Share**，並明示「錄音播放未開放」。
- `app/track/[id].tsx` 對**已驗證 `getPublicTrack()` 且 playable**的未來公開音訊才透過 `AudioPlayback.toggle` 讓照片可切換播放；現有 `available=track.playable&&Boolean(source)`、真正已載入播放器才 seek/speed gate 全部保留。此批沒有將 112 個 private/copied 音檔改為 public。
- 新增 `tests/legacy-detail-portrait-parity.test.mjs` 測試斷點、原版排序、guest fail-closed 和已驗證 public track 播放 gate。

## 本批未修改
Worker、Cloudflare 部署配置、Starry ID/會員、D1/R2、音訊授權資料、私人檔案稽核、逐字稿/AI、任何未核准資料欄位。28 張訪客封面僅資訊展示，仍不得播放。受保護流程：exact PR HEAD CI success → protected merge → main CI exact SHA success → 唯一自動 Production success → HTTP smoke（私人媒體拒絕+28不可播）→ Cloudflare 官方100%。Refs #3。
