# 61｜演講詳情「上傳日期」中文格式 1:1 安全還原

## 原版真實依據

`yukidu/Echo-Starry/src/components/DetailView.tsx` 約第 482 行定義 `formatChineseDate`：從原字串擷取 `YYYY-MM-DD`／`YYYY/M/D` 日期，呈現 `YYYY年M月D日`。約第 1040 行將 `formatChineseDate(track.uploadDate)` 放在「演講資訊與備註」的「上傳日期：」欄位。

這個原版詳情函式和講者「所有錄音」使用的 `formatSpeakerRecordingDate` **不同**。原版詳情並不把時間戳轉成臺灣時區或提供日期未設定字樣，故不得擅自互換。

## 新版修復範圍

`src/ui/echo/LegacyLectureNotes.tsx` 先前直接顯示 `YYYY-MM-DD` 原始日期和「舊版上架日期：」，本輪移植原始格式至 `src/ui/echo/legacyDetailDate.ts`，改為「上傳日期：」及原版中文日期。缺值時不顯示這一欄，與現有安全預覽原則相容。

僅使用已核准的公共 Track `uploadDate`，不讀取或推測舊版私人音檔、上傳者、系列、演講日期、會員評論或 R2；兩條新詳情路由共用既有 `LegacyLectureNotes`，無須改動任何音訊／身份／API／Cloudflare 權限。

## 測試及部署

新增純日期與 UI 源碼界線回歸測試，要求 exact PR CI、正常受保護合併、main CI、唯一自動 Worker 技術站部署、私人媒體 404／28 資訊卡不可播 safety smoke 和 Cloudflare 100% 官方核對。禁止把 `echo.starry.phd` 指向新版。Ref #3。
