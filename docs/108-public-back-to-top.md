# 108｜原版公開列表／資訊頁浮動「回到頁面最前面」補齊

## 可查證原版行為
`yukidu/Echo-Starry/src/App.tsx` 約3347–3375行以浮動半透明 ↑ 按鈕提供 `回到頁面最前面`，原版使用多個瀏覽器 DOM scrollTo 來同時照顧首頁與詳細容器。新版 `starry-phd/echo/app/index.tsx` 只有首頁重設時自動捲回最上方，`app/preview/[id].tsx` 僅有分段跳轉，兩頁沒有可點選的浮動回頂入口。

## 安全與最小跨平台補齊
- 新建公開 UI 元件 `LegacyBackToTop`，使用 React Native `Pressable` + 半透明背景、44px以上觸控、語音標籤與主題色；不使用 `window`、`document` 或瀏覽器特有 DOM。
- 首頁透過既有 `homeScrollRef.current?.scrollTo({y:0,animated:true})`；訪客資訊頁透過既有 `sections.scrollRef.current?.scrollTo({y:0,animated:true})`，不跳轉新路由、不改 filter/rank/search/排序或已核准資料。
- 只作用於公開首頁與 `/preview/[id]` metadata-only 頁，**不接觸私人 track 播放、音訊 URL、會員 D1/R2**。首頁按回頂關閉搜尋建議與鍵盤，避免被浮動按鈕遮擋。
- 覆蓋現有各頁本來的 `ScrollView` 佈局，加上定位於底部中央的獨立按鈕；原有清單及分段捲動保持可用。
- 新增 `tests/legacy-back-to-top-parity.test.mjs`。source tests／Web與unsigned iOS/Android Hermes 只能確認建置／程式接線；真機按鈕位置、手勢、VoiceOver/TalkBack 仍須人工 E2E。

28 guest 永遠 metadata-only、不播放、不分享、不解鎖，Cover no-store、Stream HEAD 404/no-store/private deny 維持；Ads OFF、Auth contract pending、RevenueCat未初始化、不新增可計費資源或正式 DNS 變動。
