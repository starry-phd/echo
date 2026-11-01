import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GUEST_TUTORIAL_KEY,LEGACY_TUTORIAL_KEYS,
 isLegacyTutorialOptedOut,shouldShowGuestTutorial}
 from '../src/ui/echo/legacyGuestTutorialPolicy.ts';

const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
const guide=readFileSync(new URL('../src/ui/echo/LegacyGuestTutorial.tsx',import.meta.url),'utf8');

const eligible={
 catalogReady:true,preferencesReady:true,visibleCount:28,
 storedOptOut:false,legacyOptOut:false,dismissedInRun:false,
};

test('a guest tutorial is gated on a loaded authorized visible catalog',()=>{
 assert.equal(shouldShowGuestTutorial(eligible),true);
 for(const change of [
  {catalogReady:false},{preferencesReady:false},{visibleCount:0},
  {storedOptOut:true},{legacyOptOut:true},{dismissedInRun:true},
 ]){
  assert.equal(shouldShowGuestTutorial({...eligible,...change}),false,
   'guide must not show for '+JSON.stringify(change));
 }
});

test('all three original Echo tutorial opt-out keys are honored',()=>{
 assert.equal(GUEST_TUTORIAL_KEY,'echostars_guest_safe_tutorial_never_remind_v1');
 assert.deepEqual(LEGACY_TUTORIAL_KEYS,[
  'echostars_home_tutorial_group_never_remind_v2',
  'echostars_home_tutorial_never_remind_v1',
  'echostars_photo_play_tutorial_never_remind_v1',
 ]);
 assert.equal(isLegacyTutorialOptedOut(()=>null),false);
 for(const opted of LEGACY_TUTORIAL_KEYS){
  assert.equal(isLegacyTutorialOptedOut(key=>key===opted?'1':null),true,opted);
 }
 assert.equal(isLegacyTutorialOptedOut(()=>'0'),false);
});

test('home only mounts onboarding over ready public information, not loading or private results',()=>{
 assert.match(home,/LegacyGuestTutorial active=\{ready&&currentDisplay==='ready'&&visibleTracks\.length>0\}/);
 assert.match(guide,/Modal visible=\{visible&&\(Platform\.OS!=='web'\|\|geometryLoaded\)\}/);
 assert.match(guide,/accessibilityRole="checkbox"/);
 assert.match(guide,/打勾不再顯示新手教學/);
 assert.match(guide,/AsyncStorage\.setItem\(GUEST_TUTORIAL_KEY,'1'\)/);
 assert.match(guide,/isLegacyTutorialOptedOut/);
});

test('visitor tutorial describes existing device-only actions and does not promise private media',()=>{
 assert.match(guide,/照片不代表錄音有播放授權/);
 assert.match(guide,/目前不會同步到會員帳號/);
 assert.match(guide,/私人錄音、正式會員登入及付費功能尚未開放/);
 assert.doesNotMatch(guide,/getPublicStreamUrl|\.get\(|R2\.get|D1\.prepare/);
});
