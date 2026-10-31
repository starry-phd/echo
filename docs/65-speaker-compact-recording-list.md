# 65｜原版講者「所有錄音」精簡清單與安全選取提示

## 舊版來源

`yukidu/Echo-Starry/src/components/SpeakerProfilePage.tsx`：在 compact 講者浮動頁「所有錄音」下，每筆是一個簡潔 button（舊版約第 88～91 行），**主行是標題、次行是 `speakerRank || '公開' · formatSpeakerRecordingDate(uploadDate)`**；點選舊版錄音會出現播放確認視窗（約第 113～125 行）。不是主頁大型 `AudioCard`。

## 目前實際修復

先前新頁 `app/speaker/[name].tsx` 在講者浮動視窗內直接重用 `LegacyTrackCard`，造成整張主頁大音檔卡、長控件、日期另起一行；與原版精簡清單不一致。現在改為 `src/ui/echo/LegacySpeakerRecordingRow.tsx`，標題和獎銜／日期雙行，輔助按鈕保留已存在的**本裝置收藏／隱藏／還原**能力，且與中央會員收藏分離。

選取後的確認視窗依現行 API `track.playable` 分流：只有**真正 verified-public** 才可前往 `/track/[id]`；guest metadata-only 只可前往 `/preview/[id]`，顯示「錄音尚未開放播放」，絕不產生「確認播放」的誤導承諾。兩個目的地再次向現行核准 API 查詢權限，防止舊卡資料成為持續授權。原版浮動視窗 Escape 在選取時先關確認視窗，再按才關整個講者頁。

## 驗收與界線

更新原日期測試、新增 `tests/legacy-speaker-compact-rows.test.mjs` 鎖定原版 2 行清單、現行精確授權過濾、本裝置偏好與確認分流，且不讀私人媒體／Starry ID。仍不包含原版私人浮動播放器、會員互動／逐字稿。依 PR → exact HEAD CI → 一般合併 → exact main CI → 唯一自動 Worker 部署 → workers.dev HTTP 與 28 guest cover/private media smoke → 官方 Cloudflare 100% + 舊站保持 `temp-starry-echo-bridge`。Ref #3。
