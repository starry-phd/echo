import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LEGACY_SKIP_SECONDS,LEGACY_PLAYBACK_RATES,canBeginPlaybackScrub,scrubTimeFromDelta}
 from '../src/media/legacyPlaybackControls.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original 4 seek jumps and 6 speed controls preserve legacy ordering',()=>{
 assert.deepEqual([...LEGACY_SKIP_SECONDS],[-30,-10,10,30]);
 assert.deepEqual([...LEGACY_PLAYBACK_RATES],[0.7,1,1.25,1.5,2,2.3]);
});
test('only starting close to a real timeline thumb may initiate a drag',()=>{
 assert.equal(canBeginPlaybackScrub(100,60,120,200),true);
 assert.equal(canBeginPlaybackScrub(128,60,120,200),true);
 assert.equal(canBeginPlaybackScrub(129,60,120,200),false);
 assert.equal(canBeginPlaybackScrub(10,60,120,200),false);
 assert.equal(canBeginPlaybackScrub(-1,0,120,200),false);
 assert.equal(canBeginPlaybackScrub(201,120,120,200),false);
 for(const invalid of [0,NaN,Infinity,-1])assert.equal(canBeginPlaybackScrub(0,0,120,invalid),false);
 assert.equal(canBeginPlaybackScrub(NaN,0,120,200),false);
 assert.equal(canBeginPlaybackScrub(100,0,0,200),false);
});
test('relative timeline gesture correctly clamps both ends without NaN or Infinity',()=>{
 assert.equal(scrubTimeFromDelta(40,20,100,200),50);
 assert.equal(scrubTimeFromDelta(40,-200,100,200),0);
 assert.equal(scrubTimeFromDelta(40,300,100,200),100);
 assert.equal(scrubTimeFromDelta(40,100,0,200),0);
 assert.equal(scrubTimeFromDelta(40,100,100,0),0);
 assert.equal(scrubTimeFromDelta(Infinity,100,100,200),0);
 assert.equal(scrubTimeFromDelta(40,NaN,100,200),0);
});
test('only verified-public route mounts timeline; private preview remains metadata-only',()=>{
 const detail=read('app/track/[id].tsx');
 const preview=read('app/preview/[id].tsx');
 const timeline=read('src/ui/echo/LegacyPlaybackTimeline.tsx');
 assert.match(detail,/LegacyPlaybackTimeline currentTime=\{status.currentTime\}/);
 assert.match(detail,/enabled=\{available&&status.isLoaded&&status.duration>0\}/);
 assert.match(detail,/if\(!available\|\|!status.isLoaded\|\|!LEGACY_PLAYBACK_RATES/);
 assert.match(detail,/player.setPlaybackRate\(rate\)/);
 assert.match(detail,/LEGACY_SKIP_SECONDS.slice\(0,2\)/);
 assert.match(detail,/LEGACY_SKIP_SECONDS.slice\(2\)/);
 assert.match(detail,/disabled=\{!available\|\|!status.isLoaded\}/);
 assert.match(detail,/getPublicTrack\(trackId!,signal\)/);
 assert.match(timeline,/canBeginPlaybackScrub/);
 assert.match(timeline,/onPanResponderRelease/);
 assert.match(timeline,/accessibilityRole="adjustable"/);
 assert.doesNotMatch(preview,/useAudioPlayer|getPublicStreamUrl|LegacyPlaybackTimeline|setPlaybackRate|AudioPlayback/);
 assert.match(preview,/這張卡片僅展示演講資訊/);
});
