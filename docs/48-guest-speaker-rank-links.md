# 2026-10-30｜舊版點講師獎銜→同獎銜作品（核准訪客資訊卡）

## 原版與新版差異
- 舊 `yukidu/Echo-Starry/src/components/DetailView.tsx` 的講師獎章 `onSelectSpeakerRank(rank)` 可以立即篩出同一獎銜作品；新版雖已提供首頁「進階篩選→講師獎銜」，但詳細頁的 `speakerRank` 只有靜態文字，卡片也只顯示不能點選的文字。
- 新版現況：`worker/index.ts` 的**合法公開錄音 `publicTrack()` 不提供 speakerRank**；只有現有經業主核准、僅供 metadata 展示的 `GET /api/v1/previews` 可以攜帶 `speakerRank`，來源權限不能混為一談。

## 本批實際操作
- 所有使用 `LegacyTrackCard` 的列表（首頁／講師／收藏）中，已核准訪客 preview 的講師獎銜變成真的可點擊連結；訪客詳細頁 `/preview/[id]` 的「講師獎銜」同樣可點。點擊導向首頁 `/?rank=...`，展開既有的「講師獎銜」進階篩選，與現有 `matchesCardFilters` 的 `baseSpeakerRank` 保持一致；例如「GAR 創辦人白金」與「創辦人白金」都歸入「白金」。分類 link 仍照舊，獎銜 deep-link 優先，避免上一次類別遮掉這次獎銜。
- 使用 `speakerRankFromRoute` 限制字串長度、控制字元與URL危險符號。只接受 route 值當成**對目前已核准 API 回傳資料的本地篩選**，絕不是查詢私人舊音檔或音訊解鎖；本裝置被隱藏的作品與講師仍依先前偏好排除。若卡片沒有經核准 `legacySnapshot=true,playable=false`，不提供獎銜連結；不能用 public 播放核准去擴張舊錄音瀏覽權。
- 包含無障礙連結語意和手機至少44px按鈕，真實 `router.push`；未增加 API、改 Worker/D1/R2、會員身分、金流、電池、廣告或 AI。訪客預覽頁仍無播放/分享/圖卡下載。
- 文件：新增 `src/ui/echo/publicSpeakerRankNavigation.ts`、`tests/legacy-approved-speaker-rank-links.test.mjs`；修改首頁 `app/index.tsx`、`src/ui/echo/LegacyTrackCard.tsx`、`app/preview/[id].tsx`。
- 私人音訊完整稽核 `audit-private-audio.yml` 需業主**單獨具體授權**，本批完全不執行、不讀/下載/解碼/公開或雜湊歷史私有112音訊。112 `private/copied`、0 `public+verified` 是先前歷史快照，不能當成本次 D1/R2 新稽核。
- 依 PR CI success→protected merge→main CI success→唯一合法自動Production→28批准metadata/no-store/28封面/private404正式 HTTP smoke→Cloudflare worker最新version 100% 完成，才可記為 Web 上線；原生真機/舊版全面1:1仍未完成。
