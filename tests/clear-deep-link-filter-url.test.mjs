import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryFromRoute} from '../src/ui/echo/publicCategoryNavigation.ts';
import {speakerRankFromRoute} from '../src/ui/echo/publicSpeakerRankNavigation.ts';
const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');

test('clear-all action removes stale category and rank deep-link parameters before reload',()=>{
 // A legitimate category/rank URL preselects the corresponding filter.
 assert.equal(categoryFromRoute('新人'),'新人');
 assert.equal(speakerRankFromRoute('創辦人白金'),'白金');
 const start=home.indexOf(' const clearAllHomeFilters=()=>{');
 const end=home.indexOf(' const resetLucky=()=>{',start);
 assert.ok(start>0&&end>start);
 const action=home.slice(start,end);
 for(const value of ["searchSuggestionBlurGuard.dismiss()","setQuery('')",
  "setDebouncedQuery('')","setCategory(null)","setSpeakerRank(null)",
  "linkedCategory!==undefined||linkedSpeakerRank!==undefined",
  "router.replace('/')"]){
  assert.ok(action.includes(value),value);
 }
 assert.ok(home.includes('onPress={clearAllHomeFilters} style={styles.restore}'));
});

test('clear-all does not replace route for ordinary text-only filters or create new history',()=>{
 const fn=home.slice(home.indexOf(' const clearAllHomeFilters=()=>{'),home.indexOf(' const resetLucky=()=>{'));
 assert.ok(fn.includes("if(linkedCategory!==undefined||linkedSpeakerRank!==undefined)router.replace('/');"));
 assert.equal(fn.includes('router.push('),false);
 assert.equal(fn.includes('router.setParams('),false);
 assert.equal(fn.includes('setOrder('),false,'clear filters is separate from sorting');
 assert.equal(fn.includes('R2.get'),false);
 assert.equal(fn.includes('AudioPlayback'),false);
});
