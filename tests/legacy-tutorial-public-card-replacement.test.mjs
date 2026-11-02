import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const home=read('app/index.tsx');
const tour=read('src/ui/echo/LegacyGuestTutorial.tsx');
const card=read('src/ui/echo/LegacyTrackCard.tsx');

test('the observed grid contains only current approved visible cards',()=>{
 assert.match(home,/<View nativeID="echo-tutorial-public-card-grid" style=\{styles\.cardGrid\}>/);
 assert.match(home,/\{displayedTracks\.map\(\(track,index\)=>/);
 assert.match(home,/<LegacyTrackCard track=\{track\} tutorialTarget=\{index===0\}/);
 assert.match(card,/nativeID=\{tutorialTarget\?'echo-tutorial-first-public-photo':undefined\}/);
 assert.doesNotMatch(home,/nativeID="echo-tutorial-public-card-grid"[\s\S]{0,150}onPress=\{(?:play|buy|unlock)/);
});

test('DOM changes remeasure only public card list after the third tutorial step',()=>{
 assert.match(tour,/if\(step===2&&typeof MutationObserver!=='undefined'\)\{/);
 assert.match(tour,/document\.getElementById\('echo-tutorial-public-card-grid'\)/);
 assert.match(tour,/mutationObserver=new MutationObserver\(measure\)/);
 assert.match(tour,/mutationObserver\.observe\(grid,\{/);
 assert.match(tour,/childList:true,subtree:true,attributes:true,attributeFilter:\['id'\]/);
 assert.doesNotMatch(tour,/mutationObserver\.observe\(document\.body/);
 assert.doesNotMatch(tour,/MutationObserver\(\(\)=>\{\s*setAnchor/);
});

test('change observers and scheduled frames do not survive dismissal or step changes',()=>{
 assert.match(tour,/\},\[visible,step\]\)/);
 assert.match(tour,/window\.cancelAnimationFrame\(frame\)/);
 assert.match(tour,/resizeObserver\?\.disconnect\(\)/);
 assert.match(tour,/mutationObserver\?\.disconnect\(\)/);
 assert.match(tour,/window\.removeEventListener\('scroll',measure,true\)/);
 assert.match(tour,/const rect=bounds&&style\?\.display!=='none'/);
 assert.match(tour,/setAnchor\(rect\?\{rect,viewport\}:null\)/);
});

test('repositioning retains original opt-out, guest restrictions and native safe fallback',()=>{
 assert.match(tour,/persistGuestTutorialOptOut\(next,AsyncStorage,mirror\)/);
 assert.match(tour,/中央會員登入目前尚未串接/);
 assert.match(tour,/私人錄音、正式會員登入及付費功能尚未開放/);
 assert.match(tour,/spotlight&&callout\?<>/);
 assert.match(tour,/Platform\.OS==='web'&&anchor/);
 assert.doesNotMatch(tour,/R2\.get|D1\.prepare|getPublicStreamUrl|fetch\(/);
});
