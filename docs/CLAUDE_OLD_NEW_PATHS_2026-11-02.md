# Claude 交接附件 B｜新舊程式路徑完整清單與功能路徑對照

> 本附件於 2026-11-02 對兩個 GitHub **完整 recursive Git tree** 唯讀盤點，`truncated=false`，共 **舊版 607 個受版本控制檔案、新版 381 個**。這是**逐檔路徑索引，不代表每個舊功能已移植**。正本工程指示請看 [Claude 完整接手主文件](CLAUDE_DEV_HANDOFF_2026-11-02.md)、[Issue #3](https://github.com/starry-phd/echo/issues/3)。

## A. 固定路徑與避免搞錯的版本

- **舊版來源 Repo**：<https://github.com/yukidu/Echo-Starry>；比較基準 SHA `82cbf4f112af57fcfed12ff2f6cf86010c03560e`；檔案基準 URL：`https://github.com/yukidu/Echo-Starry/blob/82cbf4f112af57fcfed12ff2f6cf86010c03560e/<舊檔案相對路徑>`。
- **新版開發 Repo（唯一允許寫入的 Echo Repo）**：<https://github.com/starry-phd/echo>；比較基準 SHA `fbb9596380cbaa5b37ff9850a6ffbe01fe2497fd`；檔案基準 URL：`https://github.com/starry-phd/echo/blob/fbb9596380cbaa5b37ff9850a6ffbe01fe2497fd/<新檔案相對路徑>`。
- **中央會員獨立 Repo**：<https://github.com/starry-phd/id>（不在 Echo Repo 內直接替代 Auth，不是此附件新檔案列表的一部分）。
- **主要線上網址**：新版 `https://echo-starry.starry-phd.workers.dev`；舊正式網域 `https://echo.starry.phd`。不得因網站名稱相近就修改 DNS 或舊 Worker。
- 下列「無直接等價」**不是遺漏資料**：說明受會員授權、播放權、貼紙、AI、後台或中央 API 限制而未移植。請勿複製舊 auth/secret/私人音訊程式繞過安全。
- 下列檔案清單以**交接前 main SHA** pin 定；新交接文件在 PR 合併後才加入 main，這不是清單遺漏。

## B. 經 Git tree 雙向驗證的核心功能／原版 → 新版路徑對照（52 組）

| 舊版相對路徑（yukidu/Echo-Starry） | 新版相對路徑（starry-phd/echo） | 相當範圍／權限差異 |
|---|---|---|
| `src/App.tsx` | `app/index.tsx`、`app/_layout.tsx` | 首頁／跨頁入口已拆成 Expo Router，不是逐行照搬 |
| `src/components/Navbar.tsx` | `src/ui/echo/LegacyHeader.tsx`、`src/ui/echo/QuickActions.tsx`、`src/ui/echo/QuickDragHandle.tsx` | 原版品牌列與右上主選單、快捷列；只保留公開訪客功能 |
| `src/components/Navbar.css` | `src/ui/echo/LegacyHeader.tsx`、`src/ui/echo/legacyTheme.tsx` | CSS 視覺由 React Native StyleSheet／tokens 承接 |
| `src/components/Navbar.v124.css` | `src/ui/echo/LegacyHeader.tsx`、`src/ui/echo/LegacyBrandWave.tsx`、`src/ui/echo/legacyBrandWaveMotion.ts` | 最新 CSS 取代舊 Mic／ping，正式 App 圖示及四條音波已還原 #141 |
| `src/utils/visitor.ts` | `src/ui/echo/guestNickname.ts` | 只移植正面隨機顯示暱稱；禁止沿用舊 deviceId |
| `src/components/TutorialSpotlight.tsx` | `src/ui/echo/LegacyGuestTutorial.tsx`、`src/ui/echo/legacyTutorialSpotlightGeometry.ts`、`src/ui/echo/legacyGuestTutorialPolicy.ts` | 訪客三步教學／Spotlight／本機偏好，#132–#138 |
| `src/components/AudioCard.tsx` | `src/ui/echo/LegacyTrackCard.tsx`、`src/ui/echo/legacyAudioCardSizing.ts` | 僅核准公開卡片／封面／歷史唯讀資料 |
| `src/components/AudioCard.css` | `src/ui/echo/LegacyTrackCard.tsx`、`packages/ui/src/tokens.ts` | 原版畫面依 RN StyleSheet 重新承接 |
| `src/components/AudioTrackList.tsx` | `app/index.tsx`、`src/ui/echo/LegacyFilterToolbar.tsx`、`src/ui/echo/cardSorting.ts`、`src/ui/echo/cardFilters.ts` | 公開列表／篩選／排序／分頁 |
| `src/components/DetailView.tsx` | `app/preview/[id].tsx`、`app/track/[id].tsx`、`src/ui/echo/LegacyLectureNotes.tsx`、`src/ui/echo/LegacyEngagementDetail.tsx` | 公開資訊詳細頁可用；播放只在逐筆 verified/public 授權後 |
| `src/components/SpeakerProfilePage.tsx` | `app/speaker/[name].tsx`、`src/ui/echo/LegacySpeakerRecordingRow.tsx`、`src/ui/echo/authorizedSpeakerProfile.ts` | 安全講師資料彈窗、公開錄音列表／分頁 |
| `src/components/SpeakerNameLink.tsx` | `src/ui/echo/speakerNames.ts`、`app/speaker/[name].tsx` | 拆分共同講師姓名連結，不將另一人私有資料混入 |
| `src/components/StatisticsView.tsx` | `app/stats.tsx`、`src/ui/echo/legacyRankingTabs.ts` | 排行榜外觀與可信公開歷史統計部分可用；會員等排名 blocked |
| `src/components/KeywordsTab.tsx` | `src/ui/echo/categorySuggestions.ts`、`app/index.tsx` | 只做已核准分類建議；原版網友關鍵字／排行無可信 API，未移植 |
| `src/components/ProfileModal.tsx` | `app/profile.tsx`、`src/ui/echo/legacyProfileTabs.ts` | 只有安全 Shell／本機偏好；中央 Auth 不可視作完成 |
| `src/components/NotificationsView.tsx` | `app/notifications.tsx`、`src/ui/echo/legacyNotifications.ts` | 唯讀未開通通知分頁；不觸及會員收件資料 |
| `src/components/ChangelogModal.tsx` | `src/ui/echo/LegacyPublicReleaseHistory.tsx`、`src/ui/echo/publicReleaseHistory.ts` | 只顯示已驗收的新公開版本節錄，不包含舊管理員編輯 API #140 |
| `src/components/IOSInstallPage.tsx` | `src/ui/echo/installGuide.ts`、`src/ui/echo/InstallAppButton.tsx` | 原版安裝導引的安全跨平台 UI；不等於已安裝 PWA／App |
| `src/components/InstallAppButton.tsx` | `src/ui/echo/InstallAppButton.tsx`、`src/ui/echo/useEarlyInstallPrompt.ts` | PWA 安裝提示／已安裝狀態 |
| `src/components/BwExportModal.tsx` | `src/ui/echo/publicInfoCardExport.ts` | 只輸出核准公開資訊卡，不讀私人錄音 |
| `src/components/ShareModal.tsx` | `src/ui/echo/LegacyVerifiedTrackShare.tsx`、`src/ui/echo/publicTrackSharing.ts` | 只有真正 verified/public 且再次驗證時才可分享；28 guest 卡禁止 |
| `src/components/CommentsSection.tsx` | `src/ui/echo/LegacyEngagementDetail.tsx`、`src/ui/echo/legacyEngagementSnapshot.ts` | 只顯示已授權歷史彙總；寫入評論／評價／按讚未授權 |
| `src/components/CommentPreviewModal.tsx` | `src/ui/echo/LegacyEngagementDetail.tsx` | 僅公開歷史數據資訊，完整私人留言未移植 |
| `src/utils/theme.ts` | `src/ui/echo/legacyTheme.tsx`、`src/ui/echo/themePreferenceStore.ts`、`src/ui/echo/FontZoom.tsx` | 24 主題／深淺色／字級本機偏好 |
| `src/utils/ranks.ts` | `src/ui/echo/legacySortFields.ts`、`src/ui/echo/publicSpeakerRankNavigation.ts`、`src/ui/echo/visibleAuthorizedRankFacets.ts` | 只能用現有核准公開 metadata 判定獎銜 |
| `src/utils/keywords.ts` | `src/ui/echo/categorySuggestions.ts` | 只有已核准分類相近 UI，非等價網友關鍵字功能 |
| `src/utils/speakerRecordingDate.ts` | `src/ui/echo/speakerRecordingDate.ts` | 公開作品日期呈現 |
| `src/utils/canvasExport.ts` | `src/ui/echo/publicInfoCardExport.ts` | 唯讀公開資訊卡匯出；不可匯出未核准內容 |
| `src/utils/offlineAudio.ts` | **無直接等價新檔案／未移植** | 私人音訊／離線音訊尚未核准，不可移植或測試 GET |
| `src/components/MiniPlayer.tsx` | `src/ui/echo/LegacyPlaybackTimeline.tsx` | 僅有安全視覺基礎，不代表音訊播放授權或真機背景播放 |
| `src/components/StickersModal.tsx` | **無直接等價新檔案／未移植** | 貼紙／Starry Battery 權益未串接、不可沿用舊扣發 |
| `src/components/VipTracksTab.tsx` | **無直接等價新檔案／未移植** | VIP／會員等級授權尚未經新中央權限驗證 |
| `src/components/UploadModal.tsx` | **無直接等價新檔案／未移植** | 真正檔案上傳／管理權限 blocked |
| `src/components/AudioWorkspacePage.tsx` | **無直接等價新檔案／未移植** | 完整後台音檔管理 blocked |
| `src/components/AdminModal.tsx` | **無直接等價新檔案／未移植** | 舊管理員與 session 不可信，不移植 |
| `src/components/TranscriptQaAdmin.tsx` | **無直接等價新檔案／未移植** | AI/逐字稿/推論成本未核准，不移植 |
| `src/components/AiQuestionSettingsAdmin.tsx` | **無直接等價新檔案／未移植** | AI 管理設定未核准，不移植 |
| `worker/index.ts` | `worker/index.ts` | 同名但權限模型重寫；新 Worker 僅釋出 public+verified/28 preview |
| `worker/authRouter.ts` | `src/auth/centralMember.ts`、`src/auth/centralMemberContract.ts` | 僅可信 DTO / fail closed，正式認證在獨立中央 starry-phd/id |
| `worker/echoCentralProfileGateway.ts` | `src/auth/centralMemberContract.ts` | 中央 API 必須取得正式已部署契約；不可拿舊 Gateway 直接連 D1 |
| `worker/favoriteRouter.ts` | `src/ui/echo/deviceFavorites.ts`、`src/ui/echo/DevicePreferences.tsx` | 新版只在裝置本機收藏，不是舊伺服端會員收藏 |
| `worker/hiddenTrackRouter.ts` | `src/ui/echo/localCardVisibility.ts`、`src/ui/echo/dislikedTracks.ts` | 新版只在本機隱藏公開卡片 |
| `worker/batteryRouter.ts` | **無直接等價新檔案／未移植** | 由專責 Battery 中央服務持有，不在 Echo 工程直接實作 |
| `schema.sql` | `database/schema.sql` | 不同的 Echo 專屬業務資料結構，禁止直接匯入舊 users/auth_sessions |
| `migrations/20261019_guest_app_access.sql` | `database/migrations/20261029_guest_metadata_previews.sql` | 不是同一遷移：新版採獨立白名單公開預覽 |
| `public/icon-192.png` | `public/icon-192.png` | 兩 Repo Git blob SHA 相同：f3a703a8c0850062a396fd7025a09a6e8055a946 |
| `public/icon-512.png` | `public/icon-512.png` | 兩 Repo 共享正式 PWA Icon，勿改內容 |
| `public/icon.svg` | `public/icon.svg` | 兩 Repo 均存在，同名不代表 UI 源碼可任意取代圖片 |
| `public/manifest.webmanifest` | `public/manifest.webmanifest` | PWA manifest 存在，真裝置安裝尚未等同驗收 |
| `public/sw.js` | **無直接等價新檔案／未移植** | 不可搬回原版快取策略；尤其不能離線下載私人音訊 |
| `starry-id/schema.sql` | **無直接等價新檔案／未移植** | 原版內嵌舊會員資料不複製；中央現況請讀獨立 starry-phd/id |
| `starbeauty/schema.sql` | **無直接等價新檔案／未移植** | 原版其他產品子目錄不屬本 Echo App |

## C. 原版完整受版本控制檔案路徑（607 檔）

下列每行都相對於 `yukidu/Echo-Starry/`；非目錄樹快照猜測。部分檔案可能是舊認證、私人會員、音訊／上傳管理或其他子產品，**只作比較，不能直接移植、觸發或訪問未授權的資料**。

### （根目錄檔案）（12）

```text
.env.example
.gitignore
.npmrc
CLOUDFLARE_DEPLOYMENT.md
index.html
metadata.json
package.json
schema.sql
server.ts
tsconfig.json
vite.config.ts
wrangler.toml
```

### .github（12）

```text
.github/dependabot.yml
.github/transcript-v282-checkpoint.md
.github/workflows/codeql.yml
.github/workflows/gratitude-sso-bridge.yml
.github/workflows/production-smoke.yml
.github/workflows/regression.yml
.github/workflows/starbeauty-deploy.yml
.github/workflows/starry-id-health-repair.yml
.github/workflows/starry-id-migrate.yml
.github/workflows/starry-id-private-report-export.yml
.github/workflows/starry-id-provision.yml
.github/workflows/starry-id-spouse-backfill.yml
```

### container（3）

```text
container/audio-segmenter/Dockerfile
container/audio-segmenter/README.md
container/audio-segmenter/server.mjs
```

### data（1）

```text
data/store.json
```

### docs（12）

```text
docs/healthcheck-2026-10-08.md
docs/STARRY_AI_MANAGEMENT_REGISTRY.md
docs/STARRY_AI3_A02_A05_SAFE_ADMIN.md
docs/STARRY_AI3_A04_01_INDEPENDENT_ROUTING.md
docs/STARRY_AI3_MODEL_REGISTRY.md
docs/STARRY_GUEST_ACCESS.md
docs/v157-auth-member-architecture.md
docs/v159-starbeauty-profile-sync.md
docs/v228-spouse-single-unlink.md
docs/v265-home-first-load.md
docs/v266-profile-motto-save.md
docs/v3.0.md
```

### migrations（9）

```text
migrations/20261019_guest_app_access.sql
migrations/v187_track_speakers.sql
migrations/v281_transcript_contribution_future.sql
migrations/v281_transcript_moderation.sql
migrations/v281_transcripts.sql
migrations/v312_ai_speaker_profiles.sql
migrations/v319_speaker_bio_waiting_sources.sql
migrations/v320_story_attribution_pilot.sql
migrations/v322_story_auto_run.sql
```

### public（14）

```text
public/icon-192.png
public/icon-512.png
public/icon-monochrome.svg
public/icon.svg
public/manifest.webmanifest
public/robots.txt
public/sw.js
public/transcript-admin.js
public/transcript-battery-settings-v301.js
public/transcript-client-v290.js
public/transcript-ui-v293.js
public/transcript-ui-v297.js
public/transcript-user-notifications.js
public/v303-runtime-fixes.js
```

### scripts（11）

```text
scripts/generate-icons.py
scripts/scanThemeLegacy.mjs
scripts/v273BackfillDuplicateSpouses.mjs
scripts/verifyCategoryFilterUi.mjs
scripts/verifyThemeMenuUi.mjs
scripts/verifyV156Ui.mjs
scripts/verifyV163RootUi.mjs
scripts/verifyV167CategoryFilterUi.mjs
scripts/verifyV167PageNavigation.mjs
scripts/verifyV169UploadTabs.mjs
scripts/verifyV174CrownTruePage.mjs
```

### shared（16）

```text
shared/battery.ts
shared/commentAuthorStyle.ts
shared/commentTime.ts
shared/learningHistoryAccess.ts
shared/learningProgress.ts
shared/legacyData.ts
shared/meteorReward.ts
shared/profileCompletion.ts
shared/qaAnswerRules.ts
shared/r2Files.ts
shared/shareMetadata.ts
shared/speakerBiographyStatus.ts
shared/speakers.ts
shared/stickers.ts
shared/storyAttribution.ts
shared/transcriptCleanupPolicy.ts
```

### src（161）

```text
src/App.tsx
src/audioWorkspace.css
src/authSessionPolicy.ts
src/batteryTerminologyPolicy.ts
src/categoryIntegrityBootstrap.ts
src/categoryManagementPolicy.ts
src/changelogReleaseNotes.ts
src/changelogV37PublicPolicy.ts
src/components/AdminModal.tsx
src/components/AiBadge.css
src/components/AiBadge.tsx
src/components/AiQuestionSettingsAdmin.tsx
src/components/AiSpeakerAdmin.tsx
src/components/AiSpeakerStoryAdmin.tsx
src/components/AudioCard.css
src/components/AudioCard.tsx
src/components/AudioTrackList.tsx
src/components/AudioWorkspacePage.tsx
src/components/AvatarCropModal.tsx
src/components/BwExportModal.tsx
src/components/ChangelogModal.tsx
src/components/CollapsibleCommentText.tsx
src/components/CommentPreviewModal.tsx
src/components/CommentsSection.tsx
src/components/DataCenterTab.tsx
src/components/DetailView.tsx
src/components/InstallAppButton.tsx
src/components/IOSInstallPage.tsx
src/components/KeywordsTab.tsx
src/components/MemberDetailPreviewModal.tsx
src/components/MemberExportModal.tsx
src/components/MemberPreviewModal.tsx
src/components/MiniPlayer.tsx
src/components/Navbar.css
src/components/Navbar.tsx
src/components/Navbar.v124.css
src/components/NotificationErrorBoundary.tsx
src/components/NotificationsView.tsx
src/components/NumerologyGrid.tsx
src/components/ProfileModal.tsx
src/components/ShareModal.tsx
src/components/SocialLinkList.tsx
src/components/SpeakerNameLink.tsx
src/components/SpeakerProfilePage.tsx
src/components/StatisticsView.tsx
src/components/StickerFeedback.tsx
src/components/StickerGuideTable.tsx
src/components/StickerLeaderboardTab.tsx
src/components/StickersModal.tsx
src/components/StickerSpendDialog.tsx
src/components/ThemedSelect.tsx
src/components/TranscriptCleanupAdmin.tsx
src/components/TranscriptQaAdmin.tsx
src/components/TutorialSpotlight.tsx
src/components/TwinklingStars.tsx
src/components/UplineManagement.tsx
src/components/UploadModal.tsx
src/components/VipTracksTab.tsx
src/config/auth.ts
src/ecosystemSsoClient.ts
src/globalNavigationPolicy.ts
src/googleCredentialExchange.ts
src/googleIdentityBridge.ts
src/googleIdentityPlatformUx.ts
src/googleLoginDeadline.ts
src/homeDensityPolicy.ts
src/homePlaylistPolicy.ts
src/index.css
src/jpegExportPolicy.ts
src/main.tsx
src/mediaSessionPolicy.ts
src/memberProfileSchemaBridge.ts
src/mobileMenuHalfLayout.css
src/platform/index.ts
src/quickShortcutPreferences.ts
src/sessionCache.ts
src/shareAuthRecovery.ts
src/stickerGuidePolicy.ts
src/stickerSummaryClient.ts
src/taiwanCrownMenuLink.ts
src/taiwanCrownPage.css
src/trackVisibilityPolicy.ts
src/types.ts
src/uploadModalPresentationPolicy.ts
src/userProfileMottoAugment.d.ts
src/utils/api.ts
src/utils/audio.ts
src/utils/canvasExport.ts
src/utils/canvasExportLegacy.ts
src/utils/comments.ts
src/utils/dataCenterExport.ts
src/utils/id3Parser.ts
src/utils/keywords.ts
src/utils/memberLearningCardExport.ts
src/utils/notificationsModel.ts
src/utils/numerology.ts
src/utils/offlineAudio.ts
src/utils/ranks.ts
src/utils/speakerRankBadge.ts
src/utils/speakerRecordingDate.ts
src/utils/theme.ts
src/utils/visitor.ts
src/v126MenuPolish.ts
src/v127MenuIdentityPalette.ts
src/v136GuestMenu.css
src/v139HomeUploadPolish.ts
src/v140HomeVisualRefresh.ts
src/v141HomeVisualRefresh.ts
src/v143FavoriteCountCtaPolish.ts
src/v144GuestCtaFilterPreview.ts
src/v145FourFilterToolbar.ts
src/v147NavbarOverlayFix.ts
src/v150ThemeActionLabel.ts
src/v156FastUiPolish.ts
src/v166FilterSearchMatch.css
src/v171ChangelogNote.ts
src/v173ChangelogCompletion.ts
src/v174CrownTruePage.css
src/v174CrownTruePage.ts
src/v174ReleaseNote.ts
src/v175ReleaseNote.ts
src/v176CrownAvatarShine.css
src/v176CrownAvatarShine.ts
src/v177CrownPaletteRing.css
src/v177CrownPaletteRing.ts
src/v178CrownDiagonalReflection.css
src/v178CrownDiagonalReflection.ts
src/v179CrownPolish.css
src/v179CrownPolish.ts
src/v180CrownR2Avatars.ts
src/v181HomeToolbarDislike.css
src/v181HomeToolbarDislike.ts
src/v181PreviewProductionReadBridge.ts
src/v183DislikeFavoritesPolish.ts
src/v184SpeakerRelationship.ts
src/v187ReleaseNote.ts
src/v189MobilePermissionLayoutFix.ts
src/v189PlaybackSwitchConfirm.ts
src/v189ReleaseNote.ts
src/v190RankBadge.css
src/v190ReleaseNote.ts
src/v192HiddenTrackUi.css
src/v192HiddenTrackUi.ts
src/v192ReleaseNote.ts
src/v193RankBadgeVisual.css
src/v193RankBadgeVisual.ts
src/v193ReleaseNote.ts
src/v194RankBadgeCleanup.css
src/v194RankBadgeCleanup.ts
src/v194ReleaseNote.ts
src/v195RankBadgeContourLights.css
src/v195RankBadgeContourLights.ts
src/v195ReleaseNote.ts
src/v196ReleaseNote.ts
src/v197ReleaseNote.ts
src/v198RankBadgeIndependentPulses.ts
src/v198ReleaseNote.ts
src/v199ReleaseNote.ts
src/v200ReleaseNote.ts
src/v201ReleaseNote.ts
src/visitorTrackPolicy.ts
```

### starbeauty（8）

```text
starbeauty/package.json
starbeauty/public/app.js
starbeauty/public/index.html
starbeauty/public/styles.css
starbeauty/README.md
starbeauty/schema.sql
starbeauty/worker/index.js
starbeauty/wrangler.template.toml
```

### starry-id（28）

```text
starry-id/capture-time-travel-bookmark.mjs
starry-id/ECHOSTARS_FIELD_MAPPING.md
starry-id/exportDuplicateAmwayReport.mjs
starry-id/migrateBatteries.ts
starry-id/migrateFromEchoStars.ts
starry-id/migrations/20261014_notifications.sql
starry-id/migrations/20261014_profile_options.sql
starry-id/migrations/20261014_profile_schema.sql
starry-id/migrations/20261015_battery_hundredth_rewards.sql
starry-id/migrations/20261015_battery_ledger.sql
starry-id/migrations/20261016_central_health_guards.sql
starry-id/migrations/20261016_starry_mirror_app_tokens.sql
starry-id/migrations/20261017_profile_semantic_guards.sql
starry-id/migrations/20261020_ai_model_registry.sql
starry-id/migrations/20261020_ai_model_safe_admin.sql
starry-id/migrations/20261020_ai_task_routing_a04_01.sql
starry-id/node-globals.d.ts
starry-id/provision-and-audit.sh
starry-id/read-count.mjs
starry-id/README.md
starry-id/remoteMigrate.ts
starry-id/repair-report-public-key.txt
starry-id/repairCentralHealth.mjs
starry-id/retireLegacyStickerLedger.ts
starry-id/schema.sql
starry-id/verify-schema.mjs
starry-id/verifyCentralHealth.mjs
starry-id/write-audit-report.mjs
```

### tests（230）

```text
tests/adminMemberDelete.test.ts
tests/audioCardTypography.test.ts
tests/authReliability.test.ts
tests/categoryIntegrity.test.ts
tests/categoryManagementPolicy.test.ts
tests/centralAiModelAdmin.test.ts
tests/centralAiModelRegistry.test.ts
tests/centralAiTaskRoutingA04.test.ts
tests/changelogReleaseNotes.test.ts
tests/changelogV37PublicPolicy.test.ts
tests/commentCollapse.test.ts
tests/commentModerationRemoval.test.ts
tests/commentTimestamp.test.ts
tests/community.test.ts
tests/detailPageUx.test.ts
tests/downloadStarryCentralSso.test.ts
tests/downloadStarrySso.test.ts
tests/globalNavigation.test.ts
tests/googleAuthSecurity.test.ts
tests/googleLoginDeadline.test.ts
tests/googleLoginSsoRace.test.ts
tests/helpers/database.ts
tests/homeAudioCardTheme.test.ts
tests/homeDensity.test.ts
tests/homeKeywordCounts.test.ts
tests/homeLuckyDrawUi.test.ts
tests/homePlaylistPolicy.test.ts
tests/homeTutorialSpotlight.test.ts
tests/imageExportQuality.test.ts
tests/iosCentralCookieBridge.test.ts
tests/keywordHeaderDetailLayout.test.ts
tests/keywordLimit.test.ts
tests/learningHistoryAccess.test.ts
tests/learningHistoryCompatibility.test.ts
tests/learningProgress.test.ts
tests/mediaSessionPolicy.test.ts
tests/miniPlayerCommentLayout.test.ts
tests/mobileMenuHalfLayout.test.ts
tests/mobileMenuWidth.test.ts
tests/newcomerRainbow.test.ts
tests/offlineAudioBehavior.test.ts
tests/organizationRelationships.test.ts
tests/organizationUi.test.ts
tests/platformLayer.test.ts
tests/playbackOwnerRouter.test.ts
tests/privacyCrawler.test.ts
tests/profileLoginUx.test.ts
tests/profileUplineAutocomplete.test.ts
tests/publicLearningHistoryRoute.test.ts
tests/releaseIntegrity.test.ts
tests/serviceWorkerCache.test.ts
tests/shareLinks.test.ts
tests/starbeautyProfileSync.test.ts
tests/starryAiManagement.test.ts
tests/starryAppAccessAdmin.test.ts
tests/starryBulkAccessAdmin.test.ts
tests/starryGuestAppAccess.test.ts
tests/starryGuestLoading.test.ts
tests/starryIdCentral.test.ts
tests/starryIdMemberCenter.test.ts
tests/starryIdProfileSchema.test.ts
tests/starryIdV211.test.ts
tests/starryIdV212PublicCardBridge.test.ts
tests/starryIdV215InlineVisibility.test.ts
tests/starryIdV216ManualCard.test.ts
tests/starryIdV218Toolbar.test.ts
tests/starryIdV220CentralProfileDirectory.test.ts
tests/starryIdV221Provision.test.ts
tests/starryIdV222MemberProfile.test.ts
tests/starryIdV224SpouseDistributor.test.ts
tests/starryIdV225SpouseInstant.test.ts
tests/starryIdV226SpouseDialog.test.ts
tests/starryIdV227MobileToolbar.test.ts
tests/starryIdV228SingleUnlink.test.ts
tests/starryIdV229SpouseDataConsistency.test.ts
tests/starryIdV230Notifications.test.ts
tests/starryIdV230ProfileUx.test.ts
tests/starryIdV230RankPending.test.ts
tests/starryIdV239PublicVisibility.test.ts
tests/starryIdV241VisibilityUx.test.ts
tests/starryIdV242EmailZodiacFields.test.ts
tests/starryIdV245BatteryLedger.test.ts
tests/starryIdV246FreezeFix.test.ts
tests/starryIdV247MenuFreezeFix.test.ts
tests/starryIdV248GlobalFreeze.test.ts
tests/starryIdV250AmwayPublicCard.test.ts
tests/starryIdV253InstantNavigation.test.ts
tests/starryIdV256UnifiedMenu.test.ts
tests/starryIdV259OverlayEffect.test.ts
tests/starryMainLogoutCorsV66.test.ts
tests/starryMainV259.test.ts
tests/starryMeteorRewardBands.test.ts
tests/starryMirrorBridge.test.ts
tests/starrySelectionAcrossFilters.test.ts
tests/stickerEconomy.test.ts
tests/stickerGuidePolicy.test.ts
tests/stickerSummaryClient.test.ts
tests/stickerTransactions.test.ts
tests/transcript-audio-segmenter-v282.test.ts
tests/transcript-v293-browser-translation.test.ts
tests/transcriptCleanupC1.test.ts
tests/transcriptEmergencyRecovery20261018.test.ts
tests/transcriptRelistenR2H1.test.ts
tests/transcriptV290Isolation.test.ts
tests/transcriptV296Experience.test.ts
tests/transcriptV298ContinuousQueue.test.ts
tests/transcriptV299Concurrency5.test.ts
tests/transcriptV300SentencePolicy.test.ts
tests/uploadCoverLibraryStability.test.ts
tests/uploadModalPresentationPolicy.test.ts
tests/v102CleanArchitecture.test.ts
tests/v106StickerLeaderboard.test.ts
tests/v107MobileOverlayFont.test.ts
tests/v109TopOverlayPrimary.test.ts
tests/v110MainMenuPages.test.ts
tests/v111HiddenBalanceCorrection.test.ts
tests/v112RankIntegrity.test.ts
tests/v113RemainingRankDisplays.test.ts
tests/v114MobileMenuVisibility.test.ts
tests/v115AdminVisibilityAndLogout.test.ts
tests/v116NotificationTabs.test.ts
tests/v117IosGoogleLogin.test.ts
tests/v118UniversalHamburgerStickerPolicy.test.ts
tests/v120PinnedToolbarShortcuts.test.ts
tests/v121ShortcutCustomization.test.ts
tests/v122SingleLineNavbar.test.ts
tests/v123InlineMenuPins.test.ts
tests/v124DraggableQuickToolbar.test.ts
tests/v125MenuHeaderActions.test.ts
tests/v126MenuFontInstallPolish.test.ts
tests/v127MenuIdentityPalette.test.ts
tests/v128IdentityPaletteShortcuts.test.ts
tests/v129MenuRefreshAlignment.test.ts
tests/v130MenuControls.test.ts
tests/v131GoogleLoginExperience.test.ts
tests/v131MenuVisualRefactor.test.ts
tests/v138AdminTabCleanup.test.ts
tests/v138UploadAdminRework.test.ts
tests/v139HomeUploadRanking.test.ts
tests/v140HomeVisualRefresh.test.ts
tests/v143FavoriteCountCtaPolish.test.ts
tests/v144GuestCtaFilterPreview.test.ts
tests/v145FourFilterToolbar.test.ts
tests/v147NavbarOverlayFix.test.ts
tests/v148LuckyDrawStability.test.ts
tests/v149GuestRegistrationRepeatability.test.ts
tests/v150ThemeActionLabel.test.ts
tests/v151ThemeActionLabelLegacyLiteral.test.ts
tests/v152ThemeActionReactSource.test.ts
tests/v153ThemeActionVisualTruth.test.ts
tests/v154ThemeActionDelivery.test.ts
tests/v155CategoryFilterBridge.test.ts
tests/v156FastUiPolish.test.ts
tests/v167PageNavigation.test.ts
tests/v170HomeCardStickerProgress.test.ts
tests/v171TaiwanCrownStaticPage.test.ts
tests/v172TaiwanCrownIntegratedPage.test.ts
tests/v173ChangelogCompleteness.test.ts
tests/v174CrownTruePage.test.ts
tests/v175RemoveCrownBackButton.test.ts
tests/v176CrownAvatarShine.test.ts
tests/v177CrownPaletteRing.test.ts
tests/v178CrownDiagonalReflection.test.ts
tests/v178PalettePersistence.test.ts
tests/v179CrownPolish.test.ts
tests/v180CrownR2Avatars.test.ts
tests/v181HomeToolbarDislike.test.ts
tests/v183DislikeFavoritesPolish.test.ts
tests/v184DislikeNameRelations.test.ts
tests/v185PermissionProfileSocial.test.ts
tests/v187MultiSpeaker.test.ts
tests/v1892AudioEditSaveGuard.test.ts
tests/v189MobilePermissionLayoutFix.test.ts
tests/v189PlaybackSwitchConfirm.test.ts
tests/v190RankBadgeIntegration.test.ts
tests/v192HiddenTrackVisibility.test.ts
tests/v193RankBadgeVisual.test.ts
tests/v194RankBadgeCleanup.test.ts
tests/v195RankBadgeContourLights.test.ts
tests/v196RankBadgeContourFix.test.ts
tests/v197RankBadgeSilhouetteFix.test.ts
tests/v198RankBadgeIndependentPulses.test.ts
tests/v199RankBadgeTrueIndependentPulses.test.ts
tests/v200RankBadgeBiggerSparseRandom.test.ts
tests/v201MemberProfileMenuTools.test.ts
tests/v214EchoStarryBrandRename.test.ts
tests/v217AvatarCrop.test.ts
tests/v219NavbarChineseBrand.test.ts
tests/v243CentralBattery.test.ts
tests/v243DeepHealth.test.ts
tests/v244BatteryRetirement.test.ts
tests/v265HomeFirstLoad.test.ts
tests/v265HomeFirstLoadBehavior.test.ts
tests/v271ProfileNativeMottoFinal.test.ts
tests/v271StarryIdCentralHealthRepair.test.ts
tests/v272StarryIdPrivateReportExport.test.ts
tests/v273StarryIdDuplicateSpouseBackfill.test.ts
tests/v274StarryIdSpousePublicNumber.test.ts
tests/v276CentralProfileSource.test.ts
tests/v277ProfileSavePerformance.test.ts
tests/v278EcosystemSsoSecurity.test.ts
tests/v279DownloadEcosystemSso.test.ts
tests/v280EcosystemCentralLogin.test.ts
tests/v303RuntimeFixes.test.ts
tests/v305StarryIdProfileIntegrity.test.ts
tests/v306StarryIdGlobalIntegrity.test.ts
tests/v307StarryHealthWorkflow.test.ts
tests/v308MottoMemberIsolation.test.ts
tests/v308NotificationsMemory.test.ts
tests/v309AiSpeakerQa.test.ts
tests/v310AudioManagementStandalonePage.test.ts
tests/v311AiReplyTyping.test.ts
tests/v312SpeakerProfiles.test.ts
tests/v313QaSuperAdminPlaybackFormat.test.ts
tests/v313SpeakerModalNotifications.test.ts
tests/v314LegacyQaSettingsCompatibility.test.ts
tests/v315QaTypingProfileDialog.test.ts
tests/v316RemoveDailySpeakerBioCap.test.ts
tests/v317NotificationsIsolation.test.ts
tests/v318NotificationObserverLoop.test.ts
tests/v319SpeakerBiographyTruth.test.ts
tests/v320StoryOwnerPilot.test.ts
tests/v321StoryAttributionInference.test.ts
tests/v322StoryAutoRun.test.ts
tests/v323PrivateQaDualModel.test.ts
tests/v324QaModelsAndDisclaimer.test.ts
tests/v325DuduCommentAuthorStyle.test.ts
tests/v326AiQuestionAdmin.test.ts
tests/vipAutoplay.test.ts
tests/visitorTrackPolicy.test.ts
```

### uploads（2）

```text
uploads/1790815391709-gjhcjp.mp3
uploads/1790839536795-r282g2.mp3
```

### worker（88）

```text
worker/adminUserDeleteRouter.ts
worker/aiSpeakerBiographyScheduler.ts
worker/aiSpeakerProfileRouter.ts
worker/aiSpeakerQaOpenaiProvider.ts
worker/aiSpeakerQaRouter.ts
worker/aiSpeakerQaTestRouter.ts
worker/aiSpeakerStoryAutoScheduler.ts
worker/aiSpeakerStoryInference.ts
worker/aiSpeakerStoryRouter.ts
worker/audioSegmenterContainer.ts
worker/authRouter.ts
worker/batteryRouter.ts
worker/categoryIntegrityRouter.ts
worker/cloudflare-workflows-compat.d.ts
worker/community.ts
worker/downloadStarryCentralSso.ts
worker/downloadStarrySsoRouter.ts
worker/echoCentralProfileGateway.ts
worker/externalMemberSnapshot.ts
worker/favoriteRouter.ts
worker/hiddenStickerBalanceCorrection.ts
worker/hiddenTrackRouter.ts
worker/index.ts
worker/iosGoogleRedirectRouter.ts
worker/learningCardRouter.ts
worker/legacyStickerRouter.ts
worker/memberRepository.ts
worker/organizationModel.ts
worker/organizationRouter.ts
worker/playbackOwnerRouter.ts
worker/privacyCrawlerRouter.ts
worker/sessionCookieRouter.ts
worker/shareRouter.ts
worker/starbeautySsoRouter.ts
worker/starryAiManagement.ts
worker/starryAiManagementPage.ts
worker/starryAiModelAdmin.ts
worker/starryAiModelAdminPage.ts
worker/starryAiModelRegistry.ts
worker/starryAiModelRegistryPage.ts
worker/starryAiTaskRouting.ts
worker/starryAiTaskRoutingPage.ts
worker/starryAppAccess.ts
worker/starryAppAccessBulk.ts
worker/starryEcosystemAuthEntryRouter.ts
worker/starryEcosystemSsoRouter.ts
worker/starryGuestAppAccess.ts
worker/starryIdCentralRouter.ts
worker/starryIdMemberCenterPage.ts
worker/starryIdNotificationsRouter.ts
worker/starryIdNotificationSummaryRouter.ts
worker/starryIdProfileDirectoryRouter.ts
worker/starryIdRandomMottoRouter.ts
worker/starryIdRankUpdateRouter.ts
worker/starryIdSpouseRouter.ts
worker/starryIdSpouseSchema.ts
worker/starryIdSync.ts
worker/starryIdV211Router.ts
worker/starryIdV212PublicCardBridge.ts
worker/starryIdV216Enhancer.ts
worker/starryIdV218ResponseEnhancer.ts
worker/starryIdV222Enhancer.ts
worker/starryIdV230ClientRouter.ts
worker/starryIdV245BatteryRouter.ts
worker/starryIdV253NavigationEnhancer.ts
worker/starryIdV256UnifiedMenu.ts
worker/starryMainAudioSegmenterEntry.ts
worker/starryMainBatteryGameRouter.ts
worker/starryMainInlineLoginRouter.ts
worker/starryMemberDirectoryFilter.ts
worker/starryMirrorBridgeRouter.ts
worker/starryProfileSchemaRouter.ts
worker/starryProfileSchemaService.ts
worker/stickerRouter.ts
worker/transcriptBulkScheduler.ts
worker/transcriptCleanupService.ts
worker/transcriptLedgerSettingsInjector.ts
worker/transcriptMemberNotificationsRouter.ts
worker/transcriptModerationRouter.ts
worker/transcriptRouter.ts
worker/transcriptSequentialSchedulerV293.ts
worker/transcriptTranslationV285.ts
worker/transcriptV281Gateway.ts
worker/transcriptWorkflowV281.ts
worker/transcriptWorkflowV282.ts
worker/uiPreferencesRouter.ts
worker/uplineAdminRouter.ts
worker/v192TrackVisibilityRouter.ts
```

## D. 新版完整受版本控制檔案路徑（381 檔）

下列每行都相對於 `starry-phd/echo/`；包括已核准程式、候選契約、封閉的守衛腳本、測試、文件和歷史快照。檔案存在**不等於**其中的功能已上線。

### （根目錄檔案）（10）

```text
.env.example
.gitignore
app.json
eas.json
eslint.config.mjs
package.json
README.md
starry.app.json
tsconfig.json
wrangler.toml
```

### .github（5）

```text
.github/workflows/audit-private-audio.yml
.github/workflows/ci.yml
.github/workflows/deploy-worker.yml
.github/workflows/migrate-r2.yml
.github/workflows/probe-r2.yml
```

### app（11）

```text
app/_layout.tsx
app/+html.tsx
app/favorites.tsx
app/index.tsx
app/notifications.tsx
app/preview/[id].tsx
app/profile.tsx
app/speaker/[name].tsx
app/speaker/index.tsx
app/stats.tsx
app/track/[id].tsx
```

### database（4）

```text
database/legacy-staging-status.json
database/migrations/20261029_guest_card_media_parity.sql
database/migrations/20261029_guest_metadata_previews.sql
database/schema.sql
```

### docs（130）

```text
docs/01-architecture.md
docs/02-central-member-api-contract.md
docs/03-r2-migration.md
docs/04-deployment.md
docs/05-dev-i-compliance.md
docs/06-legacy-feature-inventory.md
docs/07-legacy-ui-parity.md
docs/09-r2-migration-acceptance.md
docs/10-guest-preview-metadata.md
docs/100-clear-deep-link-route-with-filter-reset.md
docs/101-card-menu-async-measurement-lifecycle.md
docs/102-header-menu-outside-dismiss.md
docs/103-header-search-suggestion-dismiss.md
docs/104-menu-home-approved-public-refetch.md
docs/105-menu-theme-dismiss-parity.md
docs/106-pinned-font-quick-controls.md
docs/107-menu-install-state-and-a11y.md
docs/108-public-back-to-top.md
docs/109-early-pwa-install-prompt.md
docs/11-legacy-card-parity-audit.md
docs/110-pwa-installed-event-menu-sync.md
docs/111-legacy-install-menu-placement-ios-guide.md
docs/112-legacy-guest-quick-defaults.md
docs/113-quick-toolbar-active-route-a11y.md
docs/114-public-menu-selected-state.md
docs/115-guest-lucky-live-announcement.md
docs/116-guest-search-clear-focus.md
docs/117-legacy-guest-tutorial-safe.md
docs/118-web-guest-spotlight-anchors.md
docs/119-legacy-tutorial-immediate-optout.md
docs/12-private-audio-integrity-audit.md
docs/120-guest-menu-onboarding.md
docs/121-local-quick-toolbar-reset.md
docs/122-legacy-brand-spotlight-bounds.md
docs/123-guest-tutorial-public-card-mutation.md
docs/124-safe-guest-nickname.md
docs/125-safe-public-changelog.md
docs/126-legacy-original-app-icon-wave-motion.md
docs/13-work-ui-acceptance.md
docs/14-revocable-covers.md
docs/15-legacy-staging-preflight.md
docs/16-technical-spec-v1-crosswalk.md
docs/17-safe-lucky-discovery.md
docs/18-public-category-search-suggestions.md
docs/19-dual-source-error-states.md
docs/20-local-unhide-management.md
docs/21-device-speaker-hiding.md
docs/22-local-hide-deep-links.md
docs/23-independent-device-preference-hydration.md
docs/24-hidden-pref-hydration-and-speaker-portraits.md
docs/25-authorized-speaker-profile-identity.md
docs/26-authorized-card-source-deduplication.md
docs/27-device-hide-facets-and-duo-restore.md
docs/28-current-search-lucky-guard.md
docs/29-individual-co-speaker-hiding.md
docs/30-public-track-co-speaker-navigation.md
docs/31-partial-catalog-failure-device-hidden-empty-state.md
docs/32-legacy-ranking-second-level-safe-shell.md
docs/33-guarded-ci-auto-production.md
docs/34-legacy-speaker-profile-tabs-safe.md
docs/35-legacy-font-zoom-cross-screen.md
docs/36-legacy-pinned-quick-actions.md
docs/37-legacy-pwa-web-install.md
docs/38-legacy-notifications-safe-tabs.md
docs/39-legacy-profile-four-tabs-safe.md
docs/40-legacy-public-player-controls.md
docs/41-legacy-approved-detail-notes-category.md
docs/42-legacy-approved-engagement-tabs.md
docs/43-legacy-verified-public-detail-sharing.md
docs/44-legacy-detail-device-collection-hide.md
docs/45-legacy-list-card-authorized-navigation.md
docs/46-approved-public-info-card-png.md
docs/47-legacy-detail-section-jumps.md
docs/48-guest-speaker-rank-links.md
docs/50-legacy-speaker-menu-parity.md
docs/51-legacy-speaker-profile-overlay.md
docs/52-remove-unoriginal-speaker-directory-route.md
docs/53-legacy-speaker-compact-modal-proportions.md
docs/54-legacy-card-responsive-photo-title.md
docs/55-legacy-card-metadata-feedback-parity.md
docs/56-legacy-detail-speaker-portrait.md
docs/57-legacy-detail-engagement-summary.md
docs/58-legacy-public-detail-hero.md
docs/59-legacy-speaker-recording-date.md
docs/60-legacy-speaker-rank-date-caption.md
docs/61-legacy-detail-upload-date.md
docs/62-public-co-speaker-candidate-search.md
docs/63-native-hermes-export-ci.md
docs/64-eas-internal-preview-public-api.md
docs/65-speaker-compact-recording-list.md
docs/66-verified-public-co-speaker-sql-filter.md
docs/67-verified-public-speaker-pagination.md
docs/68-home-verified-catalog-load-more.md
docs/69-saved-public-id-batch-lookup.md
docs/70-public-hot-rankings-pagination.md
docs/71-public-paging-empty-filter.md
docs/72-public-detail-return-navigation.md
docs/73-verified-public-detail-rank-navigation.md
docs/74-verified-public-card-rank-navigation.md
docs/75-authorized-detail-category-route-validation.md
docs/76-all-guest-stream-head-release-gate.md
docs/77-exact-approved-category-search-suggestions.md
docs/78-public-historical-ranking-known-values.md
docs/79-raw-filter-route-control-validation.md
docs/80-approved-public-speaker-rank-filter-facets.md
docs/81-safe-exact-approved-category-menu.md
docs/82-undated-public-track-order-stability.md
docs/83-unicode-consistent-approved-catalog-search.md
docs/84-unknown-public-metrics-last.md
docs/85-guest-share-disabled-accessibility.md
docs/86-guest-unknown-vs-zero-api-metadata.md
docs/87-exact-approved-category-card-links.md
docs/88-live-public-share-revalidation.md
docs/89-exact-approved-category-suggestions.md
docs/90-legacy-nonempty-search-suggestion-panel.md
docs/91-legacy-four-category-suggestion-cap.md
docs/92-incomplete-public-paging-empty-state-honesty.md
docs/93-retired-approved-category-selection-reconciliation.md
docs/94-hot-ranking-no-metric-empty-copy.md
docs/95-category-suggestion-outside-blur-press-safety.md
docs/96-toolbar-handled-tap-dismisses-search-hints.md
docs/97-close-search-hints-on-advanced-lucky-and-reset.md
docs/98-category-dropdown-outside-dismiss.md
docs/99-home-logo-reset-original-legacy-parity.md
docs/adr/0001-dev-i-stack.md
docs/adr/0002-starry-v13-framework.md
docs/adr/0003-central-member-and-cross-brand-identity.md
docs/AI_HANDOFF.md
docs/evidence/echo-menu-after-1793280666308.jpg
docs/evidence/echo-menu-before-1793279805857.jpg
```

### openapi（1）

```text
openapi/echo-public.v1.json
```

### packages（10）

```text
packages/ads-core/package.json
packages/ads-core/src/index.ts
packages/billing-core/package.json
packages/billing-core/src/index.ts
packages/echo-api-sdk/package.json
packages/echo-api-sdk/src/index.ts
packages/ui/package.json
packages/ui/src/index.ts
packages/ui/src/StarryFilterChip.tsx
packages/ui/src/tokens.ts
```

### public（5）

```text
public/icon-192.png
public/icon-512.png
public/icon-monochrome.svg
public/icon.svg
public/manifest.webmanifest
```

### scripts（11）

```text
scripts/audit-private-audio.py
scripts/check-legacy-staging.mjs
scripts/check-openapi.mjs
scripts/check-production-guest.mjs
scripts/check-release-safety.mjs
scripts/check-ui-v13.mjs
scripts/check-v13-manifest.mjs
scripts/diagnose-public-guest.mjs
scripts/legacy-staging-reconciliation.mjs
scripts/production-guest-validation.mjs
scripts/run-isolated-openapi-generator.mjs
```

### src（91）

```text
src/api/client.ts
src/auth/centralMember.ts
src/auth/centralMemberContract.ts
src/media/legacyPermissionAudit.ts
src/media/legacyPlaybackControls.ts
src/media/playback.ts
src/theme.ts
src/types.ts
src/types/static-image-assets.d.ts
src/ui/echo/AdvancedCardFilters.tsx
src/ui/echo/AnimatedNewcomerTag.tsx
src/ui/echo/authorizedSavedPublicBatches.ts
src/ui/echo/authorizedSpeakerProfile.ts
src/ui/echo/cardFilters.ts
src/ui/echo/cardMenuLayout.ts
src/ui/echo/cardSorting.ts
src/ui/echo/catalogDisplayState.ts
src/ui/echo/categoryDropdownPlacement.ts
src/ui/echo/categorySuggestionBlurGuard.ts
src/ui/echo/categorySuggestions.ts
src/ui/echo/currentCatalogDisplayState.ts
src/ui/echo/detailPreferenceEligibility.ts
src/ui/echo/detailSectionScroll.ts
src/ui/echo/deviceFavorites.ts
src/ui/echo/DevicePreferences.tsx
src/ui/echo/devicePreferenceStore.ts
src/ui/echo/dislikedTracks.ts
src/ui/echo/FontZoom.tsx
src/ui/echo/fontZoomPreferenceStore.ts
src/ui/echo/guestLuckyResultAnnouncement.ts
src/ui/echo/guestNickname.ts
src/ui/echo/headerMenuPlacement.ts
src/ui/echo/hiddenSpeakers.ts
src/ui/echo/historicallyRankableTracks.ts
src/ui/echo/HomeResetSignal.tsx
src/ui/echo/InstallAppButton.tsx
src/ui/echo/installGuide.ts
src/ui/echo/legacyAudioCardSizing.ts
src/ui/echo/LegacyBackToTop.tsx
src/ui/echo/LegacyBrandWave.tsx
src/ui/echo/legacyBrandWaveMotion.ts
src/ui/echo/legacyDetailDate.ts
src/ui/echo/LegacyDetailDeviceActions.tsx
src/ui/echo/LegacyDetailEngagementSummary.tsx
src/ui/echo/legacyDetailHeroSizing.ts
src/ui/echo/LegacyDetailSectionNavigation.tsx
src/ui/echo/LegacyDetailSpeakerPortrait.tsx
src/ui/echo/LegacyEngagementDetail.tsx
src/ui/echo/legacyEngagementSnapshot.ts
src/ui/echo/LegacyFilterToolbar.tsx
src/ui/echo/LegacyGuestTutorial.tsx
src/ui/echo/legacyGuestTutorialPolicy.ts
src/ui/echo/LegacyHeader.tsx
src/ui/echo/LegacyLectureNotes.tsx
src/ui/echo/legacyNotifications.ts
src/ui/echo/LegacyPlaybackTimeline.tsx
src/ui/echo/legacyProfileTabs.ts
src/ui/echo/LegacyPublicReleaseHistory.tsx
src/ui/echo/legacyRankingTabs.ts
src/ui/echo/legacySortFields.ts
src/ui/echo/LegacySpeakerRecordingRow.tsx
src/ui/echo/legacyTheme.tsx
src/ui/echo/LegacyTrackCard.tsx
src/ui/echo/legacyTutorialPreferencePersistence.ts
src/ui/echo/legacyTutorialSpotlightGeometry.ts
src/ui/echo/LegacyVerifiedTrackShare.tsx
src/ui/echo/localCardVisibility.ts
src/ui/echo/mainMenuSelection.ts
src/ui/echo/mergeAuthorizedCards.ts
src/ui/echo/migrationPresentation.ts
src/ui/echo/publicCategoryNavigation.ts
src/ui/echo/publicInfoCardExport.ts
src/ui/echo/publicLoadMoreEligibility.ts
src/ui/echo/publicReleaseHistory.ts
src/ui/echo/publicSpeakerRankNavigation.ts
src/ui/echo/publicTrackSharing.ts
src/ui/echo/QuickActions.tsx
src/ui/echo/quickActionStore.ts
src/ui/echo/QuickDragHandle.tsx
src/ui/echo/safeApprovedCategoryOptions.ts
src/ui/echo/safeLuckyDraw.ts
src/ui/echo/speakerNames.ts
src/ui/echo/speakerProfileSections.ts
src/ui/echo/speakerRecordingDate.ts
src/ui/echo/themePreferenceStore.ts
src/ui/echo/useEarlyInstallPrompt.ts
src/ui/echo/visibleAuthorizedRankFacets.ts
src/ui/echo/visibleGuestFacets.ts
src/ui/echo/visibleSpeakerDirectory.ts
src/ui/responsive.ts
src/ui/useViewportDimensions.ts
```

### tests（101）

```text
tests/authorized-speaker-profile.test.mjs
tests/card-filters.test.mjs
tests/card-menu-async-lifecycle.test.mjs
tests/card-menu-layout.test.mjs
tests/catalog-display-state.test.mjs
tests/catalog-search-sql.test.mjs
tests/category-dropdown-outside-dismiss.test.mjs
tests/category-suggestion-blur-guard.test.mjs
tests/category-suggestions.test.mjs
tests/central-member-contract.test.mjs
tests/clear-deep-link-filter-url.test.mjs
tests/current-catalog-display-state.test.mjs
tests/device-favorites.test.mjs
tests/device-preference-store.test.mjs
tests/disliked-tracks.test.mjs
tests/exact-approved-category-links.test.mjs
tests/generated-sdk.test.mjs
tests/guest-lucky-result-a11y.test.mjs
tests/guest-missing-historical-metrics.test.mjs
tests/guest-nickname-visual-parity.test.mjs
tests/guest-share-disabled-accessibility.test.mjs
tests/header-menu-outside-dismiss.test.mjs
tests/header-search-suggestion-dismiss.test.mjs
tests/hidden-speakers.test.mjs
tests/home-verified-public-pagination.test.mjs
tests/individual-co-speaker-hide-menu.test.mjs
tests/internal-eas-public-api-profile.test.mjs
tests/latest-legacy-toolbar-parity.test.mjs
tests/legacy-approved-detail-category.test.mjs
tests/legacy-approved-detail-section-jumps.test.mjs
tests/legacy-approved-engagement-tabs.test.mjs
tests/legacy-approved-public-png-export.test.mjs
tests/legacy-approved-speaker-rank-links.test.mjs
tests/legacy-back-to-top-parity.test.mjs
tests/legacy-card-visual-breakpoint.test.mjs
tests/legacy-detail-back-navigation.test.mjs
tests/legacy-detail-device-preferences.test.mjs
tests/legacy-detail-engagement-summary.test.mjs
tests/legacy-detail-portrait-parity.test.mjs
tests/legacy-detail-upload-date.test.mjs
tests/legacy-font-zoom.test.mjs
tests/legacy-guest-tutorial-third-anchor.test.mjs
tests/legacy-guest-tutorial.test.mjs
tests/legacy-home-logo-reset.test.mjs
tests/legacy-list-card-authorized-navigation.test.mjs
tests/legacy-main-menu-selected.test.mjs
tests/legacy-notifications-tabs.test.mjs
tests/legacy-original-brand-icon-wave.test.mjs
tests/legacy-permission-audit.test.mjs
tests/legacy-pinned-quick-actions.test.mjs
tests/legacy-profile-four-tabs.test.mjs
tests/legacy-public-player-controls.test.mjs
tests/legacy-public-release-history.test.mjs
tests/legacy-pwa-install.test.mjs
tests/legacy-ranking-five-tab.test.mjs
tests/legacy-speaker-compact-rows.test.mjs
tests/legacy-speaker-menu-parity.test.mjs
tests/legacy-speaker-profile-overlay.test.mjs
tests/legacy-speaker-profile-tabs.test.mjs
tests/legacy-speaker-recording-date.test.mjs
tests/legacy-staging.test.mjs
tests/legacy-tutorial-brand-bounds.test.mjs
tests/legacy-tutorial-preference-persistence.test.mjs
tests/legacy-tutorial-public-card-replacement.test.mjs
tests/legacy-tutorial-spotlight-geometry.test.mjs
tests/legacy-verified-detail-sharing.test.mjs
tests/live-public-sharing-permission.test.mjs
tests/local-card-visibility.test.mjs
tests/local-quick-toolbar-reset.test.mjs
tests/menu-home-public-refetch-parity.test.mjs
tests/menu-theme-dismiss-parity.test.mjs
tests/merge-authorized-cards.test.mjs
tests/migration-presentation.test.mjs
tests/monetization.test.mjs
tests/native-hermes-export-ci.test.mjs
tests/playback.test.mjs
tests/private_audio_audit_test.py
tests/private-audio-audit.test.mjs
tests/production-guest-validation.test.mjs
tests/public-co-speaker-candidate-search.test.mjs
tests/public-filter-route-raw-control.test.mjs
tests/public-hot-rankings-known-metrics.test.mjs
tests/public-hot-rankings-load-more.test.mjs
tests/public-paging-empty-first-page.test.mjs
tests/public-track-individual-speaker-links.test.mjs
tests/release-safety.test.mjs
tests/responsive.test.mjs
tests/safe-approved-category-menu.test.mjs
tests/safe-lucky-draw.test.mjs
tests/saved-public-id-batch-lookup.test.mjs
tests/sdk.test.mjs
tests/speaker-sorting-parity.test.mjs
tests/theme-preference-store.test.mjs
tests/undated-public-track-sort-stability.test.mjs
tests/unknown-public-historical-sort.test.mjs
tests/verified-public-card-rank-links.test.mjs
tests/verified-public-speaker-pagination.test.mjs
tests/visible-authorized-rank-facets.test.mjs
tests/visible-guest-facets.test.mjs
tests/visible-speaker-directory.test.mjs
tests/worker.test.mjs
```

### tools（1）

```text
tools/openapi-codegen/package.json
```

### worker（1）

```text
worker/index.ts
```

## E. 路徑完整性驗證

- Git tree 舊版 `82cbf4f112af57fcfed12ff2f6cf86010c03560e`，列舊檔數 `607`；Git tree 新版 `fbb9596380cbaa5b37ff9850a6ffbe01fe2497fd`，列新檔數 `381`。兩邊 API 結果均 `truncated=false`。
- 路徑對照 52 組均逐項在 pin 定樹中驗證存在。舊版／新版**沒有宣稱能逐行一比一**。
- **接手前更新狀態**：在兩 Repo 重新執行 `git ls-tree -r --name-only main` 和 `git rev-parse main` 或 GitHub Trees API，因日後新 PR 會令此清單成為歷史快照。
- **安全界線**：不要將任何 R2 音訊或會員 D1 私人資料做為本索引的一部分；此索引只有受版本控制的路徑文字，沒有私有雲端物件清單、token 或機密值。
