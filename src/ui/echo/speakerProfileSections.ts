/**
 * Legacy second-level speaker profile sections:
 * yukidu/Echo-Starry/src/components/SpeakerProfilePage.tsx.
 *
 * The original Q&A API is member-scoped and uses speaker/track transcripts.
 * The new public-only Echo shell MUST NOT fetch it or fabricate replies.
 */
export const speakerProfileSections=[
 {id:'audio',label:'所有錄音'},
 {id:'qa',label:'歷史問答'}
] as const;
export type SpeakerProfileSection=(typeof speakerProfileSections)[number]['id'];

export const speakerBioUnavailableText=
 '綜合人物摘要尚未接入經授權的公開逐字稿及講師審核資料，因此不會從私人錄音自行生成摘要。';

export const speakerQaUnavailableText=
 '歷史問答須由正式 API 逐筆驗證問答的公開範圍、提問者隱私及講師／音檔授權。目前沒有可供訪客讀取的已核准問答來源，因此不顯示舊版私人問答。';
