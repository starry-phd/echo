import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {historicallyRankableTracks} from '../src/ui/echo/historicallyRankableTracks.ts';
import {sortEchoCards} from '../src/ui/echo/cardSorting.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

const tracks=[
 {id:'unverified-or-incomplete',title:'未獲准資料不得參與榜單',speaker:'A',
  playable:false,legacySnapshot:false,rating:5,likes:500,commentsCount:200},
 {id:'verified-without-history',title:'公開但尚無歷史統計',speaker:'B',
  playable:true,legacySnapshot:false,rating:5,likes:500,commentsCount:200},
 {id:'guest-unknown',title:'未知指標不得冒充0',speaker:'C',
  playable:false,legacySnapshot:true,rating:null,likes:null,commentsCount:null},
 {id:'guest-rating',title:'有歷史評價',speaker:'D',
  playable:false,legacySnapshot:true,rating:4.6,likes:null,commentsCount:2},
 {id:'guest-count-zero',title:'明確記錄的0與未知不同',speaker:'E',
  playable:false,legacySnapshot:true,rating:0,likes:0,commentsCount:0},
 {id:'guest-likes',title:'有歷史按讚',speaker:'F',
  playable:false,legacySnapshot:true,rating:null,likes:7,commentsCount:null}
];
test('historical metric ranking never treats absent or unauthorised counts as zero',()=>{
 assert.deepEqual(historicallyRankableTracks(tracks,'rating').map(t=>t.id),
  ['guest-rating','guest-count-zero']);
 assert.deepEqual(historicallyRankableTracks(tracks,'likes').map(t=>t.id),
  ['guest-count-zero','guest-likes']);
 assert.deepEqual(historicallyRankableTracks(tracks,'comments').map(t=>t.id),
  ['guest-rating','guest-count-zero']);
 assert.deepEqual(historicallyRankableTracks([tracks[1],tracks[2]],'rating'),[]);
});
test('zero stays rankable if actually published, metric sorting uses only eligible cards',()=>{
 const ranked=sortEchoCards(historicallyRankableTracks(tracks,'likes'),'likes');
 assert.deepEqual(ranked.map(t=>t.id),['guest-likes','guest-count-zero']);
 assert.equal(ranked[1].likes,0);
 assert.equal(tracks.length,6);
});
test('hot rankings reuse currently approved visible guest/public metadata only and explain missing metrics',()=>{
 const page=read('app/stats.tsx');
 assert.match(page,/getPublicTracks\(signal,\{offset:pageParam\}\)/);
 assert.match(page,/getGuestPreviewTracks\(signal\)/);
 assert.match(page,/mergeAuthorizedCards\(verifiedPublicTracks,previews\.data\?\?\[\]\)/);
 assert.match(page,/!preferences\.dislikedIds\.includes\(track\.id\)/);
 assert.match(page,/!isSpeakerHidden\(track\.speaker,preferences\.hiddenSpeakers\)/);
 assert.match(page,/sortEchoCards\(historicallyRankableTracks\(visible,metric\),metric\)\.slice\(0,10\)/);
 assert.match(page,/preferences\.ready&&display==='ready'&&ranked\.length===0/);
 assert.match(page,/沒有數字的作品不視為 0 分/);
 assert.match(page,/可嘗試其他指標或繼續載入公開作品/);
 assert.doesNotMatch(page,/R2\.get|privateAudio|centralUserId|memberProfile/);
});
