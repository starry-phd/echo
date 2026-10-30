import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mayChangeLocalDetailPreference} from '../src/ui/echo/detailPreferenceEligibility.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('verified public details offer device preferences only after exact authorized identity',()=>{
 const publicTrack={id:'pub-approved',playable:true,legacySnapshot:false};
 assert.equal(mayChangeLocalDetailPreference(publicTrack,publicTrack.id,'public'),true);
 assert.equal(mayChangeLocalDetailPreference(publicTrack,'other','public'),false);
 assert.equal(mayChangeLocalDetailPreference(publicTrack,null,'public'),false);
 assert.equal(mayChangeLocalDetailPreference({...publicTrack,playable:false},publicTrack.id,'public'),false);
 assert.equal(mayChangeLocalDetailPreference(publicTrack,publicTrack.id,'preview'),false);
});
test('metadata-only previews must be explicitly approved, never grant public playback',()=>{
 const card={id:'guest-approved',playable:false,legacySnapshot:true};
 assert.equal(mayChangeLocalDetailPreference(card,card.id,'preview'),true);
 assert.equal(mayChangeLocalDetailPreference(card,'different','preview'),false);
 assert.equal(mayChangeLocalDetailPreference({...card,legacySnapshot:false},card.id,'preview'),false);
 assert.equal(mayChangeLocalDetailPreference({...card,playable:true},card.id,'preview'),false);
 assert.equal(mayChangeLocalDetailPreference(null,card.id,'preview'),false);
 assert.equal(mayChangeLocalDetailPreference(card,card.id,'public'),false);
});
test('both existing detail routes have actual shared local favorites/dislike controls and per-track recovery',()=>{
 for(const path of ['app/track/[id].tsx','app/preview/[id].tsx']){
  const code=read(path);
  assert.match(code,/LegacyDetailDeviceActions track=\{track\} routeId=\{(?:trackId|id)\} source="(?:public|preview)"/);
  assert.match(code,/preferences\.dislikedIds\.includes\(track\.id\)/);
  assert.match(code,/preferences\.restoreHiddenTrack\(track\.id\)/);
  assert.match(code,/isLocallyHiddenCard\(track,preferences\.dislikedIds,preferences\.hiddenSpeakers\)/);
 }
 const publicDetail=read('app/track/[id].tsx');
 const preview=read('app/preview/[id].tsx');
 assert.match(publicDetail,/getPublicTrack\(trackId!,signal\)/);
 assert.match(preview,/getGuestPreviewTracks\(signal\)/);
 assert.doesNotMatch(preview,/useAudioPlayer|getPublicStreamUrl|LegacyPlaybackTimeline|setPlaybackRate|AudioPlayback/);
});
test('shared detail actions write only existing device preferences after verified gate',()=>{
 const code=read('src/ui/echo/LegacyDetailDeviceActions.tsx');
 assert.match(code,/preferences\.ready&&mayChangeLocalDetailPreference\(track,routeId,source\)/);
 assert.match(code,/if\(eligible\)preferences\.toggleFavorite\(track\.id\)/);
 assert.match(code,/if\(eligible\)preferences\.dislike\(track\.id\)/);
 assert.match(code,/accessibilityState=\{\{disabled:!eligible,selected:favorite\}\}/);
 assert.match(code,/不會同步中央會員、改變音檔公開權限或解鎖播放/);
 assert.match(code,/preferences\.storageError/);
 assert.doesNotMatch(code,/fetch\(|getPublicStreamUrl|\/api\/v1\/tracks|D1|R2|Share\.share|useAudioPlayer|AsyncStorage/);
});
