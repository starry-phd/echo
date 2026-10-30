import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeAuthorizedCards} from '../src/ui/echo/mergeAuthorizedCards.ts';
import {chooseSafeLuckyCard} from '../src/ui/echo/safeLuckyDraw.ts';
import {authorizedSpeakerProfileTracks} from '../src/ui/echo/authorizedSpeakerProfile.ts';

const guest=(id,speaker='測試講師')=>({id,title:'資訊卡',speaker,
 playable:false,legacySnapshot:true,description:null,
 coverUrl:'/api/v1/previews/'+id+'/cover?policy=2'});
const verified=(id,speaker='測試講師')=>({id,title:'已核准公開作品',speaker,
 playable:true,legacySnapshot:false,description:'經核准公開的摘要',coverUrl:null});

test('public verified track wins over same-ID guest card without mixing permissions',()=>{
 const publicTrack=verified('one');
 const guestTrack=guest('one');
 const result=mergeAuthorizedCards([publicTrack],[guestTrack]);
 assert.equal(result.length,1);
 assert.strictEqual(result[0],publicTrack);
 assert.equal(result[0].playable,true);
 assert.equal(result[0].coverUrl,null);
 assert.equal(result[0].description,'經核准公開的摘要');
 // Preview alone remains metadata-only: dedup must never authorize it.
 const previewOnly=mergeAuthorizedCards([],[guestTrack]);
 assert.equal(previewOnly[0].playable,false);
 assert.equal(chooseSafeLuckyCard(previewOnly).kind,'preview');
 assert.equal(chooseSafeLuckyCard(result).kind,'playable');
});

test('same-ID repeats within each API result produce one card in stable source order',()=>{
 const publicOne=verified('a');
 const previewOne=guest('b');
 assert.deepEqual(mergeAuthorizedCards([publicOne,verified('a')],[guest('a'),previewOne,guest('b')]).map(t=>t.id),['a','b']);
 assert.equal(mergeAuthorizedCards([],[guest('x'),guest('x')]).length,1);
});

test('merge is immutable and does not permit an old local ID to create a card',()=>{
 const p=[verified('verified')],v=[guest('preview')];
 const result=mergeAuthorizedCards(p,v);
 assert.deepEqual(result.map(t=>t.id),['verified','preview']);
 assert.deepEqual(p.map(t=>t.id),['verified']);
 assert.deepEqual(v.map(t=>t.id),['preview']);
 assert.notStrictEqual(result,p);
 assert.notStrictEqual(result,v);
 assert.deepEqual(mergeAuthorizedCards([],[]),[]);
});

test('speaker details contain one card when public and visitor APIs overlap',()=>{
 const authorized=mergeAuthorizedCards([verified('overlap')],[guest('overlap'),guest('new')]);
 assert.deepEqual(authorizedSpeakerProfileTracks('測試講師',authorized,[],[]).map(t=>t.id),['overlap','new']);
 assert.deepEqual(authorizedSpeakerProfileTracks('測試講師',authorized,['overlap'],[]).map(t=>t.id),['new']);
});

test('home, favorites, and speaker detail use the same authorized merge helper',()=>{
 const home=readFileSync(new URL('../app/index.tsx',import.meta.url),'utf8');
 const favorites=readFileSync(new URL('../app/favorites.tsx',import.meta.url),'utf8');
 const speaker=readFileSync(new URL('../app/speaker/[name].tsx',import.meta.url),'utf8');
 for(const source of [home,favorites,speaker])
  assert.match(source,/mergeAuthorizedCards\(/);
 assert.match(home,/sortEchoCards\(mergeAuthorizedCards\(/);
 assert.match(favorites,/const tracks=authorized\.filter/);
 assert.match(speaker,/authorizedSpeakerProfileTracks\(speaker,/);
});
