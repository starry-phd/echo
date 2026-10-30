import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {authorizedSpeakerProfileTracks,publicSpeakerRouteName} from '../src/ui/echo/authorizedSpeakerProfile.ts';

const approved=[
 {id:'guest-1',speaker:'王小明 & 林美麗',coverUrl:'/api/v1/previews/guest-1/cover'},
 {id:'guest-2',speaker:'王小明老師',coverUrl:'/api/v1/previews/guest-2/cover'},
 {id:'public-1',speaker:'王小明',coverUrl:null}
];

test('a direct URL must contain a valid single normalized speaker, not a claim of authorization',()=>{
 assert.equal(publicSpeakerRouteName(' 王小明 '),'王小明');
 assert.equal(publicSpeakerRouteName('王小明 & 林美麗'),null);
 assert.equal(publicSpeakerRouteName('x\nprivate'),null);
 assert.equal(publicSpeakerRouteName('甲'.repeat(81)),null);
 assert.equal(publicSpeakerRouteName(['王小明']),null);
 assert.equal(publicSpeakerRouteName(''),null);
});

test('only currently approved exact-name/co-speaker cards establish a public speaker profile',()=>{
 assert.deepEqual(authorizedSpeakerProfileTracks('王小明',approved,[],[]).map(t=>t.id),['guest-1','public-1']);
 assert.deepEqual(authorizedSpeakerProfileTracks('林美麗',approved,[],[]).map(t=>t.id),['guest-1']);
 assert.deepEqual(authorizedSpeakerProfileTracks('王小',approved,[],[]),[]);
 assert.deepEqual(authorizedSpeakerProfileTracks('私人講師',approved,[],[]),[]);
 assert.deepEqual(authorizedSpeakerProfileTracks('王小明 & 林美麗',approved,[],[]),[]);
});

test('all hidden guest cards or speaker hide prevent a profile from showing name and photo',()=>{
 assert.deepEqual(authorizedSpeakerProfileTracks('林美麗',approved,['guest-1'],[]),[]);
 assert.deepEqual(authorizedSpeakerProfileTracks('林美麗',approved,[],['王小明 & 林美麗']),[]);
 assert.deepEqual(authorizedSpeakerProfileTracks('王小明',approved,[],['王小明']),[]);
 assert.deepEqual(authorizedSpeakerProfileTracks('王小明老師',approved,[],['王小明']).map(t=>t.id),['guest-2']);
});

test('profile renders URL-derived identity only after verified data, hydration and visibility gate',()=>{
 const source=readFileSync(new URL('../app/speaker/[name].tsx',import.meta.url),'utf8');
 assert.match(source,/const speaker=publicSpeakerRouteName\(name\)/);
 assert.match(source,/const visibleTracks=authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(source,/const showBio=ready&&display==='ready'&&!speakerHidden/);
 assert.match(source,/\{showBio&&<View style=\{\[styles\.bio/);
 assert.match(source,/const photo=showBio\?p\.data\?\.find/);
 assert.match(source,/visibleTracks\.some\(approved=>approved\.id===track\.id\)/);
 assert.match(source,/\(!ready\|\|display==='loading'\)/);
});
