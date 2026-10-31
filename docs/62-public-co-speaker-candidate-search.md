# 62｜講師個人頁的共同講者公開作品查詢

## 舊版證據與新版缺漏

舊版 `yukidu/Echo-Starry/shared/speakers.ts` 及新版忠實移植的 `src/ui/echo/speakerNames.ts`，以 `&` 和 `＆` 拆分同一作品中的不同講者。新版 `app/speaker/[name].tsx` 已使用 `authorizedSpeakerProfileTracks` 進行精確、正規化後的個別講者判斷，但 `getPublicTracks(signal,{speaker:speaker!})` 送到 Worker 時，Worker SQL 目前只做 `speaker = ?` 整字串比對；故 `王小明 & 林美麗` 的 verified-public 作品會在 API 候選階段被排除。

## 本批修正

保留已存在的 Worker/OpenAPI `/api/v1/catalog?q=...` 公開資料查詢，傳入個別講師姓名作為 bound 關鍵字取得**候選**，再使用 `authorizedSpeakerProfileTracks(speaker,mergeAuthorizedCards(q.data??[],p.data??[]),dislikedIds,hiddenSpeakers)` 的現有嚴格多講者篩選，完全不提升 `playable`、不允許 URL 名稱單憑自身建立個人頁。既有 Guest 28 名單仍用核准來源與精確匹配。

新增 SQLite 實際執行測試涵蓋 `&`／`＆`、純單人、相似名稱、只在標題出現的假陽性、private/copied、public/copied 與 SQL 綁定輸入。安全邊界未擴張。

## 已知限制

公開 catalog 仍採現有 `LIMIT 100`；關鍵字查詢可以避免現有整字串必漏的錯誤，卻不是未來大量資料下真正完整分頁 API。正式會員、私音／逐字稿、錄音播放仍 BLOCKED。測試、PR、合併、單一 workflow_run Production、Cloudflare 100% + 舊站不變依 Issue #3 正常驗收。Ref #3。
