# 124｜訪客正面動物暱稱（僅本機顯示，不建立身分）

## 唯一原版原始碼的可驗證功能
- `yukidu/Echo-Starry/src/utils/visitor.ts` 定義 **20 種正面形容詞、20 種動物名稱／Emoji**，`getOrCreateVisitor()` 在每次完整載入時產生正面形容詞＋動物的訪客暱稱，且避免與上一次暱稱相同。
- `yukidu/Echo-Starry/src/components/Navbar.tsx` 約 181～200 行 `displayName=currentUser?.name||visitor?.fullName||'勇敢的獅子'`，約 581～590 行實際把訪客名稱及動物頭像顯示在右上主選單，角色為「訪客」。
- 新版 `starry-phd/echo/src/ui/echo/LegacyHeader.tsx` 目前只有固定顯示「訪客」及符號 `♙`，遺漏原版**純視覺暱稱與動物頭像**。

## 權限安全下的最小等價實作
1. `src/ui/echo/guestNickname.ts` 僅保留上面確實存在的 20＋20 正面詞表與 Emoji。函式 `chooseGuestNickname(previous,random)` 每次在正面語彙中抽選；若抽到與上一個完全相同的組合，依原版自動移到下一個動物，避免連續重複；任何不可信儲存字串**永不直接印在畫面**。
2. 為避免從舊 `sq_visitor_identity_v1` 讀取並沿用原站的 `deviceId`、歷史按讚／評價／播放身分，新版**完全不建立或儲存 deviceId，也不讀舊 localStorage 的訪客認證／舊身份鍵**。新版唯一獨立 `echo-ui-guest-nickname-v1` AsyncStorage key 只存**上一個顯示暱稱字串**，在下次 app cold mount 時避免重複；不傳給任何 API，不允許作為登入、授權、會員同一性、跨裝置追蹤或可播放媒體的依據。
3. `LegacyHeader.tsx` 根層元件啟動時非同步選出暱稱與 Emoji；SSR/讀取前仍顯示原「訪客」及 ♙，不造成瀏覽器 hydration mismatch。原來的「個人資料入口」保留，但第二行明確寫 **「訪客 · 本機暱稱，中央會員登入尚未開放」**。依舊沒有 Starry ID authenticated scope。
4. 任何私密瀏覽模式／儲存讀取失敗則產生僅記憶體暱稱，**不嘗試覆蓋可能存在的舊資料**；儲存失敗也不影響公開作品瀏覽。僅在右上主選單使用，切換首頁/排行榜/收藏不重抽；完整重開頁面才重抽。
5. `tests/guest-nickname-visual-parity.test.mjs` 驗證詞表、前次重複處理、異常隨機數與惡意字串不顯示、僅保存前次名稱、儲存失敗不寫入與無 auth/deviceID 介面接線。

## 必經發版 Gate 與限制
Draft exact HEAD PR CI 全綠→Ready→正常 protected squash merge→exact main push CI 全綠→唯一既有 workflow_run auto Workers Production→28 metadata-only guest list policy2/no-store、28/28封面 no-store、28/28訪客串流 HEAD404/no-store、私人音訊與未公開封面404/no-store→Cloudflare官方 latest+exact100% 與原正式 `echo.starry.phd` 仍綁舊 Worker→Issue#3完整交接。
- 不讀／下載／解碼／稽核 112 個私人音訊，不碰 Starry ID 私人 D1、會員/授權/token、舊身份鍵、舊正式站、Worker/API/R2/Secrets/DNS、Ads/RevenueCat、新計費資源、signed EAS 或商店。
- 現階段只驗程式與 CI、服務端公開 smoke，不聲稱在 Safari/Chrome/PWA/iOS/Android/VoiceOver/TalkBack 已完成真機E2E。純訪客暱稱不具任何法律、財務或會員身分效力。
