import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedExactCategoryLink,safeApprovedCategoryOptions} from '../src/ui/echo/safeApprovedCategoryOptions.ts';
import {matchesCardFilters} from '../src/ui/echo/cardFilters.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('approved categories link only when the exact metadata string matches',()=>{
 const track={title:'公開講座',speaker:'講師',categories:[' 新人 ','ＡＩ','健康・營養']};
 for(const raw of [' 新人 ','新人 ','\n新人','新人\t','＜危險＞','<private>','X'.repeat(81),'']){
  assert.equal(approvedExactCategoryLink(raw),null,JSON.stringify(raw));
 }
 for(const raw of ['ＡＩ','健康・營養']){
  assert.equal(approvedExactCategoryLink(raw),raw);
  assert.equal(matchesCardFilters(track,{category:raw}),true);
 }
 assert.equal(matchesCardFilters(track,{category:'新人'}),false);
 assert.deepEqual(safeApprovedCategoryOptions(track.categories),['ＡＩ','健康・營養']);
});

test('card and two authorized detail screens share exact validation and plain text fallback',()=>{
 for(const [path,value] of [
  ['src/ui/echo/LegacyTrackCard.tsx','c'],
  ['app/preview/[id].tsx','category'],
  ['app/track/[id].tsx','category']
 ]){
  const src=read(path);
  assert.ok(src.includes('const selected=approvedExactCategoryLink('+value+')'),path);
  assert.match(src,/return selected\?<Pressable/);
  assert.match(src,/params:\{category:selected\}/);
  assert.match(src,/<\/Pressable>:<View key=/);
  assert.doesNotMatch(src,/const selected=categoryFromRoute/);
 }
 const helper=read('src/ui/echo/safeApprovedCategoryOptions.ts');
 assert.match(helper,/safe!==raw/);
 assert.match(helper,/categoryFromRoute\(raw\.normalize\('NFKC'\)\)/);
 assert.doesNotMatch(helper,/R2\.get|privateAudio|memberProfile|localStorage/);
});
