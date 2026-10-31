import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original speaker recording list has compact title and rank/date rather than a duplicate home card',()=>{
 const row=read('src/ui/echo/LegacySpeakerRecordingRow.tsx');
 const speaker=read('app/speaker/[name].tsx');
 assert.match(row,/\{track\.title\}<\/Text>/);
 assert.match(row,/\{track\.speakerRank\|\|'公開'\}\s*·\s*\{formatSpeakerRecordingDate\(track\.uploadDate\)\}/);
 assert.match(speaker,/display==='ready'\? visibleTracks\.map\(track=><LegacySpeakerRecordingRow key=\{track\.id\}/);
 assert.match(speaker,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.doesNotMatch(speaker,/LegacyTrackCard track=\{track\}/);
 assert.doesNotMatch(row,/getGuestPreviewTracks|getPublicTracks|privateAudio|R2\.get|<AudioPlayback/);
});

test('compact speaker list preserves device favorites and dislike/restore without mutating central member records',()=>{
 const speaker=read('app/speaker/[name].tsx');
 const row=read('src/ui/echo/LegacySpeakerRecordingRow.tsx');
 assert.match(speaker,/favoriteIds\.includes\(track\.id\)/);
 assert.match(speaker,/const added=toggleFavorite\(id\)/);
 assert.match(speaker,/onFavorite=\{\(\)=>toggleLocalFavorite\(track\.id\)\}/);
 assert.match(speaker,/onHide=\{\(\)=>hide\(track\.id\)\}/);
 assert.match(speaker,/restoreHidden\(\)/);
 assert.match(row,/onPress=\{onFavorite\}/);
 assert.match(row,/onPress=\{onHide\}/);
 assert.doesNotMatch(speaker,/centralMember\.write|\/api\/member\/|localStorage\.setItem/);
});

test('speaker selection confirms destination but must not present guest preview as playable',()=>{
 const speaker=read('app/speaker/[name].tsx');
 assert.match(speaker,/const \[confirmTrack,setConfirmTrack\]=useState<EchoTrack\|null>\(null\)/);
 assert.match(speaker,/onSelect=\{\(\)=>setConfirmTrack\(track\)\}/);
 assert.match(speaker,/\{confirmTrack&&<Modal visible transparent/);
 assert.match(speaker,/confirmTrack\.playable\?'是否查看並播放這場公開錄音？':'這場錄音尚未開放播放'/);
 assert.match(speaker,/尚無權播放原音檔/);
 assert.match(speaker,/selected\.playable\?'\/track\/\[id\]':'\/preview\/\[id\]'/);
 assert.match(speaker,/if\(confirmTrack\)setConfirmTrack\(null\);else close\(\)/);
 assert.doesNotMatch(speaker,/getPublicStreamUrl|R2\.get|\/api\/speaker-profiles\/view/);
});
