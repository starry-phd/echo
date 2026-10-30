import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyProfileTabs,profileGateCopy} from '../src/ui/echo/legacyProfileTabs.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('ProfileModal original four tabs are restored in the right order',()=>{
 assert.deepEqual(legacyProfileTabs.map(t=>t.id),['profile','ratings','comments','listening']);
 assert.deepEqual(legacyProfileTabs.map(t=>t.label),['自我介紹','評價','心得','學習進度']);
 assert.equal(Object.keys(profileGateCopy).length,4);
});
test('member-scoped tabs do not pretend to show empty or public-derived personal histories',()=>{
 for(const copy of Object.values(profileGateCopy))assert.ok(copy.length>=35);
 assert.match(profileGateCopy.ratings,/本人登入/);
 assert.match(profileGateCopy.ratings,/公開音檔的歷史平均評分/);
 assert.match(profileGateCopy.comments,/不會顯示舊版個人留言/);
 assert.match(profileGateCopy.listening,/裝置收藏不代表聽過/);
 assert.match(profileGateCopy.profile,/Starry ID/);
});
test('four real selectable tabs, safe local favorites link, and status remain in profile screen',()=>{
 const screen=read('app/profile.tsx');
 assert.match(screen,/useState<LegacyProfileTab>\('profile'\)/);
 assert.match(screen,/legacyProfileTabs\.map\(item=><Pressable/);
 assert.match(screen,/accessibilityRole="tablist"/);
 assert.match(screen,/accessibilityRole="tab"/);
 assert.match(screen,/accessibilityState=\{\{selected:tab===item\.id\}\}/);
 assert.match(screen,/onPress=\{\(\)=>setTab\(item\.id\)\}/);
 assert.match(screen,/profileGateCopy\[tab\]/);
 assert.match(screen,/centralMemberApiState\(\)/);
 assert.match(screen,/state==='not-configured'/);
 assert.match(screen,/tab==='listening'/);
 assert.match(screen,/router\.push\('\/favorites'\)/);
 assert.match(screen,/不代表已聆聽/);
 assert.match(screen,/不能以「目前沒有紀錄」取代真實查詢結果/);
 const layout=read('app/_layout.tsx');
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(layout,/<Stack.Screen name="profile" \/>/);
 assert.match(header,/go\('\/profile'\)/);
});
test('profile does not load private identity, recordings, comments or member records',()=>{
 const screen=read('app/profile.tsx');
 assert.doesNotMatch(screen,/getPublicTracks|getGuestPreviewTracks|R2\.get|SELECT|fetch\(|AsyncStorage|legacyUsers|userRatedTracks|listeningRecords|comments\.map\(/);
 assert.doesNotMatch(screen,/approvedMember|isAdmin=true|hasVerifiedSession=true/);
});
