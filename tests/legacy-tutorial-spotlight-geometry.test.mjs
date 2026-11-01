import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 normalizeTutorialTarget,tutorialCalloutPlacement,tutorialSpotlightScrim
} from '../src/ui/echo/legacyTutorialSpotlightGeometry.ts';

const header=readFileSync(new URL('../src/ui/echo/LegacyHeader.tsx',import.meta.url),'utf8');
const card=readFileSync(new URL('../src/ui/echo/LegacyTrackCard.tsx',import.meta.url),'utf8');
const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
const guide=readFileSync(new URL('../src/ui/echo/LegacyGuestTutorial.tsx',import.meta.url),'utf8');

test('reject stale, invisible or unsafe target rectangles before drawing callouts',()=>{
 const view={width:390,height:844};
 for(const rect of [
  {left:20,top:10,right:10,bottom:100},
  {left:-500,top:10,right:-100,bottom:100},
  {left:10,top:1000,right:50,bottom:1050},
  {left:0,top:0,right:Infinity,bottom:100},
  {left:10,top:10,right:10,bottom:25},
 ]){
  assert.equal(normalizeTutorialTarget(rect,view),null,JSON.stringify(rect));
 }
 assert.equal(normalizeTutorialTarget({left:10,top:20,right:90,bottom:80},view)?.left,4);
 const clipped=normalizeTutorialTarget({left:-4,top:-5,right:42,bottom:24},view);
 assert.deepEqual(clipped,{left:0,top:0,right:48,bottom:30});
});

test('the four-part overlay never covers a valid highlighted rectangle',()=>{
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1024,height:768}]){
  const focus=normalizeTutorialTarget({left:15,top:60,right:165,bottom:165},viewport);
  assert.ok(focus);
  const dim=tutorialSpotlightScrim(focus,viewport);
  assert.equal(dim.length,4);
  const dimArea=dim.reduce((sum,box)=>sum+box.width*box.height,0);
  const holeArea=(focus.right-focus.left)*(focus.bottom-focus.top);
  assert.equal(dimArea+holeArea,viewport.width*viewport.height);
  for(const box of dim){
   assert.ok(box.left>=0&&box.top>=0&&box.width>0&&box.height>0);
   assert.ok(box.left+box.width<=viewport.width);
   assert.ok(box.top+box.height<=viewport.height);
  }
 }
});

test('callouts never overflow narrow screens or short landscape viewports',()=>{
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:320,height:240}]){
  for(const raw of [
   {left:1,top:5,right:130,bottom:55},
   {left:10,top:viewport.height-100,right:180,bottom:viewport.height-10},
  ]){
   const focus=normalizeTutorialTarget(raw,viewport);
   assert.ok(focus);
   const box=tutorialCalloutPlacement(focus,viewport);
   assert.ok(box.left>=0&&box.top>=0);
   assert.ok(box.left+box.width<=viewport.width);
   assert.ok(box.top+box.height<=viewport.height);
  }
 }
});

test('spotlight anchors only approved homepage controls, not hidden/private objects',()=>{
 assert.match(header,/nativeID="echo-tutorial-home-logo"/);
 assert.match(card,/nativeID=\{tutorialTarget\?'echo-tutorial-first-public-photo':undefined\}/);
 assert.match(home,/displayedTracks\.map\(\(track,index\)=>/);
 assert.match(home,/tutorialTarget=\{index===0\}/);
 assert.match(guide,/document\.getElementById\(id\)/);
 assert.match(guide,/normalizeTutorialTarget\(bounds,viewport\)/);
 assert.match(guide,/window\.addEventListener\('orientationchange',measure\)/);
 assert.match(guide,/window\.addEventListener\('scroll',measure,true\)/);
 assert.match(guide,/tutorialSpotlightScrim\(spotlight\.rect,spotlight\.viewport\)/);
 assert.match(guide,/Platform\.OS==='web'/);
 assert.match(guide,/私人錄音、正式會員登入及付費功能尚未開放/);
 assert.doesNotMatch(guide,/getPublicStreamUrl|fetch\(|R2\.get|D1\.prepare/);
});
