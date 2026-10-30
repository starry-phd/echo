import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detailJumpScrollOffset} from '../src/ui/echo/detailSectionScroll.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('jump offsets include scroll content shell/card placement and clamp near page top',()=>{
 assert.equal(detailJumpScrollOffset(0,48,840),876);
 assert.equal(detailJumpScrollOffset(10,3,4),5);
 assert.equal(detailJumpScrollOffset(0,0,0),0);
 assert.equal(detailJumpScrollOffset(100,50,0),138);
 for(const invalid of [NaN,Infinity,-Infinity,-1]){
  assert.equal(detailJumpScrollOffset(invalid,0,300),null);
  assert.equal(detailJumpScrollOffset(0,invalid,300),null);
  assert.equal(detailJumpScrollOffset(0,0,invalid),null);
 }
});
test('compact detail navigation is actually clickable with mobile accessibility and safe guest playback omission',()=>{
 const ui=read('src/ui/echo/LegacyDetailSectionNavigation.tsx');
 assert.match(ui,/accessibilityRole="button"/);
 assert.match(ui,/onPress=\{\(\)=>onJump\(item\.id\)\}/);
 assert.match(ui,/entries\.filter\(item=>showPlayback\|\|item\.id!=='playback'\)/);
 assert.match(ui,/minHeight:44/);
 for(const label of ['播放區','演講資訊','評價與心得','我的收藏'])
  assert.ok(ui.includes(label),label);
 const scroll=read('src/ui/echo/detailSectionScroll.ts');
 assert.match(scroll,/scrollRef\.current\?\.scrollTo\(\{y,animated:true\}\)/);
 assert.match(scroll,/typeof sectionOffset!=='number'/);
 assert.doesNotMatch(scroll,/fetch\(|AsyncStorage|window\.|document\.|getPublicStreamUrl|R2|D1/);
});
test('public detail navigation maps four real UI sections after verified public-by-id fetch',()=>{
 const detail=read('app/track/[id].tsx');
 assert.match(detail,/getPublicTrack\(trackId!,signal\)/);
 assert.match(detail,/ref=\{sections\.scrollRef\}/);
 assert.match(detail,/onLayout=\{sections\.onShellLayout\}/);
 assert.match(detail,/onLayout=\{sections\.onCardLayout\}/);
 assert.match(detail,/LegacyDetailSectionNavigation showPlayback=\{track\.playable\} onJump=\{sections\.jumpTo\}/);
 for(const section of ['playback','notes','engagement','device'])
  assert.match(detail,new RegExp("onLayout=\\{sections\\.onSectionLayout\\('"+section+"'\\)\\}"));
 assert.match(detail,/LegacyLectureNotes track=\{track\}/);
 assert.match(detail,/LegacyEngagementDetail track=\{track\}/);
 assert.match(detail,/LegacyDetailDeviceActions track=\{track\} routeId=\{trackId\} source="public"/);
});
test('guest preview provides only three metadata sections and cannot import audio or share',()=>{
 const preview=read('app/preview/[id].tsx');
 assert.match(preview,/getGuestPreviewTracks\(signal\)/);
 assert.match(preview,/ref=\{sections\.scrollRef\}/);
 assert.match(preview,/LegacyDetailSectionNavigation showPlayback=\{false\} onJump=\{sections\.jumpTo\}/);
 for(const section of ['notes','engagement','device'])
  assert.match(preview,new RegExp("onLayout=\\{sections\\.onSectionLayout\\('"+section+"'\\)\\}"));
 assert.doesNotMatch(preview,/onSectionLayout\('playback'\)|useAudioPlayer|getPublicStreamUrl|LegacyPlaybackTimeline|setPlaybackRate|AudioPlayback|LegacyVerifiedTrackShare/);
});
