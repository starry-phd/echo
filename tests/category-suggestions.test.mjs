import test from 'node:test';
import assert from 'node:assert/strict';
import {publicCategorySuggestions} from '../src/ui/echo/categorySuggestions.ts';

test('search suggestion input matches only vetted public category labels',()=>{
 const source=['新人','激勵','事業','生活營養','健康'];
 assert.deepEqual(publicCategorySuggestions(source,''),source);
 assert.deepEqual(publicCategorySuggestions(source,'營養'),['生活營養']);
 assert.deepEqual(publicCategorySuggestions(source,'新人'),['新人']);
 assert.deepEqual(publicCategorySuggestions(source,'付費'),[]);
});

test('categories are deduplicated, normalized and bounded with deterministic ordering',()=>{
 const source=[' 新人 ','新人','ＡＩ','AI','事業',...Array.from({length:100},(_,i)=>'分類'+i)];
 assert.deepEqual(publicCategorySuggestions(source,'',3),['新人','AI','事業']);
 assert.deepEqual(publicCategorySuggestions(source,'AI'),['AI']);
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
