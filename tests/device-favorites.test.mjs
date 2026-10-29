import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanFavoriteIds} from '../src/ui/echo/deviceFavorites.ts';
test('offline device favorites do not accept malformed IDs or duplicates',()=>{
 assert.deepEqual(cleanFavoriteIds(['a','a','b','',5,null]),['a','b']);
 assert.deepEqual(cleanFavoriteIds('a'),[]);
});
