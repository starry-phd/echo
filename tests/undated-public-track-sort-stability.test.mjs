import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sortEchoCards} from '../src/ui/echo/cardSorting.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('missing public upload dates preserve original server order rather than lexicographic IDs',()=>{
 const publicCards=[
  {id:'z-latest-from-server',title:'已核准錄音乙'},
  {id:'a-next-from-server',title:'已核准錄音甲'},
  {id:'m-oldest-from-server',title:'已核准錄音丙'}
 ];
 assert.deepEqual(sortEchoCards(publicCards,'newest').map(t=>t.id),
  publicCards.map(t=>t.id));
 assert.deepEqual(sortEchoCards(publicCards,'oldest').map(t=>t.id),
  publicCards.map(t=>t.id));
 assert.deepEqual(publicCards.map(t=>t.id),[
  'z-latest-from-server','a-next-from-server','m-oldest-from-server']);
});

test('known dated curated guest cards sort chronologically; unknown dates always remain last',()=>{
 const cards=[
  {id:'z-public-1',uploadDate:null},
  {id:'a-public-2',uploadDate:undefined},
  {id:'guest-early',uploadDate:'2026-09-01'},
  {id:'guest-late',uploadDate:'2026-10-20'}
 ];
 assert.deepEqual(sortEchoCards(cards,'newest').map(t=>t.id),
  ['guest-late','guest-early','z-public-1','a-public-2']);
 assert.deepEqual(sortEchoCards(cards,'oldest').map(t=>t.id),
  ['guest-early','guest-late','z-public-1','a-public-2']);
 assert.equal(cards[0].id,'z-public-1','input remains unmodified');
});

test('dated ties remain deterministic and historical metric sorting is unchanged',()=>{
 const a={id:'b',uploadDate:'2026-10-01',rating:3};
 const b={id:'a',uploadDate:'2026-10-01',rating:3};
 const c={id:'c',uploadDate:'2026-10-20',rating:5};
 assert.deepEqual(sortEchoCards([a,b,c],'newest').map(t=>t.id),['c','a','b']);
 assert.deepEqual(sortEchoCards([a,b,c],'oldest').map(t=>t.id),['a','b','c']);
 assert.deepEqual(sortEchoCards([a,b,c],'rating').map(t=>t.id),['c','a','b']);
});

test('home safely explains missing upload dates without granting media access',()=>{
 const server=read('worker/index.ts');
 const home=read('app/index.tsx');
 const serverPublic=server.slice(server.indexOf('function publicTrack('),server.indexOf('const filterSchema'));
 assert.match(serverPublic,/playable:true/);
 assert.doesNotMatch(serverPublic,/uploadDate|audio_key|cover_key/);
 assert.match(home,/sortEchoCards\(mergeAuthorizedCards\(/);
 assert.match(home,/getPublicTracks\(signal,/);
 assert.match(home,/getGuestPreviewTracks\(signal\)/);
 assert.match(home,/visibleTracks\.some\(track=>!track\.uploadDate\)/);
 assert.match(home,/不代表實際上傳先後/);
 assert.match(home,/currentDisplay==='ready'\|\|currentDisplay==='empty'/);
 assert.doesNotMatch(home,/privateAudio|R2\.get|memberProfile/);
});
