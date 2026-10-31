import test from 'node:test';
import assert from 'node:assert/strict';
import {describeEmptyPublicCatalog} from '../src/ui/echo/migrationPresentation.ts';

test('copied media is never described as playable or published',()=>{
 const result=describeEmptyPublicCatalog('copied',false);
 assert.match(result.title,/已安全搬遷/);
 assert.match(result.detail,/尚無核准公開/);
 assert.doesNotMatch(result.detail,/可以播放|已公開播放|全部公開/);
});
test('filtered catalog empty state remains search specific',()=>{
 const result=describeEmptyPublicCatalog('copied',true);
 assert.match(result.title,/找不到符合條件/);
});
test('unknown or offline migration state does not assert copy completed',()=>{
 for(const status of [undefined,'pending','unexpected']){
  const copy=describeEmptyPublicCatalog(status,false);
  assert.doesNotMatch(copy.title,/已安全搬遷/);
 }
});

test('an empty visible first page with more approved public pages never claims the catalog has no releases',()=>{
 for(const migration of ['copied','verified',undefined,'pending']){
  for(const filtered of [false,true]){
   const copy=describeEmptyPublicCatalog(migration,filtered,true);
   assert.match(copy.title,/目前載入的作品/);
   assert.match(copy.detail,/載入更多公開音檔/);
   assert.match(copy.detail,/不代表/);
   assert.doesNotMatch(copy.title+' '+copy.detail,/尚無核准公開|沒有可公開播放|尚無完成權限審查/);
  }
 }
});

test('an exhausted catalog keeps the existing accurate migration and filter messages',()=>{
 assert.deepEqual(describeEmptyPublicCatalog('copied',false,false),describeEmptyPublicCatalog('copied',false));
 assert.match(describeEmptyPublicCatalog('verified',false,false).title,/沒有可公開播放/);
 assert.match(describeEmptyPublicCatalog('copied',true,false).title,/找不到符合條件/);
});
