import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {speakerProfileSections,speakerBioUnavailableText,speakerQaUnavailableText} from '../src/ui/echo/speakerProfileSections.ts';

const page=readFileSync(new URL('../app/speaker/[name].tsx',import.meta.url),'utf8');
const oldProfile=readFileSync(new URL('../docs/06-legacy-feature-inventory.md',import.meta.url),'utf8');

test('the two original second-level speaker profile tabs are restored in order',()=>{
 assert.deepEqual(speakerProfileSections,[
  {id:'audio',label:'所有錄音'},
  {id:'qa',label:'歷史問答'}
 ]);
 assert.match(page,/speakerProfileSections\.map\(item=>/);
 assert.match(page,/accessibilityRole="tablist"/);
 assert.match(page,/accessibilityRole="tab"/);
 assert.match(page,/accessibilityState=\{\{selected:section===item\.id\}\}/);
 assert.match(page,/onPress=\{\(\)=>setSection\(item\.id\)\}/);
 assert.match(page,/visibleTracks\.length/);
 assert.match(page,/section==='qa'/);
 assert.match(page,/section==='audio'/);
 assert.match(page,/minHeight:48/);
});

test('speaker profile summary and QA are fail-closed, never synthesized from private media',()=>{
 assert.match(page,/綜合人物摘要/);
 assert.match(page,/speakerBioUnavailableText/);
 assert.match(page,/speakerQaUnavailableText/);
 assert.match(speakerBioUnavailableText,/尚未接入經授權的公開逐字稿/);
 assert.match(speakerQaUnavailableText,/不能|不顯示|尚未/);
 assert.match(speakerQaUnavailableText,/提問者隱私/);
 assert.doesNotMatch(page,/fetch\(['"]\/api\/speaker-profiles\/view/);
 assert.doesNotMatch(page,/privateAudio|R2\.get|private\/copied|memberTranscript/);
 assert.match(oldProfile,/簡介、AI問答/);
});

test('only current approved speaker cards grant a rendered profile and tabs',()=>{
 assert.match(page,/publicSpeakerRouteName\(name\)/);
 assert.match(page,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(page,/mergeAuthorizedCards\(q\.data\?\?\[\],p\.data\?\?\[\]\)/);
 assert.match(page,/showBio=ready&&display==='ready'&&!speakerHidden/);
 assert.match(page,/showBio&&<View style=\{styles\.tabList\}/);
 assert.match(page,/showBio&&section==='qa'&&<View/);
 assert.match(page,/section==='qa'&&showBio\?null/);
 assert.match(page,/display==='failed'/);
 assert.match(page,/重新讀取/);
});
