import test from 'node:test';
import assert from 'node:assert/strict';
import {splitSpeakerNames} from '../src/ui/echo/speakerNames.ts';
import {sortEchoCards} from '../src/ui/echo/cardSorting.ts';
test('original multi-speaker parsing keeps & / ＆ only and removes duplicates',()=>{
 assert.deepEqual(splitSpeakerNames('甲& 乙 ＆ 甲'),['甲','乙']);
 assert.deepEqual(splitSpeakerNames('ABC, DEF'),['ABC, DEF']);
 assert.deepEqual(splitSpeakerNames(''),[]);
});
test('legacy popular sort uses historical rating/likes/comments with deterministic ties',()=>{
 const a={id:'a',rating:2,likes:10,commentsCount:1,uploadDate:'2026-10-01'};
 const b={id:'b',rating:5,likes:2,commentsCount:8,uploadDate:'2026-10-02'};
 assert.deepEqual(sortEchoCards([a,b],'rating').map(x=>x.id),['b','a']);
 assert.deepEqual(sortEchoCards([a,b],'likes').map(x=>x.id),['a','b']);
 assert.deepEqual(sortEchoCards([a,b],'comments').map(x=>x.id),['b','a']);
 assert.deepEqual(sortEchoCards([a,b],'newest').map(x=>x.id),['b','a']);
 assert.deepEqual(sortEchoCards([a,b],'oldest').map(x=>x.id),['a','b']);
});
