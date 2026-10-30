# 54｜音檔清單卡片：原版手機／桌面封面與單行標題

## 唯一來源（舊版最新 main）
`yukidu/Echo-Starry/src/components/AudioCard.tsx`：
- 封面容器採 `w-28 h-28 sm:w-32 sm:h-32`，即寬度小於 640px 時 112×112，達 640px 起 128×128。
- 標題 `text-base sm:text-lg font-black ... truncate`：小螢幕 16px、大螢幕 18px、**僅一行省略**。
- 新版先前固定 112×112、標題 20px 且允許兩行，與原版有明確差異。

## 本輪範圍
- `legacyAudioCardSizing(width)` 以 640px 定義舊版響應式分界，讓封面與標題各回復原版尺寸。
- `LegacyTrackCard` 套用封面 112/128 與標題 16/18 單行省略，採原版常規深／淺前景色。
- 保留新版經批准的卡片 metadata、講師姓名 modal、排行連結、分類、收藏與目前私有音訊安全拒絕，不改 Worker/D1/R2、Starry ID、音訊或分享授權。
- `tests/legacy-card-visual-breakpoint.test.mjs` 驗證尺寸分界與公開分享／播放 gate 仍存在。

## 驗收界線
此批僅修公開卡 UI，不能推論原版 1:1 全部完成，更不能將 28 張核准訪客封面視為錄音播放授權。依舊須 PR exact HEAD CI → protected merge → main CI → 唯一自動 Production → Cloudflare 官方驗收。Refs #3。
