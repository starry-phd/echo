import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visibleSpeakerDirectory} from '../src/ui/echo/visibleSpeakerDirectory.ts';

test('a disliked approved guest card no longer supplies a speaker portrait or visible preview count',()=>{
 const speakers=[{name:'王小明',trackCount:2}];
 const previews=[
  {id:'hidden',speaker:'王小明',coverUrl:'/api/v1/previews/hidden/cover?policy=2'},
  {id:'visible',speaker:'王小明',coverUrl:'/api/v1/previews/visible/cover?policy=2'}
 ];
 const result=visibleSpeakerDirectory(speakers,previews,['hidden'],[]);
 assert.deepEqual(result,[{name:'王小明',trackCount:3,coverUrl:previews[1].coverUrl}]);
 const none=visibleSpeakerDirectory([],previews,['hidden','visible'],[]);
 assert.deepEqual(none,[]);
});

test('hiding a co-speaker removes whole guest item and its portrait, without substring collisions',()=>{
 const previews=[
  {id:'joint',speaker:'王小明 & 林美麗',coverUrl:'/api/v1/previews/joint/cover?policy=2'},
  {id:'other',speaker:'王小明老師',coverUrl:'/api/v1/previews/other/cover?policy=2'}
 ];
 const result=visibleSpeakerDirectory([],previews,[],['林美麗']);
 assert.deepEqual(result,[{name:'王小明老師',trackCount:1,coverUrl:previews[1].coverUrl}]);
 const approved=visibleSpeakerDirectory([{name:'林美麗',trackCount:5}],previews,[],['林美麗']);
 assert.deepEqual(approved,result);
});

test('directory never invents new media and does not mutate authorized source arrays',()=>{
 const publicSpeakers=[{name:'公開講師',trackCount:1}];
 const previews=[{id:'g',speaker:'訪客講師',coverUrl:null}];
 const result=visibleSpeakerDirectory(publicSpeakers,previews,[],[]);
 assert.deepEqual(result,[{name:'公開講師',trackCount:1,coverUrl:null},{name:'訪客講師',trackCount:1,coverUrl:null}]);
 assert.deepEqual(publicSpeakers,[{name:'公開講師',trackCount:1}]);
 assert.deepEqual(previews,[{id:'g',speaker:'訪客講師',coverUrl:null}]);
});

test('home and speaker profile preserve preference gates; nonlegacy speaker directory route redirects',()=>{
 const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
 const list=readFileSync(new URL('../app/speaker/index.tsx',import.meta.url),'utf8');
 const profile=readFileSync(new URL('../app/speaker/[name].tsx',import.meta.url),'utf8');
 assert.match(home,/currentCatalogDisplayState\(ready,query,debouncedQuery,catalogDisplay\)/);
 assert.match(home,/disabled=\{!canDrawFromCurrentCatalog\(currentDisplay,luckyPhase==='spin'\)\}/);
 assert.match(home,/if\(!canDrawFromCurrentCatalog\(currentDisplay,luckyPhase==='spin'\)\)return/);
 assert.ok(list.includes('<Redirect href="/" />'));
 assert.doesNotMatch(list,/FlatList|visibleSpeakerDirectory|getPublicSpeakers/);
 assert.match(profile,/\(!ready\|\|display==='loading'\)/);
 assert.match(profile,/const photo=showBio\?p\.data\?\.find/);
 assert.match(profile,/authorizedSpeakerProfileTracks\(speaker,/);
});
