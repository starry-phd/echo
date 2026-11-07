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

/**
 * Member-login version, shown automatically ONLY when the build enables Starry ID
 * (EXPO_PUBLIC_STARRY_ID_API_BASE_URL is an allow-listed origin). Written from the
 * behaviour of src/auth/starryId/* and starry-phd/id integration guide §2–4, §11.
 * Set PRIVACY_POLICY_MEMBER_UPDATED to the actual launch date when login opens.
 */
export const PRIVACY_POLICY_MEMBER_UPDATED='2026-11-07';
export const STARRY_ID_PRIVACY_URL='https://id.starry.phd/privacy';
export const STARRY_ID_TERMS_URL='https://id.starry.phd/terms';
export const STARRY_ID_DELETE_URL='https://id.starry.phd/account/delete';

export const PRIVACY_POLICY_MEMBER_SECTIONS:PolicySection[]=[
 {heading:'一、概述',paragraphs:[
  `本政策說明「${PRIVACY_APP_NAME}」（以下稱本 App，包含 iOS、Android 與網頁版）如何處理你的資料。本 App 由繁星回聲營運者（以下稱「我們」）提供。`,
  '你可以不登入，以訪客身分瀏覽公開的講座資訊；也可以選擇登入「繁星會員」使用會員功能。以訪客身分使用時，我們不收集可直接識別你身分的個人資料。'
 ]},
 {heading:'二、繁星會員登入（Starry ID）',paragraphs:[
  '繁星會員帳號由繁星中央會員系統 Starry ID（https://id.starry.phd）統一管理，同一個帳號可用於繁星生態系的各款 App。你使用 Google 或 Apple 帳號登入時，Google 或 Apple 會把用來驗證身分的登入憑證交給 Starry ID 驗證；Starry ID 如何收集、使用與保存會員資料，請見其隱私權政策 '+STARRY_ID_PRIVACY_URL+' 與服務條款 '+STARRY_ID_TERMS_URL+'。',
  '本 App 只向 Starry ID 讀取並顯示：會員編號（不含個人資訊的識別碼）、顯示名稱、頭像、帳號狀態與條款同意狀態。本 App 不讀取、不保存你的 Email、電話、生日或地點等其他會員欄位（這些由你在繁星帳號中心自行管理），也不複製完整會員主檔。超級管理員修改本 App 的電池任務價格時，Echo 只在自己的資料庫記錄任務代碼、價格、時間及 Starry user_id 作為變更稽核，不寫入 Starry ID 資料庫。',
  '網頁版登入時會整頁前往 Starry ID 的登入頁，再回到本 App；本 App 的網頁不載入 Google 或 Apple 的程式。登入過程中，一次性的驗證資訊會暫存在瀏覽器的 sessionStorage，完成後立即刪除。',
  'Passkey 是額外的繁星會員登入方式，使用中央 Starry ID（id.starry.phd）驗證。本 App 不會取得或保存你的 Passkey 私鑰、指紋或臉部資料；系統會使用裝置或雲端密碼管理工具保存憑證，並以公開金鑰方式向 Starry ID 驗證。會員可在本 App 或 Starry ID 帳號中心新增及移除 Passkey。',
  '登入憑證的保存：網頁版的短效存取憑證只存在記憶體，續期憑證存在瀏覽器的 sessionStorage，關閉分頁即清除；手機 App 推出會員登入後，憑證會存在系統提供的安全儲存區（iOS 鑰匙圈、Android Keystore）。登出時會一併清除。'
 ]},
 {heading:'三、只存在你裝置上的資料',paragraphs:[
  '為了記住你的使用習慣，本 App 會在你的手機或瀏覽器本機儲存以下資料：',
  ...LOCAL_DEVICE_DATA.map(item=>'・'+item),
  '這些資料只存在你的裝置上，不會同步到會員帳號，我們也無法讀取。刪除本 App、清除 App 資料或清除瀏覽器網站資料，即可全部移除。'
 ]},
 {heading:'四、連線時自動產生的技術資料',paragraphs:[
  '本 App 會向我們的伺服器（架設於 Cloudflare）讀取公開的講座資訊、講師資訊與封面圖片；登入時也會連線到 Starry ID 以及 Google 或 Apple 的登入服務。',
  '如同所有網路服務，這些服務在傳送資料與防範攻擊時，會短暫處理你的 IP 位址、裝置與瀏覽器類型、請求時間等技術資訊，並依各自的隱私權政策處理。我們的講座伺服器程式不會另外記錄、儲存或分析這些資料。Cloudflare 的處理方式請參考：https://www.cloudflare.com/privacypolicy/'
 ]},
 {heading:'五、我們不做的事',paragraphs:[
  '・不放廣告，不使用廣告識別碼（IDFA／廣告 ID）。',
  '・不使用分析或追蹤工具，不做跨 App 或跨網站追蹤。',
  '・不出售、出租或交換任何資料給第三方，也不把會員資料提供給廣告商。',
  '・不收集位置、麥克風、相機、通訊錄或相片。'
 ]},
 {heading:'六、分享功能',paragraphs:[
  '當你使用「分享」時，本 App 會開啟你裝置內建的分享選單；分享的內容與對象由你決定，我們不會得知分享給誰。'
 ]},
 {heading:'七、刪除帳號',paragraphs:[
  '你可以在本 App 的會員頁，或到 '+STARRY_ID_DELETE_URL+' 申請刪除繁星會員帳號。確認後 Starry ID 會立即永久刪除會員帳號與資料，沒有撤回期、無法復原；所有裝置都會登出，所有繁星 App 都無法再使用該帳號。刪除帳號不會自動取消你在 App Store 或 Google Play 的訂閱，請另外到商店取消。'
 ]},
 {heading:'八、兒童隱私',paragraphs:[
  '本 App 並非專為 13 歲以下兒童設計，我們也不會在知情的情況下收集兒童的個人資料。'
 ]},
 {heading:'九、你的權利',paragraphs:[
  '依中華民國《個人資料保護法》及你所在地區的相關法規，你可以隨時在繁星帳號中心查詢或修改會員資料，或聯絡我們查詢、請求刪除或提出其他與隱私相關的要求。'
 ]},
 {heading:'十、政策更新',paragraphs:[
  `本政策若有修改，會公布於本頁並更新下方日期；如涉及會員資料的重大變更，會請你重新同意。最後更新：${PRIVACY_POLICY_MEMBER_UPDATED}。`
 ]},
 {heading:'十一、聯絡我們',paragraphs:[
  `如有任何隱私問題，請來信：${PRIVACY_CONTACT_EMAIL}`
 ]},
 {heading:'English summary',paragraphs:[
  `${PRIVACY_APP_NAME} can be used as a guest without any personal information, or with an optional Starry member account. Member accounts are managed by Starry ID (https://id.starry.phd); signing in with Google or Apple sends an identity token to Starry ID for verification, under Starry ID's privacy policy (${STARRY_ID_PRIVACY_URL}). This app only reads your member ID, display name, avatar, account status and consent status, and does not copy the full central member profile. Owner changes to Echo's Battery task prices are audited with Starry user_id and task settings in Echo's own database. Web sign-in keeps the short-lived token in memory and the refresh token in sessionStorage; the mobile apps will use the system secure storage. Device preferences, a random guest nickname and on-device favourites/hidden lists stay on your device. Delete your account in the app or at ${STARRY_ID_DELETE_URL} (deletion is immediate and irreversible; store subscriptions are not cancelled automatically). Passkeys are managed and verified through Starry ID; this app never reads biometric data or private keys. No ads, analytics, tracking or data sales. Not directed to children under 13. Contact: ${PRIVACY_CONTACT_EMAIL}. Last updated ${PRIVACY_POLICY_MEMBER_UPDATED}.`
 ]}
];

/** The page shows the member version only when this build enables Starry ID sign-in. */
export function privacyPolicyFor(memberLoginEnabled:boolean):{updated:string;sections:PolicySection[]}{
 return memberLoginEnabled
  ?{updated:PRIVACY_POLICY_MEMBER_UPDATED,sections:PRIVACY_POLICY_MEMBER_SECTIONS}
  :{updated:PRIVACY_POLICY_UPDATED,sections:PRIVACY_POLICY_SECTIONS};
}
