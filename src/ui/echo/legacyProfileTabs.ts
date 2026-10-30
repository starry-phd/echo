/** Original ProfileModal.tsx has four private, member-scoped tabs.
 * Navigation labels may be restored without implying a verified member. */
export const legacyProfileTabs=[
 {id:'profile',label:'自我介紹'},
 {id:'ratings',label:'評價'},
 {id:'comments',label:'心得'},
 {id:'listening',label:'學習進度'}
] as const;
export type LegacyProfileTab=(typeof legacyProfileTabs)[number]['id'];
export const profileGateCopy:Record<LegacyProfileTab,string>={
 profile:'姓名、頭像、獎銜、自我介紹與個人設定必須經 Starry ID 驗證後，才可由正式會員 API 取得與修改。這裡沒有載入任何人的舊版會員檔案。',
 ratings:'個人星級評價需經本人登入與 Echo 正式評價 API 才能查詢或修改；目前不能判定是否曾經評價，不會以公開音檔的歷史平均評分當成您的評價。',
 comments:'個人心得、回覆與提及紀錄需驗證本人身份及內容可見性後才可讀取。目前沒有已授權的會員心得服務，不會顯示舊版個人留言。',
 listening:'已聽清單、續聽位置及學習進度需經可信會員身份與合法音訊播放紀錄才能呈現。目前無此正式服務，裝置收藏不代表聽過或可播放。'
};
