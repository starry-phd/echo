import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryFromRoute} from '../src/ui/echo/publicCategoryNavigation.ts';
import {speakerRankFromRoute} from '../src/ui/echo/publicSpeakerRankNavigation.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('category and rank deep links reject controls BEFORE trim on either edge',()=>{
 for(const invalid of ['\n','\r','\t','\u0000','\u007f']){
  for(const value of [invalid+'新人','新人'+invalid,' '+invalid+'新人 ']){
   assert.equal(categoryFromRoute(value),null,JSON.stringify(value));
  }
  for(const value of [invalid+'白金','白金'+invalid,' '+invalid+'白金 ']){
   assert.equal(speakerRankFromRoute(value),null,JSON.stringify(value));
  }
 }
 assert.equal(categoryFromRoute(' 新人 '),'新人');
 assert.equal(categoryFromRoute('ＡＩ'),'ＡＩ');
 assert.equal(speakerRankFromRoute(' GAR 創辦人雙鑽石 '),'雙鑽石');
 assert.equal(speakerRankFromRoute(' 創辦人白金 '),'白金');
});

test('both authorized detail pages and list/home routes share the fail-closed validators',()=>{
 const home=read('app/index.tsx');
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 const category=read('src/ui/echo/publicCategoryNavigation.ts');
 const rank=read('src/ui/echo/publicSpeakerRankNavigation.ts');
 assert.match(category,/test\(value\)\)return null/);
 assert.match(rank,/test\(value\)\)return null/);
 assert.match(home,/categoryFromRoute\(linkedCategory\)/);
 assert.match(home,/speakerRankFromRoute\(linkedSpeakerRank\)/);
 assert.match(card,/approvedExactCategoryLink\(c\)/);
 for(const path of ['app/preview/[id].tsx','app/track/[id].tsx']){
  const page=read(path);
  assert.match(page,/approvedExactCategoryLink\(category\)/);
 }
 assert.doesNotMatch(category,/test\(clean\)/);
 assert.doesNotMatch(rank,/test\(clean\)/);
});
