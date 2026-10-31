import test from 'node:test';
import assert from 'node:assert/strict';
import {baseSpeakerRank,matchesCardFilters} from '../src/ui/echo/cardFilters.ts';
const track={title:'成功之路',speaker:'陳講師 & Mary',speakerRank:'GAR創辦人皇冠大使',categories:['事業','新人'],uploadDate:'2026-10-01'};
test('speaker rank display filters follow legacy GAR/founder normalization',()=>{
 assert.equal(baseSpeakerRank(' GAR 創辦人皇冠大使 '),'皇冠大使');
 assert.equal(matchesCardFilters(track,{speakerRank:'皇冠大使'}),true);
 assert.equal(matchesCardFilters(track,{speakerRank:'鑽石'}),false);
});
test('search terms intersect across approved metadata and compose with category/rank',()=>{
 assert.equal(matchesCardFilters(track,{query:'成功　MARY 新人',category:'事業',speakerRank:'皇冠大使'}),true);
 assert.equal(matchesCardFilters(track,{query:'成功 不存在'}),false);
 assert.equal(matchesCardFilters(track,{query:'新人',category:'激勵'}),false);
 assert.equal(matchesCardFilters(track,{query:'2026-10'}),true);
});


test('keyword search matches NFKC-compatible labels without changing exact approved category filters',()=>{
 const authorized={title:'ＡＩ 健康講座',speaker:'Ｍａｒｙ ＆ 陳講師',speakerRank:'ＧＡＲ 創辦人白金',categories:['ＡＩ','生活・營養'],uploadDate:'2026-10-31'};
 assert.equal(matchesCardFilters(authorized,{query:'ai mary 營養'}),true);
 assert.equal(matchesCardFilters(authorized,{query:'ＡＩ　ｍａｒｙ　營養'}),true);
 assert.equal(matchesCardFilters(authorized,{query:'2026-10'}),true);
 assert.equal(matchesCardFilters(authorized,{query:'AI Mary 不存在'}),false);
 assert.equal(matchesCardFilters(authorized,{category:'ＡＩ',query:'AI'}),true);
 assert.equal(matchesCardFilters(authorized,{category:'AI',query:'AI'}),false,'category chips remain exact metadata');
 assert.equal(matchesCardFilters(authorized,{speakerRank:'白金',query:'AI'}),false,'rank equality remains untouched');
});

test('Unicode normalization never broadens the set of currently authorized cards',()=>{
 const cards=[
  {id:'approved',title:'ＡＩ入門',speaker:'已核准講師',categories:['ＡＩ']},
  {id:'other',title:'營養講座',speaker:'已核准講師',categories:['營養']}
 ];
 assert.deepEqual(cards.filter(c=>matchesCardFilters(c,{query:'ai'})).map(c=>c.id),['approved']);
 assert.deepEqual(cards.filter(c=>matchesCardFilters(c,{query:'隱私內容'})),[]);
});
