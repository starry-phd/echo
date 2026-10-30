import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacySortFields,legacySortLabels,visibleLegacySortFields,
 nextLegacySortOrder,sortFieldForOrder,isAscendingOrder} from '../src/ui/echo/legacySortFields.ts';
import {sortEchoCards} from '../src/ui/echo/cardSorting.ts';

test('latest original home toolbar is 7 desktop controls and 5 portrait-phone controls',()=>{
 assert.deepEqual(legacySortFields,['permission','rating','comments','likes','stickers','time','category']);
 assert.deepEqual(visibleLegacySortFields(1440),legacySortFields);
 for(const width of [280,320,360,375,390,414,430,599]){
  assert.deepEqual(visibleLegacySortFields(width),['permission','comments','stickers','time','category']);
 }
 assert.deepEqual(visibleLegacySortFields(600),legacySortFields);
 assert.deepEqual(legacySortFields.map(x=>legacySortLabels[x]),['權限','評價','心得','按讚','貼紙','時間','分類']);
});

test('only trustworthy metrics can sort, each repeat tap toggles ascending and descending',()=>{
 for(const [field,order] of [['time','newest'],['rating','rating'],['comments','comments'],['likes','likes']]){
  // Switching *from another field* selects its descending default;
  // tapping current 'newest' time instead correctly switches to 'oldest'.
  const first=nextLegacySortOrder(field==='time'?'rating':'newest',field);
  assert.equal(first,order);
  const second=nextLegacySortOrder(first,field);
  assert.equal(second,field==='time'?'oldest':field+'-asc');
  assert.equal(nextLegacySortOrder(second,field),first);
  assert.equal(sortFieldForOrder(second),field);
  assert.equal(isAscendingOrder(second),true);
 }
 assert.equal(sortFieldForOrder('newest'),'time');
 assert.equal(isAscendingOrder('rating'),false);
 assert.equal(nextLegacySortOrder('newest','permission'),null);
 assert.equal(nextLegacySortOrder('newest','stickers'),null);
 assert.equal(nextLegacySortOrder('rating','category'),null);
});

test('historical counts sort both directions with deterministic tie-breaking',()=>{
 const items=[
  {id:'b',rating:3,likes:10,commentsCount:5,uploadDate:'2026-10-01'},
  {id:'a',rating:3,likes:10,commentsCount:5,uploadDate:'2026-10-01'},
  {id:'c',rating:5,likes:2,commentsCount:1,uploadDate:'2026-10-04'}
 ];
 assert.deepEqual(sortEchoCards(items,'rating').map(x=>x.id),['c','a','b']);
 assert.deepEqual(sortEchoCards(items,'rating-asc').map(x=>x.id),['a','b','c']);
 assert.deepEqual(sortEchoCards(items,'likes').map(x=>x.id),['a','b','c']);
 assert.deepEqual(sortEchoCards(items,'likes-asc').map(x=>x.id),['c','a','b']);
 assert.deepEqual(sortEchoCards(items,'comments').map(x=>x.id),['a','b','c']);
 assert.deepEqual(sortEchoCards(items,'comments-asc').map(x=>x.id),['c','a','b']);
 assert.deepEqual(sortEchoCards(items,'newest').map(x=>x.id),['c','a','b']);
 assert.deepEqual(sortEchoCards(items,'oldest').map(x=>x.id),['a','b','c']);
 assert.deepEqual(items.map(x=>x.id),['b','a','c'],'sorting does not mutate input');
});

test('React Native toolbar keeps accessible category chooser and never invents membership ranking',()=>{
 const src=readFileSync(new URL('../src/ui/echo/LegacyFilterToolbar.tsx',import.meta.url),'utf8');
 const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
 assert.match(src,/visibleLegacySortFields\(width\)/);
 assert.match(src,/nextLegacySortOrder\(order,field\)/);
 assert.match(src,/accessibilityRole="button"/);
 assert.match(src,/unavailable=field==='permission'\|\|field==='stickers'/);
 assert.match(src,/onNotice\(field==='permission'/);
 assert.match(src,/\[null,\.\.\.categories\]\.map/);
 assert.match(src,/onCategory\(value\);setCategoryOpen\(false\)/);
 assert.match(home,/LegacyFilterToolbar categories=\{categories\}/);
 assert.doesNotMatch(src,/四個篩選按鈕/);
});
