import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sortEchoCards} from '../src/ui/echo/cardSorting.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('unknown metrics always sort after published values, regardless of direction',()=>{
 const approved=[
  {id:'z-public',rating:undefined,likes:undefined,commentsCount:undefined},
  {id:'a-guest-zero',rating:0,likes:0,commentsCount:0,uploadDate:'2026-10-01'},
  {id:'b-guest-high',rating:4.8,likes:5,commentsCount:3,uploadDate:'2026-10-02'},
  {id:'y-public',rating:null,likes:null,commentsCount:null}
 ];
 for(const [descending,ascending] of [
  ['rating','rating-asc'],['likes','likes-asc'],['comments','comments-asc']
 ]){
  assert.deepEqual(sortEchoCards(approved,descending).map(t=>t.id),
   ['b-guest-high','a-guest-zero','z-public','y-public']);
  assert.deepEqual(sortEchoCards(approved,ascending).map(t=>t.id),
   ['a-guest-zero','b-guest-high','z-public','y-public']);
 }
 assert.deepEqual(approved.map(t=>t.id),[
  'z-public','a-guest-zero','b-guest-high','y-public'
 ],'sort never mutates source API arrays');
});

test('malformed or unsafe numeric metrics never masquerade as a published zero',()=>{
 const cards=[
  {id:'invalid-negative',likes:-4,rating:-1,commentsCount:-1},
  {id:'unknown-nan',likes:NaN,rating:NaN,commentsCount:NaN},
  {id:'invalid-infinite',likes:Infinity,rating:Infinity,commentsCount:Infinity},
  {id:'invalid-fraction',likes:0.25,rating:5.8,commentsCount:0.5},
  {id:'known-zero',likes:0,rating:0,commentsCount:0}
 ];
 for(const ascending of ['likes-asc','comments-asc','rating-asc']){
  assert.equal(sortEchoCards(cards,ascending)[0]?.id,'known-zero');
 }
 assert.deepEqual(sortEchoCards([cards[1],cards[0]],'likes-asc').map(t=>t.id),
  ['unknown-nan','invalid-negative'],'unknown cards preserve API order');
});

test('home metric sort only uses already-authorized merged public and guest metadata',()=>{
 const home=read('app/index.tsx');
 const sort=read('src/ui/echo/cardSorting.ts');
 const worker=read('worker/index.ts');
 assert.match(home,/sortEchoCards\(mergeAuthorizedCards\(\s*verifiedPublicTracks,previewsQuery\.data\?\?\[\]/);
 assert.match(home,/matchesCardFilters\(t,/);
 assert.match(worker,/visibility = 'public' AND migration_status = 'verified'/);
 assert.match(worker,/INNER JOIN echo_guest_previews/);
 assert.match(sort,/if\(left===null\)return right===null\?0:1/);
 assert.match(sort,/Number\.isSafeInteger\(candidate\)/);
 assert.doesNotMatch(sort,/R2\.get|SELECT |privateAudio|centralMember/);
});
