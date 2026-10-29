# 舊版 `yukidu/Echo-Starry` → Expo 58 音檔卡逐項對照（2026-10-29）

## Work 後續：收藏清單、顯示篩選與安全詳情

- 原版 `AudioCard.tsx` 本機收藏行為有持久key；新卡雖能收藏卻沒有集中清單，不同頁面各持有React state也會失步。新增 `/favorites` 與全App共用偏好store；Expo58相容AsyncStorage2.2.0沿用兩個既有Web key，支援原生持久化。hydrate完成前不寫入、快速點擊序列儲存、讀/寫失敗保留記憶體操作並明示限制。
- 原版 `src/utils/ranks.ts` 將講師獎銜去GAR及創辦人修飾後作首頁篩選。新版只對已開放的歷史metadata做相同篩選，不讀會員獎銜或擴大內容權限。分類選項從未篩選的28筆metadata取得，不再隨搜尋消失；網友關鍵字未移植，不冒稱可搜尋不存在資料。
- 原版 `trackMatchesHomeSearch` 為多字AND交集；新版改為只在已准許欄位作同樣交集。Worker使用單一bound JSON token參數及SQLite JSON_each，維持public+verified/preview whitelist gate。真實SQLite回歸測試覆蓋交集與惡意輸入。
- `/preview/[id]` 純資訊詳情只解析當前28筆白名單，不查私人description、audio key、評論或會員資料；無audio source及分享入口。照片、姓名、時長、上架日、分類、唯讀統計可瀏覽，仍不等於原版所有詳情功能已完成。
- 修正熱門排序時誤顯示「最早上架」；分類、熱門及主選單補button語意，音檔選單有明確關閉控制。
- 實際Web影格讀回發現原彩虹transform停在-84px，並有native driver fallback警告；改為Web JS driver、Native維持native driver，明確每輪reset且不阻擋清單互動。另將responsive首輪Web markup固定與靜態輸出一致，避免伺服器/瀏覽器寬度不同造成hydration錯配。修復後仍須正式瀏覽器影格驗證。
- 是否正式部署以Issue #3即時證據為準。原生實機、完整評論/AI/會員/VIP/貼紙等仍未驗收。

**查核來源**：`src/components/AudioCard.tsx`（410 行）、`AudioCard.css`（新人彩虹邊框動畫 2.4s）、`src/App.tsx`、`src/components/DetailView.tsx`、`src/visitorTrackPolicy.ts`、舊 `echoes_db` 與新 `echo-starry` D1/R2 即時資料。原始錄音的權利範圍與可播放資格，和資料顯示分開核對。

| 舊版行為／視覺 | 新版現況／本 PR 修正 | 真正依賴 |
|---|---|---|
| 卡片左側講者／主題照片（`speakerAvatar`） | 28 個舊訪客卡封面全部為 `/api/r2/file/cover%2F...`；已逐筆確認新 Starry R2 `cover/` 28/28 非空。新增白名單限定的 `/api/v1/previews/:id/cover` 安全圖片串流，前端放回真圖。 | 不提供一般 `/api/r2/file/*` 或暴露 R2 key；不開放任何音訊 |
| 「新人」分類有流動彩虹外框 | 舊版 `AudioCard.css` 是 1px 彩虹線性漸層、2.4s 動畫，只在「新人」分類上。新版以 React Native Animated 層重現動態彩虹細框；保留原有淡粉底色。 | Web/Android/iOS 真實影格仍須截圖與實機比對 |
| 更多功能「⋮」浮動清單 | 舊 `AudioCard.tsx` 目前 main 有分享、詳細內容、加入／取消收藏；**這份可取得的源檔未找到「我不喜歡」**，但業主明確要求，新版另加「我不喜歡」在本機隱藏卡片，並提供一鍵還原。 | 偏好不假裝同步會員或跨設備；正式 ID 後再持久化 |
| 主色大標題、講師名和獎銜、分鐘、分類標籤 | 舊版 `AudioCard.css` 標題主色 1.25rem、900 字重，其他一般字重。新版回復標題主色、講師獎銜與「約 n 分鐘」，保留玫瑰版型。 | 視覺精準度仍要螢幕截圖 |
| 星級、評價人次、心得／按讚數 | 28 筆舊訪客卡資料源有原本公開的統計數字；在獨立 D1 snapshot 中記錄，前端顯示「舊版紀錄」，但不會讓未登入使用者寫評價。 | Starry ID 與業務統計 API 完成後才開啟互動 |
| 點照片播放、照片上/下的進度／貼紙／權限列 | 照片與權限標籤移植；非可播放音檔明確提示並禁止播放器／分享；已授權公開可播放的卡片仍走既有安全音訊詳情。 | 112 筆仍 private/copied；`guestVisible` 只管**舊版列表顯示**，不是播放權 |
| 舊版所有進階篩選、會員選單、評價、VIP、貼紙、逐字稿、AI、排行榜及詳情 | **尚未全部移植**，詳見 `docs/06-legacy-feature-inventory.md`；不為了外觀還原而繞過中央 ID/Battery、收費、個資與內容權利。 | 模組 API／權限與完整回歸驗收 |

### 資料驗證／安全

- 舊 D1 音檔共 112，guestVisible 33；先排除 VIP、限特定帳號、獎銜、貼紙費用後，28 筆可作保守資訊卡候選。
- 28 筆封面 key 全部在 Starry R2 `cover/` 中找到非空檔案。新增 `echo_guest_card_media` 專屬快照表，必須同時符合 `echo_guest_previews` 的現有白名單與 `echo_tracks` 的 `private+copied` 條件才有權看圖片。不得暴露任意 R2 物件。
- `/api/v1/catalog`、`/api/v1/tracks/:id`、`/api/v1/tracks/:id/stream` 仍要求 `visibility='public' AND migration_status='verified'`，本修復不更新這兩個欄位或聲稱音訊可播放。
- 舊版 rating/likes/comment counts 是快照，不能誤稱全新資料或假裝本機點擊已同步。
- 下一輪優先：登入／開放播放契約及 28 筆素材逐筆內容授權，原版頁面手機與桌面截圖逐項比對；用新的業務 API 逐步恢復進階功能。


## 延續：原版講師連結／熱門排序
- 舊版 `shared/speakers.ts` 只用 ASCII `&` 與全形 `＆` 分開多人演講者；`SpeakerNameLink.tsx` 點每位講者各自開啟講者頁。新 `speakerNames.ts` 沿用此規則，姓名改為可點選連結；新講者列表／講者作品頁會同時展示經白名單核准的非播放資訊卡與真正 public+verified 的作品，不暴露未核准作品。
- 舊版 `v145FourFilterToolbar.ts` 的熱門選單有「評價最高、按讚最多、心得最多、收藏人數」；新版用**已核對的舊版公開統計快照**恢復前三項排序（唯讀、非即時）；收藏人數仍待 Starry ID 正式提供，不虛構。
- 播放權限與講師頁在資料展示層各自隔離：點講者姓名僅導向白名單內的標題／照片／標籤，點未核准音檔仍不開放播放。


## 封面 28/28 完整部署驗收補強
Cloudflare R2 中 `cover/施素珍康家賓.png` 原始封面大小 2,045,487 bytes（超過舊版 Worker 2,000,000 bytes 的誤限），而且屬於已核准的 28 個白名單之一。此 bug 會造成 28 張中至少 1 張被錯誤隱藏。將白名單圖片大小限制提升至 5 MB，保留白名單 + 路徑驗證 + MIME 限制及 audio private gate；正式 deploy workflow 改為逐張抓取 **全部 28 個安全封面** 並確認回應為 image，而非只檢查第一張。這是防止「部分照片仍不顯示」的實測門檻。
