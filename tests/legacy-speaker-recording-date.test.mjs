import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatSpeakerRecordingDate} from '../src/ui/echo/speakerRecordingDate.ts';

const profile=readFileSync(new URL('../app/speaker/[name].tsx',import.meta.url),'utf8');
const row=readFileSync(new URL('../src/ui/echo/LegacySpeakerRecordingRow.tsx',import.meta.url),'utf8');

test('speaker recording date follows the original legacy Taiwan display rules',()=>{
 assert.equal(formatSpeakerRecordingDate('2026-10-31'),'2026/10/31');
 assert.equal(formatSpeakerRecordingDate('2026-10-31T00:00:00Z'),'2026/10/31 08:00');
 assert.equal(formatSpeakerRecordingDate('2026-10-31T05:06:00+08:00'),'2026/10/31 05:06');
 assert.equal(formatSpeakerRecordingDate(null),'日期未設定');
 assert.equal(formatSpeakerRecordingDate(undefined),'日期未設定');
 assert.equal(formatSpeakerRecordingDate('invalid-date'),'日期未設定');
});

test('speaker profile dates appear only on current authorized recording cards, never by old private endpoint',()=>{
 assert.match(profile,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(profile,/display==='ready'\? visibleTracks\.map\(track=><View key=\{track\.id\}/);
 assert.match(row,/formatSpeakerRecordingDate\(track\.uploadDate\)/);
 assert.match(row,/\{track\.speakerRank\|\|'公開'\}\s*·\s*\{formatSpeakerRecordingDate\(track\.uploadDate\)\}/);
 assert.match(profile,/LegacySpeakerRecordingRow key=\{track\.id\}/);
 assert.doesNotMatch(profile,/LegacyTrackCard track=\{track\}/);
 assert.match(profile,/section==='audio'/);
 assert.doesNotMatch(profile,/\/api\/speaker-profiles\/view/);
 assert.doesNotMatch(profile,/getPublicStreamUrl|R2\.get|privateAudio/);
});
