# 2026-10-30｜第二層功能移植第一批：排行榜（五個原版分頁）

## 舊版對照與真正完成範圍

根據 `yukidu/Echo-Starry/src/components/StatisticsView.tsx` 最新 main 中第 638–704 行，原版排行榜包含五個分頁（模範生、熱門音檔、會員、貼紙排位賽、熱門關鍵字）。新版原本 `LegacyHeader` 只用一行不可點擊的「統計中心／待移植」代替，沒有第二層頁面。

本次在 Expo Router 新增 `/stats` 真實第二層畫面，主選單中「排行榜」可開啟。桌面五分頁並列、手機兩欄換行。保留五個確切標籤及點選切換，不因後端未開放而把整個頁面砍掉。

**已可使用的熱門音檔排行榜：** 只透過 `getPublicTracks`、`getGuestPreviewTracks` 與 `mergeAuthorizedCards` 使用目前合規的 public+verified／28 核准 guest metadata，先排除本裝置使用者隱藏的卡片或講師，依舊版歷史評價／按讚／心得計數排序並顯示前10張；每張卡沿用首頁可安全打開的相同 `LegacyTrackCard`。唯讀歷史資料不宣稱是即時資料，也不顯示虛構播放次數。

**保留但安全封閉的四分頁：** 模範生、會員、貼紙排位賽、熱門關鍵字展示舊版分頁介面與明確原因；目前欠缺中央 Starry ID／學習進度／Battery／關鍵字服務以及各欄位合法可公開權限，不建立假會員、假餘額或私人錄音關聯資料。待正式 API 與授權契約核准後再逐項串接。

## 操作與安全驗收
- 原版五個 tab 名稱、次序；手機觸控至少44px；點其他 tab 不會擅自載入會員名單或透露隱藏資訊。
- 來源一個失敗仍有可見卡時顯示局部失敗提示；兩來源有任何讀取失敗且沒有可見卡時顯示重試；都成功但沒有卡才稱空。
- 本機收藏/不喜歡/隱藏講師跨畫面維持一致，不因統計頁另儲一份偏好。
- 未修改 Workers、D1、R2 或播放 API；沒有開放112 private/copied 音訊、28張 allowlist 以外封面、後台寫入、會員個資、貼紙或 Ads。
- 此 PR 合併後仍須按 GitHub protected Production 手動發版 + Environment approval，以及正式網頁/手機實際 UI 驗收。不能以 CI success 宣稱所有原版排行子功能已完成。更多差異依 [Issue #3](https://github.com/starry-phd/echo/issues/3)。

下一批：快捷釘選/字體縮放/動畫、舊版完整講師頁與逐字稿/問答安全呈現、音檔詳情深度版型；所有跨會員或私人音訊能力要獨立的身分與內容權利 Gate。
