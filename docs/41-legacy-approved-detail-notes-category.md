# 2026-10-30｜原版詳情「演講資訊與備註」及分類導覽（核准公開資料版）

## 來源與精確範圍
- 舊版 `yukidu/Echo-Starry/src/components/DetailView.tsx` 在播放區下方依序為「參考資料」、「演講資訊與備註」，原本可顯示描述、上傳者、系列、演講日期、上傳日期及參考連結，並允許有權限管理者編輯。
- 新版 `openapi/echo-public.v1.json` 的 `Track` 公開契約**只有** `description` 和 `uploadDate` 等授權資訊，**沒有** uploader、series、speechDate、externalVideos、externalPpts，亦無驗證管理員登入與編輯權限。
- 本輪只在 `/preview/[id]` 與 `/track/[id]` 共用新增 `LegacyLectureNotes`，顯示來源已核准的公開描述／舊版上架日期；空內容明確說「目前沒有經核准公開的演講介紹或備註」，並註明其他欄位未審核。**不能填舊版私人上傳者或連結、不能假編輯。**

## 真正可操作的導覽
- 兩個詳情路由的每個現有分類標籤皆成為 `Pressable`，可真實導至首頁 `/?category=...`，使用 `useLocalSearchParams`、`categoryFromRoute` 將安全字串套入首頁原有分類查詢與前端 `matchesCardFilters`。
- 來源仍只有 `GET /api/v1/catalog` 的 public+verified 與 `GET /api/v1/previews` 的28張 approved metadata，絕不按 URL 參數讀取私人資料。分類連結只是篩選已核准卡片，**不是存取權憑證**。
- `categoryFromRoute` 確認字串、長度不超過80、不含控制碼或尖括號，不隨意 NFKC 改寫來源分類（以便與目前舊版分類名稱完全相同）。
- 觸控分類按鈕至少44px，適配手機、已有24主題與 A−/A＋ 字級；首頁點「清除全部篩選」仍維持原行為。

## 安全及驗收
- 改動前端：`app/preview/[id].tsx`、`app/track/[id].tsx`、`app/index.tsx`；新增 `src/ui/echo/LegacyLectureNotes.tsx`、`src/ui/echo/publicCategoryNavigation.ts`、`tests/legacy-approved-detail-category.test.mjs`。
- 不動 Worker/D1/R2、會員、管理者、錄音、分享、Ads、付款、AI、任何私人音檔。未執行 `audit-private-audio.yml`，該私人資料讀取/解碼/雜湊稽核仍待具體獨立授權。
- PR CI、受保護 main、main CI、合法自動 Production、28/28 approved/no-store、未授權 stream 404 必須全數成功才能視為正式 Web UI 上線；真機逐像素與原版其他資料區塊仍待驗收，不稱完整1:1。
