import test from 'node:test';
import assert from 'node:assert/strict';
import {publicCategorySuggestions} from '../src/ui/echo/categorySuggestions.ts';
import {categoryFromRoute} from '../src/ui/echo/publicCategoryNavigation.ts';
import {matchesCardFilters} from '../src/ui/echo/cardFilters.ts';

test('search suggestion input matches only vetted public category labels',()=>{
 const source=['新人','激勵','事業','生活營養','健康'];
 assert.deepEqual(publicCategorySuggestions(source,''),source);
 assert.deepEqual(publicCategorySuggestions(source,'營養'),['生活營養']);
 assert.deepEqual(publicCategorySuggestions(source,'新人'),['新人']);
 assert.deepEqual(publicCategorySuggestions(source,'付費'),[]);
});

test('category lookup normalizes matching but retains exact published labels',()=>{
 const source=[' 新人 ','新人','ＡＩ','AI','事業',...Array.from({length:100},(_,i)=>'分類'+i)];
 assert.deepEqual(publicCategorySuggestions(source,'',3),['新人','ＡＩ','事業']);
 assert.deepEqual(publicCategorySuggestions(source,'AI'),['ＡＩ']);
 assert.equal(publicCategorySuggestions(source,'',50).length,16);
});

test('no original track titles, usernames, free-text or unapproved keywords are inferred',()=>{
 const categories=['新人','事業','激勵'];
 assert.deepEqual(publicCategorySuggestions(categories,'私人講師'),[]);
 assert.deepEqual(publicCategorySuggestions(categories,'VIP'),[]);
 assert.deepEqual(publicCategorySuggestions(categories,'成長 未知'),[]);
});

test('discard invalid strings/control characters and do not mutate source',()=>{
 const data=['', '  ', '\n敏感', '健康', 'X'.repeat(81)];
 const orig=[...data];
 assert.deepEqual(publicCategorySuggestions(data,''),['健康']);
 assert.deepEqual(data,orig);
 assert.deepEqual(publicCategorySuggestions(data,'',0),[]);
});

test('NFKC search hits preserve exact labels for both home and public route filters',()=>{
 const approved={title:'學習講座',speaker:'核准講師',categories:['ＡＩ','健康・營養']};
 const matches=publicCategorySuggestions(approved.categories,'AI');
 assert.deepEqual(matches,['ＡＩ']);
 assert.equal(categoryFromRoute(matches[0]),'ＡＩ');
 assert.equal(matchesCardFilters(approved,{category:matches[0]}),true);
 assert.equal(matchesCardFilters(approved,{category:'AI'}),false);
 assert.deepEqual(publicCategorySuggestions(approved.categories,'營養'),['健康・營養']);
});
test('reject non-navigable category hints instead of offering broken filters',()=>{
 assert.deepEqual(publicCategorySuggestions(['<script>','健康','＜private＞','健康\n其他'],''),['健康']);
});
