/**
 * 繁星回聲 privacy policy. Written from the app's ACTUAL data behaviour on
 * 2026-11-02 (no account, no ads, no analytics, no third-party SDK, local-only
 * device preferences, read-only public API). Any change to that behaviour
 * (Starry ID login, purchases, ads, playback analytics) must update this text,
 * PRIVACY_POLICY_UPDATED and tests/privacy-policy.test.mjs BEFORE release.
 */
export const PRIVACY_POLICY_PATH='/privacy';
export const PRIVACY_POLICY_UPDATED='2026-11-02';
export const PRIVACY_CONTACT_EMAIL='starry.phd@gmail.com';
export const PRIVACY_APP_NAME='繁星回聲 Echo Starry';

export type PolicySection={heading:string;paragraphs:string[]};

/** Every on-device storage key the app writes; tests keep this list in sync with the code. */
export const LOCAL_DEVICE_DATA=[
 '深色／淺色模式、字體大小、置頂快捷功能等顯示偏好',
 '系統隨機產生的訪客暱稱（不含真實姓名，不會上傳）',
 '你在本裝置收藏、不感興趣或隱藏的講座與講師清單',
 '新手教學是否已看過、是否不再提醒'
] as const;

export const PRIVACY_POLICY_SECTIONS:PolicySection[]=[
 {heading:'一、概述',paragraphs:[
  `本政策說明「${PRIVACY_APP_NAME}」（以下稱本 App，包含 iOS、Android 與網頁版）如何處理你的資料。本 App 由繁星回聲營運者（以下稱「我們」）提供。`,
  '目前版本不需要註冊或登入，不收集你的姓名、電子郵件、電話、位置、通訊錄、相片或任何可直接識別你身分的個人資料。'
 ]},
 {heading:'二、只存在你裝置上的資料',paragraphs:[
  '為了記住你的使用習慣，本 App 會在你的手機或瀏覽器本機儲存以下資料：',
  ...LOCAL_DEVICE_DATA.map(item=>'・'+item),
  '這些資料只存在你的裝置上，我們無法讀取，也不會上傳到我們的伺服器。刪除本 App、清除 App 資料或清除瀏覽器網站資料，即可全部移除。'
 ]},
 {heading:'三、連線時自動產生的技術資料',paragraphs:[
  '本 App 會向我們的伺服器（架設於 Cloudflare）讀取公開的講座資訊、講師資訊與封面圖片。為了載入你收藏的講座卡片，請求中可能包含講座編號，但不會附帶任何可識別你的資料。',
  '如同所有網路服務，Cloudflare 在傳送資料與防範攻擊時，會短暫處理你的 IP 位址、裝置與瀏覽器類型、請求時間等技術資訊。我們的伺服器程式不會另外記錄、儲存或分析這些資料，也不會用來辨識你。Cloudflare 的處理方式請參考其隱私權政策：https://www.cloudflare.com/privacypolicy/'
 ]},
 {heading:'四、我們不做的事',paragraphs:[
  '・不放廣告，不使用廣告識別碼（IDFA／廣告 ID）。',
  '・不使用分析或追蹤工具，不做跨 App 或跨網站追蹤。',
  '・不出售、出租或交換任何資料給第三方。',
  '・不收集位置、麥克風、相機、通訊錄或相片。'
 ]},
 {heading:'五、分享功能',paragraphs:[
  '當你使用「分享」時，本 App 會開啟你裝置內建的分享選單；分享的內容與對象由你決定，我們不會得知分享給誰。'
 ]},
 {heading:'六、兒童隱私',paragraphs:[
  '本 App 並非專為 13 歲以下兒童設計，我們也不會在知情的情況下收集兒童的個人資料。'
 ]},
 {heading:'七、未來功能',paragraphs:[
  '若日後推出會員登入（繁星通行證 Starry ID）、付費內容或其他會處理個人資料的功能，我們會在功能上線前更新本政策，清楚說明收集的資料、用途與你的權利，並依法取得必要的同意。'
 ]},
 {heading:'八、你的權利',paragraphs:[
  '依中華民國《個人資料保護法》及你所在地區的相關法規，你可以隨時聯絡我們查詢、請求刪除或提出其他與隱私相關的要求。因為目前本 App 不在伺服器保存你的個人資料，你也可以直接在裝置上刪除前述本機資料。'
 ]},
 {heading:'九、政策更新',paragraphs:[
  `本政策若有修改，會公布於本頁並更新下方日期。最後更新：${PRIVACY_POLICY_UPDATED}。`
 ]},
 {heading:'十、聯絡我們',paragraphs:[
  `如有任何隱私問題，請來信：${PRIVACY_CONTACT_EMAIL}`
 ]},
 {heading:'English summary',paragraphs:[
  `${PRIVACY_APP_NAME} requires no account and collects no personal information. Display preferences, a randomly generated guest nickname, and your on-device favourites/hidden lists are stored only on your device and never uploaded. The app reads public lecture information from our Cloudflare-hosted server; Cloudflare briefly processes technical data such as IP address to deliver and protect the service, and our server does not log or store it. No ads, no analytics, no tracking, no data sales. Not directed to children under 13. We will update this policy before launching any sign-in, purchase or other feature that processes personal data. Contact: ${PRIVACY_CONTACT_EMAIL}. Last updated ${PRIVACY_POLICY_UPDATED}.`
 ]}
];
