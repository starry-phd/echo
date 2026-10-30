# 2026-10-30｜舊版講師個人頁：第二層雙分頁與人物摘要安全骨架

## 來源與原始差異

逐行核對原版 `yukidu/Echo-Starry/src/components/SpeakerProfilePage.tsx`：
- 講師照片 + 姓名，以及「綜合人物摘要」。
- 「所有錄音」與「歷史問答」雙 tab。原版的錄音來自會員權限端點、AI 人物摘要依逐字稿整理，問答包含舊站提問者名稱與回答。錄音點擊先經確認，再用跨頁浮動播放器；支援更多錄音/問答分頁。
- 新版 `app/speaker/[name].tsx` 先前只有核准封面、姓名及一長列作品卡，尚無以上第二層版型。

## 本批實際修復（有程式碼，不宣稱所有深層功能完成）

- 新版保留已核准講師姓名、公開封面與現有作品資訊卡；加入「綜合人物摘要」可見區塊，以及舊版**「所有錄音」／「歷史問答」**真實可切換雙 tab。已核准作品卡只在「所有錄音」顯示，兩個 tab 都使用至少 48px 觸控面與 RN 原生 tab accessibility。
- **安全前提：** 只有在 `publicSpeakerRouteName` 合法，並經 `getPublicTracks`/curated `getGuestPreviewTracks`、`mergeAuthorizedCards`、`authorizedSpeakerProfileTracks` 及本機隱藏偏好驗證，且目前有至少一筆合法可見作品時，才顯示人物摘要及雙 tab；任一 API 失敗時遵循原有 loading/partial-error/retry/empty 狀態。
- 摘要內容明示「尚未接入經授權的公開逐字稿與講師審核資料」；歷史問答頁明示「問答 API/提問者隱私/逐曲權限尚未授權」，不抓舊版 `/api/speaker-profiles/view`、不複製私人問答、人物傳記或虛構 AI 回答；不把來源 API 沒給問答資料說成確定的「0 筆」。
- 不新增 Worker endpoints、資料庫/音檔讀寫、會員名單/舊 session 或營利 SDK。

## 仍待逐項移植

1. 原版講師簡介的**公開可用**資料源、AI生成與核准工作流；可能混淆夫妻/共同講師的摘要需單獨審核。
2. 已授權歷史問答 API、分頁、@提問者資訊範圍與原始留言跳轉，且不得不經登入展示私人討論。
3. 講師所有獲准完整錄音的分頁、確認播放視窗與浮動播放器：仍須逐曲 `public+verified` 與 RN 安全播放驗收。
4. 360/390/430/1440 手機/桌面舊新同尺寸視覺差異 QA；本批只是可驗證的一級到二級 UX 基礎。

本批若通過 PR CI 並合併，按 `.github/workflows/deploy-worker.yml` 的全自動 **main push green CI → Production** 流程驗收；新任務不得繞過私人 R2/audit 的手動 Gate。GitHub Issue #3 為唯一持久交接。
