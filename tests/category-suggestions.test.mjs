import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicCategorySuggestions,shouldShowCategorySuggestions} from '../src/ui/echo/categorySuggestions.ts';
import {categoryFromRoute} from '../src/ui/echo/publicCategoryNavigation.ts';
import {approvedExactCategoryLink} from '../src/ui/echo/safeApprovedCategoryOptions.ts';
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
 assert.deepEqual(publicCategorySuggestions(source,'',3),['新人','ＡＩ','AI']);
 assert.deepEqual(publicCategorySuggestions(source,'AI'),['ＡＩ','AI']);
 assert.equal(publicCategorySuggestions(source,'',50).length,16);
});

test('no original track titles, usernames, free-text or unapproved keywords are inferred',()=>{
 const categories=['新人','事業','激勵'];
 assert.deepEqual(publicCategorySuggestions(categories,'私人講師'),[]);
 assert.deepEqual(publicCategorySuggestions(categories,'VIP'),[]);
 assert.deepEqual(publicCategorySuggestions(categories,'成長 未知'),[]);
});

test('discard invalid strings/control characters and do not mutate source',()=>{
 const data=['', '  ', ' 健康 ', '\n敏感', '健康', '＜private＞', 'X'.repeat(81)];
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


test('different approved spellings are independently selectable exact categories',()=>{
 const source=['ＡＩ','AI','ai','ＡＩ','健康・營養','健康・營養'];
 const suggestions=publicCategorySuggestions(source,'ai');
 assert.deepEqual(suggestions,['ＡＩ','AI','ai']);
 for(const label of suggestions){
  assert.equal(approvedExactCategoryLink(label),label);
  const card={title:'公開講座',speaker:'講者',categories:[label]};
  assert.equal(matchesCardFilters(card,{category:label}),true);
 }
 // Unicode/NFKC improves matching the typed query but NEVER collapses
 // different exact filter values into a single suggestion.
 assert.equal(matchesCardFilters({title:'講座',speaker:'講者',categories:['AI']},{category:'ＡＩ'}),false);
});

test('raw unvetted suggestions never silently trim or normalize selected filter values',()=>{
 const source=[' 新人 ','新人 ','\n新人','新人\t','＜private＞','ＡＩ','AI','新人'];
 assert.deepEqual(publicCategorySuggestions(source,'AI'),['ＡＩ','AI']);
 assert.deepEqual(publicCategorySuggestions(source,'新人'),['新人']);
 assert.deepEqual(publicCategorySuggestions(source,''),['ＡＩ','AI','新人']);
});

test('legacy search panel stays closed on focus without meaningful typed keywords',()=>{
 const source=['新人','ＡＩ'];
 // The suggestion helper can list approved labels for other consumers, but
 // this original Echo panel only opens after the user enters a search term.
 const suggestions=publicCategorySuggestions(source,'');
 assert.deepEqual(suggestions,source);
 assert.equal(shouldShowCategorySuggestions(true,'',suggestions),false);
 assert.equal(shouldShowCategorySuggestions(true,' \t  ',suggestions),false);
 assert.equal(shouldShowCategorySuggestions(false,'AI',['ＡＩ']),false);
 assert.equal(shouldShowCategorySuggestions(true,'AI',[]),false);
 assert.equal(shouldShowCategorySuggestions(true,' AI ',['ＡＩ']),true);
 assert.equal(shouldShowCategorySuggestions(true,'營養',['健康營養']),true);
 const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
 assert.match(home,/shouldShowCategorySuggestions\(searchSuggestionsOpen,query,categorySuggestions\)/);
 assert.doesNotMatch(home,/\{searchSuggestionsOpen&&categorySuggestions\.length>0&&/);
});

test('original Echo category suggestion UI is capped at four without truncating toolbar filters',()=>{
 const source=['分類一','分類二','分類三','分類四','分類五','分類六'];
 assert.deepEqual(publicCategorySuggestions(source,'分類',4),source.slice(0,4));
 assert.equal(publicCategorySuggestions(source,'分類',16).length,source.length);
 const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
 assert.match(home,/publicCategorySuggestions\(categories,query,4\)/);
 assert.match(home,/<LegacyFilterToolbar categories=\{categories\}/);
});
