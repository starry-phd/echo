import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeDislikedTrackIds,restorableHiddenCards} from '../src/ui/echo/dislikedTracks.ts';

test('dislike selections are local, validated and deduplicated',()=>{
 assert.deepEqual(sanitizeDislikedTrackIds(['a','a',null,'',42,'b']),['a','b']);
 assert.deepEqual(sanitizeDislikedTrackIds({id:'a'}),[]);
 assert.deepEqual(sanitizeDislikedTrackIds(['x'.repeat(201),'safe']),['safe']);
});

test('only currently authorized metadata is shown when managing stored hidden IDs',()=>{
 const publicCards=[{id:'public',title:'公開'}];
 const guests=[{id:'guest',title:'唯讀資訊卡'},{id:'public',title:'重複'}];
 const ids=['private','guest','public','guest','removed'];
 const selected=restorableHiddenCards(publicCards,guests,ids);
 assert.deepEqual(selected,[guests[0],publicCards[0]]);
 assert.ok(!selected.some(x=>x.id==='private'||x.id==='removed'));
 assert.deepEqual(ids,['private','guest','public','guest','removed']);
});
