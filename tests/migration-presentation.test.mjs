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
