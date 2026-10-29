import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeDislikedTrackIds} from '../src/ui/echo/dislikedTracks.ts';

test('dislike selections are local, validated and deduplicated',()=>{
 assert.deepEqual(sanitizeDislikedTrackIds(['a','a',null,'',42,'b']),['a','b']);
 assert.deepEqual(sanitizeDislikedTrackIds({id:'a'}),[]);
 assert.deepEqual(sanitizeDislikedTrackIds(['x'.repeat(201),'safe']),['safe']);
});
