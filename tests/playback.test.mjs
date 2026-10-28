import test from 'node:test';
import assert from 'node:assert/strict';
import {clampSeekTime,formatAudioTime} from '../src/media/playback.ts';

test('audio timestamps format empty, minutes, long lectures and invalid values',()=>{
 assert.equal(formatAudioTime(0),'0:00');
 assert.equal(formatAudioTime(65.9),'1:05');
 assert.equal(formatAudioTime(3605),'60:05');
 assert.equal(formatAudioTime(-1),'0:00');
 assert.equal(formatAudioTime(NaN),'0:00');
});
test('audio seeking never leaves valid media boundaries',()=>{
 assert.equal(clampSeekTime(-15,120),0);
 assert.equal(clampSeekTime(135,120),120);
 assert.equal(clampSeekTime(25,120),25);
 assert.equal(clampSeekTime(Infinity,120),0);
 assert.equal(clampSeekTime(15,NaN),0);
});
