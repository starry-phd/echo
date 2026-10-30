import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterApprovedSpeakerDirectory} from '../src/ui/echo/approvedSpeakerSearch.ts';
import {visibleSpeakerDirectory} from '../src/ui/echo/visibleSpeakerDirectory.ts';

const speakers=Object.freeze([
 Object.freeze({name:'王小明',trackCount:2,coverUrl:'/approved/a'}),
 Object.freeze({name:'李 美麗',trackCount:1,coverUrl:'/approved/b'}),
 Object.freeze({name:'Alice Chen',trackCount:3,coverUrl:null}),
]);

test('speaker name search uses only the supplied, already-authorized directory',()=>{
 assert.deepEqual(filterApprovedSpeakerDirectory(speakers,'小明'),[speakers[0]]);
 assert.deepEqual(filterApprovedSpeakerDirectory(speakers,'李美麗'),[speakers[1]]);
 assert.deepEqual(filterApprovedSpeakerDirectory(speakers,' ALICE  chEN '),[speakers[2]]);
 assert.deepEqual(filterApprovedSpeakerDirectory(speakers,'不存在'),[]);
 assert.deepEqual(filterApprovedSpeakerDirectory(speakers,'  '),speakers);
 assert.deepEqual(speakers.map(s=>s.trackCount),[2,1,3]);
});

test('malformed or oversized search values fail closed',()=>{
 for(const value of [null,undefined,[],{},123,'a'.repeat(81),'Alice\nChen','Alice\u007fChen']){
  assert.deepEqual(filterApprovedSpeakerDirectory(speakers,value),[]);
 }
});

test('hidden speakers/cards cannot reappear after local directory search',()=>{
 const publicSpeakers=[{name:'公開講師',trackCount:2}];
 const previews=[
  {id:'g1',speaker:'核准講師',coverUrl:'/approved/g1'},
  {id:'g2',speaker:'隱藏講師',coverUrl:'/approved/g2'}
 ];
 const visible=visibleSpeakerDirectory(publicSpeakers,previews,['g2'],['公開講師']);
 assert.deepEqual(filterApprovedSpeakerDirectory(visible,''),[
  {name:'核准講師',trackCount:1,coverUrl:'/approved/g1'}
 ]);
 assert.deepEqual(filterApprovedSpeakerDirectory(visible,'隱藏'),[]);
});

test('screen filters after authorization and hydration, not through legacy/private APIs',()=>{
 const src=readFileSync(new URL('../app/speaker/index.tsx',import.meta.url),'utf8');
 assert.match(src,/visibleSpeakerDirectory\(/);
 assert.match(src,/filterApprovedSpeakerDirectory\(speakers,search\)/);
 assert.match(src,/<FlatList data=\{visibleSpeakers\}/);
 assert.match(src,/\(!ready\|\|display==='loading'\)/);
 assert.match(src,/accessibilityLabel="搜尋已核准講師姓名"/);
 assert.match(src,/accessibilityLabel="清除講師搜尋"/);
 assert.match(src,/maxLength=\{80\}/);
 assert.match(src,/minHeight:44/);
 assert.doesNotMatch(src,/legacy.*database|private.*fetch|getPrivateTracks|unverifiedAudio/);
});
