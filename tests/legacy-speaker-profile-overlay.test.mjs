import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('speaker name uses old overlay instead of replacing the underlying page',()=>{
 const layout=read('app/_layout.tsx');
 assert.match(layout,/name="speaker\/\[name\]" options=\{\{presentation:'transparentModal'/);
 assert.match(layout,/contentStyle:\{backgroundColor:'transparent'\}/);
 const profile=read('app/speaker/[name].tsx');
 assert.match(profile,/演講者個人資訊視窗/);
 assert.match(profile,/演講者個人資訊<\/Text>/);
 assert.match(profile,/styles\.modalPanel/);
 assert.match(profile,/maxWidth:570/);
 assert.match(profile,/Math\.round\(Math\.max\(320,height-80\)\*0\.79\)/);
 assert.match(profile,/StyleSheet\.absoluteFill/);
 assert.match(profile,/accessibilityLabel="關閉演講者資料視窗"/);
 assert.match(profile,/onPress=\{close\}/);
 assert.match(profile,/router\.canGoBack\(\)\?router\.back\(\):router\.replace\('\/'\)/);
 assert.match(profile,/event\.key==='Escape'/);
 assert.doesNotMatch(profile,/返回講師列表/);
});

test('underlying approved profile permission gates and old tabs survive modal conversion',()=>{
 const profile=read('app/speaker/[name].tsx');
 assert.match(profile,/publicSpeakerRouteName\(name\)/);
 assert.match(profile,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(profile,/showBio=ready&&display==='ready'&&!speakerHidden/);
 assert.match(profile,/speakerProfileSections\.map\(item=>/);
 assert.match(profile,/section==='audio'/);
 assert.match(profile,/section==='qa'/);
 assert.doesNotMatch(profile,/getPublicStreamUrl|R2\.get|privateAudio|\/api\/speaker-profiles\/view/);
 for(const path of ['src/ui/echo/LegacyTrackCard.tsx','app/preview/[id].tsx','app/track/[id].tsx']){
  const source=read(path);
  assert.match(source,/pathname:'\/speaker\/\[name\]'/);
 }
});
