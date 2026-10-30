/** Source: original NotificationsView.tsx. Only titles and safe navigation are
 * portable before the central identity + Echo notification contract is live.
 * Never infer an empty inbox, reviewer permission, or new-member data. */
export const notificationTabs=[
 {id:'messages',label:'我的訊息',requiresReviewer:false},
 {id:'pending',label:'未審核',requiresReviewer:true},
 {id:'new-members',label:'新會員',requiresReviewer:false}
] as const;
export type NotificationTab=(typeof notificationTabs)[number]['id'];
export const notificationGateCopy:Record<NotificationTab,string>={
 messages:'@提及、心得通知與快速回覆必須由本人登入後，透過正式通知 API 讀取。尚未接通，因此無法判定目前有沒有新訊息。',
 pending:'會員審核僅限具備已驗證審核職務及正確教育中心範圍的人員，需由中央會員 API 驗證；訪客不可查詢、批准或查看任何待審核會員。',
 'new-members':'新會員名單與個人資料必須先驗證登入、可見權限與公開設定。尚未接通中央 API，不顯示舊資料或虛構新人清單。'
};
export function visibleNotificationTabs(hasVerifiedReviewerScope:boolean){
 return notificationTabs.filter(x=>!x.requiresReviewer||hasVerifiedReviewerScope);
}
