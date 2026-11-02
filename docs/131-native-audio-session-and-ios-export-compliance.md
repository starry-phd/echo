# 131｜原生音訊工作階段（靜音鍵、背景、鎖定畫面）與 iOS 加密宣告

## 為什麼
2026-11-02 上架準備度健檢（Issue #3）A4、A6：
- `app/track/[id].tsx` 沒呼叫 `setAudioModeAsync`：iPhone 靜音鍵開啟時講座無聲；`expo-audio` plugin 雖已 `enableBackgroundPlayback`，但工作階段沒要求背景播放；沒有鎖定畫面資訊與控制。
- iOS 沒宣告 `ITSAppUsesNonExemptEncryption`，每次上傳 TestFlight 都要人工回答出口合規問題。

## 舊版比對（`yukidu/Echo-Starry@82cbf4f`）
`src/mediaSessionPolicy.ts`：`playsinline`；Media Session metadata = 標題、講師（artist）、album「繁星回聲」、講師照片，沒有照片時用 `/icon-192.png`、`/icon-512.png`；play／pause／seekbackward／seekforward／seekto。

## 實作
- `src/media/nativeAudioSession.ts`（純模組）：`NATIVE_AUDIO_MODE`（playsInSilentMode、shouldPlayInBackground、interruptionMode=doNotMix：講座播放時暫停其他 App 的音樂）、`NATIVE_LOCK_SCREEN_OPTIONS`（顯示倒退／快進）、`nativeLockScreenMetadata`（同舊版欄位；封面只接受同源相對路徑，否則退回 `/icon-512.png`；沒有 API origin 時不給圖片網址）。
- `app/track/[id].tsx`：**僅原生、僅在使用者按下播放一首 `playable` 的已驗證曲目時**才設定工作階段與鎖定畫面；離開或換曲時 `setActiveForLockScreen(false)`。Web 行為不變。
- `app.json`：`ios.infoPlist.ITSAppUsesNonExemptEncryption=false`（App 只使用系統 HTTPS，屬豁免）。
- 測試：`tests/native-audio-session.test.mjs`（5 項）。

## 權限界線
這是設定，不是播放授權。目前 112 份私人音訊與 28 份 guest 音訊仍全部 404，`playable` 曲目為 0，所以本批在 Production 上**不會發生任何播放**。不讀取／下載任何音訊。

## 未做與未驗證
- A5（`expo-updates`／`runtimeVersion`）：需要 EAS 帳號與專案 ID，留待業主建立 EAS 帳號後處理。
- A3（App 圖示／啟動畫面）：需業主提供 1024×1024 原始圖示。
- 真機（鎖定畫面、控制中心、靜音鍵、背景、來電中斷）未驗證；要等有合法可播放曲目＋EAS 內部測試版。
