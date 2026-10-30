import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitSpeakerNames} from '../src/ui/echo/speakerNames.ts';
import {sanitizeHiddenSpeakers,isSpeakerHidden,restorableHiddenSpeakers} from '../src/ui/echo/hiddenSpeakers.ts';

test('a duo offers one independent hide choice for each distinct approved presenter',()=>{
 const names=splitSpeakerNames('王小明 & 林美麗');
 assert.deepEqual(names,['王小明','林美麗']);
 assert.deepEqual(splitSpeakerNames('王小明 ＆ 王小明'),['王小明']);
 assert.deepEqual(splitSpeakerNames('王小明'),['王小明']);
});

test('hiding only first presenter hides shared works but not the other presenter’s solo works',()=>{
 const [first,second]=splitSpeakerNames('王小明 & 林美麗');
 const hidden=sanitizeHiddenSpeakers([first]);
 assert.deepEqual(hidden,['王小明']);
 assert.equal(isSpeakerHidden(first+' & '+second,hidden),true);
 assert.equal(isSpeakerHidden(first,hidden),true);
 assert.equal(isSpeakerHidden(second,hidden),false);
 assert.equal(isSpeakerHidden(second+'老師',hidden),false);
});

test('the individually hidden duo presenter can be restored from currently approved duo work',()=>{
 const [first,second]=splitSpeakerNames('王小明 & 林美麗');
 const approved=[{speaker:first+' & '+second}];
 assert.deepEqual(restorableHiddenSpeakers(approved,[first]),[first]);
 assert.deepEqual(restorableHiddenSpeakers(approved,[second]),[second]);
 assert.deepEqual(restorableHiddenSpeakers(approved,['王小明 & 未授權講師']),[]);
});

test('card menu never passes a whole co-speaker string to device hide preference',()=>{
 const source=readFileSync(new URL('../src/ui/echo/LegacyTrackCard.tsx',import.meta.url),'utf8');
 assert.match(source,/const speakerNames=splitSpeakerNames\(track\.speaker\)/);
 assert.match(source,/const hideOneSpeaker=\(name:string\)=>/);
 assert.match(source,/const added=preferences\.hideSpeaker\(name\)/);
 assert.match(source,/speakerNames\.map\(name=><Pressable key=\{name\}/);
 assert.match(source,/onPress=\{\(\)=>hideOneSpeaker\(name\)\}/);
 assert.match(source,/accessibilityLabel=\{'隱藏演講者：'\+name\}/);
 assert.doesNotMatch(source,/preferences\.hideSpeaker\(track\.speaker\)/);
});
