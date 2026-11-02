import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/ui/echo/LegacyGuestTutorial.tsx',import.meta.url),'utf8');
const header=readFileSync(new URL('../src/ui/echo/LegacyHeader.tsx',import.meta.url),'utf8');
const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
const card=readFileSync(new URL('../src/ui/echo/LegacyTrackCard.tsx',import.meta.url),'utf8');
const originalNavbar=readFileSync(new URL('../docs/120-guest-menu-onboarding.md',import.meta.url),'utf8');

test('original visitor-profile hamburger is available as an actual visible homepage anchor',()=>{
 assert.match(header,/nativeID="echo-tutorial-visitor-menu" accessibilityRole="button"/);
 assert.match(header,/accessibilityLabel=\{open\?'關閉主選單':'開啟主選單'\}/);
 assert.match(header,/accessibilityState=\{\{expanded:open\}\}/);
 assert.match(originalNavbar,/data-tutorial-target="visitor-profile"/);
});

test('three accessible steps reference approved UI only and preserve previous safe anchors',()=>{
 assert.match(source,/useState<0\|1\|2>\(0\)/);
 assert.match(source,/step===0\?'echo-tutorial-home-logo':step===1\?'echo-tutorial-visitor-menu':'echo-tutorial-first-public-photo'/);
 assert.match(header,/nativeID="echo-tutorial-home-logo"/);
 assert.match(home,/tutorialTarget=\{index===0\}/);
 assert.match(card,/nativeID=\{tutorialTarget\?'echo-tutorial-first-public-photo':undefined\}/);
 assert.match(source,/if\(step===0\)\{setStep\(1\);return;\}/);
 assert.match(source,/if\(step===1\)\{/);
 assert.match(source,/setStep\(2\)/);
 assert.match(source,/scrollIntoView\(\{block:'center'\}\)/);
 assert.match(source,/step<2\?'下一步':'知道了'/);
});

test('visitor hint names only public navigation, never promises verified login or playback',()=>{
 assert.match(source,/② 訪客主選單/);
 assert.match(source,/排行榜、此裝置收藏及個人資料頁/);
 assert.match(source,/中央會員登入目前尚未串接/);
 assert.match(source,/私人錄音、正式會員登入及付費功能尚未開放/);
 assert.match(source,/照片不代表錄音有播放授權/);
 assert.match(source,/persistGuestTutorialOptOut\(next,AsyncStorage,mirror\)/);
 assert.doesNotMatch(source,/getPublicStreamUrl|fetch\(|R2\.get|D1\.prepare/);
});

test('fallback text guides native users even when the DOM spotlight cannot be mounted',()=>{
 assert.match(source,/Platform\.OS==='web'&&anchor/);
 assert.match(source,/spotlight&&callout\?<>/);
 assert.match(source,/☰ 訪客主選單/);
 assert.match(source,/正式會員登入尚未串接/);
});
