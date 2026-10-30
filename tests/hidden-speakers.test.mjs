import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeHiddenSpeakers,isSpeakerHidden,restorableHiddenSpeakers} from '../src/ui/echo/hiddenSpeakers.ts';

test('speaker names are validated, canonicalized and capped',()=>{
 assert.deepEqual(sanitizeHiddenSpeakers(['王 小明','王 小明',null,'','甲'.repeat(81),'陳　美麗']),['王 小明','陳 美麗']);
 assert.deepEqual(sanitizeHiddenSpeakers({name:'private'}),[]);
 assert.deepEqual(sanitizeHiddenSpeakers(['good','bad\nvalue']),['good']);
 assert.equal(sanitizeHiddenSpeakers(Array.from({length:120},(_,i)=>'講師'+i)).length,100);
});
test('combined speakers hide their approved individual speaker cards, not substring collisions',()=>{
 assert.equal(isSpeakerHidden('王小明',['王小明 ＆ 林美麗']),true);
 assert.equal(isSpeakerHidden('林美麗',['王小明 & 林美麗']),true);
 assert.equal(isSpeakerHidden('王小明老師',['王小明']),false);
 assert.equal(isSpeakerHidden('王小明&李小華',['王小明']),true);
 assert.equal(isSpeakerHidden('李小華',['林美麗']),false);
});
test('stale speaker names never display without currently authorized exact speaker metadata',()=>{
 const allowed=[{speaker:'王小明'},{speaker:'李小華 & 林美麗'}];
 const names=['王小明','李小華 & 林美麗','私人講師','王小明＆私人講師'];
 assert.deepEqual(restorableHiddenSpeakers(allowed,names),['王小明','李小華 & 林美麗']);
 assert.deepEqual(names,['王小明','李小華 & 林美麗','私人講師','王小明＆私人講師']);
});

test('individually hidden duo speaker can be restored from currently approved duo metadata',()=>{
 const authorized=[{speaker:'王小明 & 林美麗'}];
 assert.deepEqual(restorableHiddenSpeakers(authorized,['王小明','林美麗']),
  ['王小明','林美麗']);
 assert.deepEqual(restorableHiddenSpeakers(authorized,['王小明老師']),[]);
 assert.deepEqual(restorableHiddenSpeakers(authorized,['私人講師']),[]);
});

test('a previously saved private combined name remains secret unless its entire group is approved',()=>{
 const authorized=[{speaker:'王小明 & 林美麗'}];
 const hidden=['王小明 & 私人講師','王小明＆林美麗','林美麗 & 私人講師'];
 assert.deepEqual(restorableHiddenSpeakers(authorized,hidden),['王小明&林美麗']);
 assert.deepEqual(restorableHiddenSpeakers([{speaker:'王小明'}],['王小明 & 私人講師']),[]);
});
