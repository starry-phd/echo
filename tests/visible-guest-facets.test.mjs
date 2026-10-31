import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visibleGuestFacets} from '../src/ui/echo/visibleGuestFacets.ts';

const approved=[
 {id:'a',speaker:'王小明 & 林美麗',speakerRank:'創辦人白金',categories:['學習','共同講師']},
 {id:'b',speaker:'李大華',speakerRank:'GAR鑽石',categories:['健康','飲食']},
 {id:'c',speaker:'王小明老師',speakerRank:'銀章',categories:['經營']}
];

test('guest-only filters exclude disliked card categories and ranks',()=>{
 const out=visibleGuestFacets(approved,['b'],[]);
 assert.deepEqual(out.categories,['學習','共同講師','經營']);
 assert.deepEqual(out.ranks,['白金','銀章']);
});

test('hiding one speaker excludes entire approved duo without substring collisions',()=>{
 const out=visibleGuestFacets(approved,[],['林美麗']);
 assert.deepEqual(out.categories,['健康','飲食','經營']);
 assert.deepEqual(out.ranks,['銀章','鑽石']);
 const prefix=visibleGuestFacets(approved,[],['王小明']);
 assert.deepEqual(prefix.categories,['健康','飲食','經營']);
 assert.deepEqual(visibleGuestFacets(approved,[],['王小明老師']).categories,['學習','共同講師','健康','飲食']);
});

test('remaining options preserve source order and do not duplicate a card id',()=>{
 const dup={...approved[0],speakerRank:'皇冠',categories:['錯誤的重複分類']};
 const out=visibleGuestFacets([...approved,dup],[],[]);
 assert.deepEqual(out.categories,['學習','共同講師','健康','飲食','經營']);
 assert.equal(out.ranks.includes('皇冠'),false);
 assert.equal(approved.length,3);
});

test('hidden-only guest metadata has no facet suggestions',()=>{
 assert.deepEqual(visibleGuestFacets(approved,['a','b','c'],[]),{categories:[],ranks:[]});
 assert.deepEqual(visibleGuestFacets([],[],['私人講師']),{categories:[],ranks:[]});
});

test('home filters use approved preview helper and wait for device preference hydration',()=>{
 const src=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
 assert.match(src,/visibleGuestFacets\(/);
 assert.match(src,/const ranks=ready\?approvedRanks:\[\]/);
 assert.match(src,/const categories=useMemo\(\(\)=>ready\?/);
 assert.match(src,/categoriesQuery\.data\?\?\[\]/);
 assert.match(src,/\.\.\.guestFacets\.categories/);
 assert.doesNotMatch(src,/previewsQuery\.data\?\?\[\]\)\.map\(t=>baseSpeakerRank/);
});
