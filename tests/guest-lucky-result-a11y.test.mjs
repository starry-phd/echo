import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guestLuckyResultAnnouncement} from '../src/ui/echo/guestLuckyResultAnnouncement.ts';
const page=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
const guest={id:'approved',playable:false,legacySnapshot:true,description:null,
 coverUrl:'/api/v1/previews/approved/cover?policy=2',title:'一場故事',speaker:'王老師'};
test('original polite lucky-winner announcement speaks only still-authorized guest card metadata',()=>{
 const message=guestLuckyResultAnnouncement('win','ready',guest);
 assert.equal(message,'好手氣！抽中訪客資訊卡：一場故事，講者：王老師。這張卡片僅供瀏覽，錄音播放未開放。');
 for(const phase of ['idle','spin'])assert.equal(guestLuckyResultAnnouncement(phase,'ready',guest),null);
 for(const display of ['loading','failed','empty'])assert.equal(guestLuckyResultAnnouncement('win',display,guest),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',null),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',{...guest,playable:true}),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',{...guest,legacySnapshot:false}),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',{...guest,description:'private'}),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',{...guest,coverUrl:'/api/v1/tracks/approved/stream'}),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',{...guest,title:'  '}),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',{...guest,speaker:'  '}),null);
 assert.equal(guestLuckyResultAnnouncement('win','ready',{...guest,title:'x'.repeat(201)}),null);
});
test('live status is wired to approved rendered winner only, not spinner or private media source',()=>{
 assert.match(page,/const luckyPreview=useMemo\(\(\)=>[\s\S]*?visibleTracks\.find\(t=>t\.id===luckyPreviewId&&isApprovedPreview\(t\)\)/);
 assert.match(page,/guestLuckyResultAnnouncement\(luckyPhase,currentDisplay,luckyPreview\)/);
 assert.match(page,/if\(announcement\)AccessibilityInfo\.announceForAccessibility\(announcement\)/);
 assert.match(page,/luckyPreview\?\.id,luckyPreview\?\.title,luckyPreview\?\.speaker/);
 assert.match(page,/luckyPhase==='win'&&currentDisplay==='ready'&&<View accessibilityRole="summary" accessibilityLiveRegion="polite"/);
 const helper=readFileSync(new URL('../src/ui/echo/guestLuckyResultAnnouncement.ts',import.meta.url),'utf8');
 assert.doesNotMatch(helper,/fetch\(|AsyncStorage|R2\.get|\/stream|SELECT|localStorage/);
});
