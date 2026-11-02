import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tutorialBrandBounds,normalizeTutorialTarget,tutorialSpotlightScrim}
 from '../src/ui/echo/legacyTutorialSpotlightGeometry.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const tutorial=read('src/ui/echo/LegacyGuestTutorial.tsx');
const header=read('src/ui/echo/LegacyHeader.tsx');

test('original brand spotlight surrounds microphone plus text, not stretchy header whitespace',()=>{
 const viewport={width:1024,height:768};
 const fullBrand={left:14,top:16,right:625,bottom:65};
 const icon={left:17,top:19,right:55,bottom:57};
 const label={left:64,top:22,right:156,bottom:53};
 const combined=tutorialBrandBounds(icon,label);
 assert.deepEqual(combined,{left:17,top:19,right:156,bottom:57});
 const focused=normalizeTutorialTarget(combined,viewport);
 assert.deepEqual(focused,{left:11,top:13,right:162,bottom:63});
 const legacyWide=normalizeTutorialTarget(fullBrand,viewport);
 assert.ok((focused.right-focused.left)<(legacyWide.right-legacyWide.left)/3);
 const masks=tutorialSpotlightScrim(focused,viewport);
 assert.equal(masks.reduce((sum,part)=>sum+part.width*part.height,0),
  viewport.width*viewport.height-(focused.right-focused.left)*(focused.bottom-focused.top));
});

test('brand union works when text is taller or icon position is offset by font zoom',()=>{
 const combined=tutorialBrandBounds({left:20,top:32,right:58,bottom:70},
  {left:70,top:18,right:192,bottom:76});
 assert.deepEqual(combined,{left:20,top:18,right:192,bottom:76});
 assert.deepEqual(normalizeTutorialTarget(combined,{width:320,height:568}),
  {left:14,top:12,right:198,bottom:82});
});

test('malformed or disappearing parts fail closed instead of highlighting full button',()=>{
 const icon={left:12,top:20,right:48,bottom:58};
 for(const invalid of [
  {left:80,top:40,right:80,bottom:55},
  {left:85,top:50,right:65,bottom:75},
  {left:70,top:30,right:Number.NaN,bottom:80},
  {left:70,top:30,right:120,bottom:Infinity},
 ]){
  assert.equal(tutorialBrandBounds(icon,invalid),null);
 }
 assert.equal(tutorialBrandBounds({left:0,top:30,right:0,bottom:40},icon),null);
});

test('Web tutorial reads only actual icon/text children, rejecting a stale or hidden label',()=>{
 assert.match(header,/nativeID="echo-tutorial-home-logo"/);
 assert.match(header,/styles\.brandIcon/);
 assert.match(header,/>繁星回聲<\/Text>/);
 assert.match(tutorial,/element\?\.children\.item\(0\)/);
 assert.match(tutorial,/element\?\.children\.item\(1\)/);
 assert.match(tutorial,/name\?\.textContent\?\.trim\(\)==='繁星回聲'/);
 assert.match(tutorial,/parts\.every\(visiblePart\)/);
 assert.match(tutorial,/tutorialBrandBounds\(parts\[0\]\.getBoundingClientRect\(\),parts\[1\]\.getBoundingClientRect\(\)\)/);
 assert.match(tutorial,/brandBounds\?normalizeTutorialTarget\(brandBounds,viewport\):null/);
 assert.doesNotMatch(tutorial,/R2\.get|D1\.prepare|fetch\(|getPublicStreamUrl/);
});

test('ResizeObserver watches only actual target elements and disconnects on cleanup',()=>{
 assert.match(tutorial,/typeof ResizeObserver!=='undefined'/);
 assert.match(tutorial,/new ResizeObserver\(measure\)/);
 assert.match(tutorial,/const nextObserved=\[element,\.\.\.parts\]/);
 assert.match(tutorial,/nextObserved\.some\(\(node,index\)=>node!==observed\[index\]\)/);
 assert.match(tutorial,/resizeObserver\.disconnect\(\)/);
 assert.match(tutorial,/for\(const node of observed\)resizeObserver\.observe\(node\)/);
 assert.match(tutorial,/resizeObserver\?\.disconnect\(\)/);
 assert.match(tutorial,/window\.addEventListener\('resize',measure\)/);
 assert.match(tutorial,/window\.addEventListener\('scroll',measure,true\)/);
});
