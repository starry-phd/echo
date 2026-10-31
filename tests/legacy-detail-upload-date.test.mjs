import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatLegacyDetailChineseDate} from '../src/ui/echo/legacyDetailDate.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original detail view date format is Chinese year month day and is NOT speaker list timezone formatting',()=>{
 assert.equal(formatLegacyDetailChineseDate('2026-10-31'),'2026年10月31日');
 assert.equal(formatLegacyDetailChineseDate('2026-10-31T23:00:00Z'),'2026年10月31日');
 assert.equal(formatLegacyDetailChineseDate('2026/6/1'),'2026年6月1日');
 assert.equal(formatLegacyDetailChineseDate(''),'');
 assert.equal(formatLegacyDetailChineseDate(null),'');
 assert.equal(formatLegacyDetailChineseDate(undefined),'');
 assert.equal(formatLegacyDetailChineseDate('unknown'),'unknown');
});
test('approved metadata-only detail uses original upload date label, without private backend fields',()=>{
 const notes=read('src/ui/echo/LegacyLectureNotes.tsx');
 assert.match(notes,/formatLegacyDetailChineseDate\(track\.uploadDate\)/);
 assert.match(notes,/\{uploadDate&&<View/);
 assert.match(notes,/上傳日期：/);
 assert.doesNotMatch(notes,/舊版上架日期：|track\.speechDate|track\.uploader|track\.series|fetch\(|R2\.get/);
 for(const path of ['app/preview/[id].tsx','app/track/[id].tsx']){
  const page=read(path);
  assert.match(page,/LegacyLectureNotes track=\{track\}/);
 }
 const preview=read('app/preview/[id].tsx');
 assert.doesNotMatch(preview,/AudioPlayback|getPublicStreamUrl|useAudioPlayer/);
});
