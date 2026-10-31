# 101｜音檔資訊卡三點選單：非同步定位回呼失效與跨平台安全收合

## 已從最新版原始碼確認的缺口
新版 `src/ui/echo/LegacyTrackCard.tsx` 的三點選單使用 React Native `Pressable.measureInWindow` 取得開啟位置。修復前，原生非同步回呼直接呼叫 `setMenuPosition(...);setOpen(true)`。既有 `useEffect(()=>setOpen(false),[track.id,viewport.width,viewport.height])` 只能在當下關閉，**不會取消先前還在等待的 measure callback**；當卡片剛被隱藏、資料列表更換、尺寸改變、背景點擊先關閉、或元件卸載後，舊回呼仍可能重新開啟選單或設定已卸載畫面的 state。這是新版跨平台 UI 的非同步競態，並非私人音訊問題。

## 修正策略
1. `menuSequence` 每次請求、使用者取消、所有選單操作關閉、卡片 `track.id`/viewport改變及元件卸載時遞增，使舊請求失效。
2. `latestMenuContext` 在每次 render 同步記下最新 track ID + viewport；即使 callback 比 effect cleanup 更早到，也會拒絕在不同卡片或尺寸重放。
3. 新增可純測試的 `isCardMenuAnchorValid` 與 `canApplyCardMenuMeasurement`，要求座標有限且觸發按鈕寬高 > 0、viewport 合法，request sequence/ID/viewport 必須與目前完全一致，才更新 Modal 位置並開啟；不從 React Native UI 推斷媒體權限。
4. Android back (`onRequestClose`)、背景、明確關閉、輔助使用者 Escape、收藏/詳細/分享/隱藏等每條選單離開路徑都統一呼叫 `dismissMenu`，避免等待中的回呼重新打開選單。
5. 保留原本 `cardMenuLayout` 的邊界定位、音檔卡不播放 gate、已核准公開分享 gate、收藏/隱藏權限與網頁原版外觀；不引入任何 DOM event listener。

## 驗證
- `tests/card-menu-layout.test.mjs` 新增純函式回歸，覆蓋正常 callback、無效幾何、重複點擊、旋轉、不同卡片、unmount、無效 viewport。
- `tests/card-menu-async-lifecycle.test.mjs` 確認所有非同步回呼、重設與選單退出入口都確實接上保護。
- CI 的 TypeScript／測試／iOS Android unsigned bundle／Web bundling 和 workers.dev HTTP smoke **不等於真人 Web/native 快速手勢 E2E**。只能按現有 CI 證據宣告。
- 仍須每批 exact feature CI→Ready→正常 protected merge→exact main CI→唯一現有 auto workflow_run workers.dev→首頁/API/private refusal、28 cover metadata/no-store + 28 stream HEAD404/no-store→CF官方最新100%及舊 `echo.starry.phd` mapping 不動。
