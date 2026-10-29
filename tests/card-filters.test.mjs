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
