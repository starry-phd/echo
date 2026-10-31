# 59｜演講者所有錄音：原版上架日期安全還原

## 原版程式證據

`yukidu/Echo-Starry/src/components/SpeakerProfilePage.tsx` 的「所有錄音」頁，對每筆 `TrackSummary` 會在標題及講者獎銜旁顯示 `formatSpeakerRecordingDate(t.uploadDate)`。原始日期格式源自 `src/utils/speakerRecordingDate.ts`，支援純日期、UTC/有偏移的時間與無效日期 fallback，以台灣時區呈現。

## 新版差異及本輪修復

`starry-phd/echo/app/speaker/[name].tsx` 原本在「所有錄音」分頁只繪製 `LegacyTrackCard`，沒有重現原版的作品上架日期。本輪直接移植原版日期格式函式至 `src/ui/echo/speakerRecordingDate.ts`，並在每筆合法作品卡旁顯示「上架日期：…」。只有 `authorizedSpeakerProfileTracks` 經目前公開 API 或核准訪客資訊卡、講者名稱及本機偏好篩選後的 `visibleTracks` 才能顯示，並使用其 `uploadDate`；若沒有核准日期顯示原版 fallback「日期未設定」，不推測錄音日期或上傳者。

保持原有整張作品卡的資訊／收藏／隱藏操作；不將 metadata-only 訪客資訊卡變成可播放內容。其他未授權會員問答、逐字稿、音檔播放確認和浮動播放器仍 blocked，不能因這次日期修復標記完成。

## 回歸及發布

新增 `tests/legacy-speaker-recording-date.test.mjs` 驗證原版台灣日期格式、缺值 fallback、只有核准講者作品呈現，且沒有舊私人端點或媒體讀取。正常走 PR exact HEAD CI → 受保護合併 → main CI → 唯一自動新版 Workers 技術部署 → 安全 smoke → Cloudflare 版本核對。舊站 `echo.starry.phd` 保持 `temp-starry-echo-bridge`，**不得切換**。音檔授權 0 public+verified 的交接快照仍須獨立驗證，不做私人音訊下載、解碼或批次公開。Refs #3。
