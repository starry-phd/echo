# Echo × Starry ID｜2026-11-07.14 安全增量交接

已存在的 Echo Repo 與 Worker 原樣沿用：正式 `echo-starry`、隔離 Web `echo-api-staging`。此分支不部署 production、不更動 `echo.starry.phd` 302、不重新建立 `echo-api` 或任何 D1，也不修改 Starry ID。

## 本次差異
- 同步 Starry ID 主專案最新版官方前端單檔 `sdk/starry-client.ts` 與 OpenAPI 3.1，原來的後端 `sdk/starry-sdk.ts` 和 Gitleaks 規則仍與中央一致。
- 官方 SDK 新增同機 SSO `sharedStorage`，並在會員狀態還原、回前景呼叫官方 `syncDeviceSignIn()`。上鎖／未授權等原有狀態仍 fail closed，網頁維持每分頁安全儲存。
- iOS 新增 `keychain-access-groups` 配置，群組 `$(AppIdentifierPrefix)phd.starry.shared`；只在同一個 Apple Team 簽署的 iOS App 間共用 `starry.sso`，各 App Refresh Token 仍完全隔離。這是 iOS 簽署 entitlement，**不是為 Apple 登入新增 OAuth 設定**。所有繁星 iOS App 需用**同一個** group 才有跨 App 效果。
- Android 同機跨 App SSO 在 **2026-11-07.14 已改為選做**。本 PR 不開發 Android 共用提供者；保留各 App 私有的 Refresh Token，不能假裝 Android 已自動同步登入，也不以此阻礙 Web/iOS 測試。
- iOS 共享群組需要重新簽署安裝新版 App；尚未真機驗收。當前 Web staging 不具備跨 App 儲存，不能代替真機 SSO 測試。
- 刪除／登出／切換帳號的中央 SSO 狀態需要跨 App 實機驗收後才能正式啟用。未新增 RevenueCat、金鑰、R2 音訊讀取或付費操作。

## 仍需的跨 App 協調
- 其他繁星 iOS App 應採用 `phd.starry.sso` 同群組並由相同 Team 簽名；不能假設它們已完成。
- Android 的共享帳號提供者 **需要先在擁有者批准的全生態系 App 中完成統一實作**，不能僅在 Echo 中建一個假的本機共用儲存。
- 舊 APK/IPA 的憑證是否與新版本相符，必須在**實際簽署版**驗證；EAS 舊 APK 不含這次原生設定。
- 帳號更換／登出所有 Apps 的真機同步及 Android SSO 安全機制未完成時，此 PR 保持 **DRAFT / NOT MERGED**。

## v2026-11-07.14 補強

- iPhone 的所有繁星 App 統一使用 `$(AppIdentifierPrefix)phd.starry.shared` Keychain Group，鍵名 `starry.sso`，從現有 Expo SecureStore `accessGroup` 存取；不需額外原生依賴。需用同 Team 簽署的新版 App 真機驗證。
- Web 用 Starry ID 官方 SDK 的 `shareWebSignIn`、`syncWebSignIn`、`completeWebSsoCheck`、`signOutWebEverywhere`。OAuth／Web Passkey 登入成功後向中央採用瀏覽器 Cookie，非登入回傳頁在載入／回前景呼叫官方 5 分鐘節流查詢，回到 `/auth/done` 依 fragment 正確完成一次性交換。只接受已登記 HTTPS 網址，回傳 URL 不帶 fragment；不以跨網站 localStorage 共用 Token。
- Web 登出按鈕遵照文字「登出所有繁星 App」，並額外告知僅同步此瀏覽器內的繁星網頁，不影響手機 App。Android 未完成共享通道，按鈕標示「登出此 App」。
