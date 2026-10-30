import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {notificationTabs,notificationGateCopy,visibleNotificationTabs} from '../src/ui/echo/legacyNotifications.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original notification tabs retain exact label and order',()=>{
 assert.deepEqual(notificationTabs.map(t=>t.label),['我的訊息','未審核','新會員']);
 assert.deepEqual(notificationTabs.map(t=>t.id),['messages','pending','new-members']);
});
test('reviewer tab is never rendered to guests; only verified scope could allow it',()=>{
 assert.deepEqual(visibleNotificationTabs(false).map(x=>x.id),['messages','new-members']);
 assert.deepEqual(visibleNotificationTabs(true).map(x=>x.id),['messages','pending','new-members']);
 assert.equal(notificationTabs.find(x=>x.id==='pending').requiresReviewer,true);
});
test('each page explicitly distinguishes unavailable API from genuinely empty inbox',()=>{
 for(const copy of Object.values(notificationGateCopy))assert.ok(copy.length>=45);
 assert.match(notificationGateCopy.messages,/無法判定/);
 assert.match(notificationGateCopy.pending,/審核職務/);
 assert.match(notificationGateCopy['new-members'],/不顯示舊資料/);
 const screen=read('app/notifications.tsx');
 assert.match(screen,/hasVerifiedReviewerScope=false/);
 assert.match(screen,/visibleNotificationTabs\(hasVerifiedReviewerScope\)/);
 assert.match(screen,/accessibilityRole="tablist"/);
 assert.match(screen,/accessibilityRole="tab"/);
 assert.match(screen,/setTab\(item.id\)/);
 assert.match(screen,/notificationGateCopy\[tab\]/);
 assert.match(screen,/不是「目前沒有通知」/);
 assert.match(screen,/router.push\('\/profile'\)/);
 assert.doesNotMatch(screen,/getItem\(|fetch\(|R2\.get|D1|SELECT|approveMember|setReviewed|notifications\.map\(/);
});
test('notification screen is reachable from the real main menu and root stack',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx'),layout=read('app/_layout.tsx');
 assert.match(layout,/<Stack.Screen name="notifications" \/>/);
 assert.match(header,/\['通知中心',\(\)=>go\('\/notifications'\)\]/);
 assert.match(header, /\['我的貼紙','音檔管理'\]/);
 assert.doesNotMatch(header,/\['通知','我的貼紙','音檔管理'\]/);
});
