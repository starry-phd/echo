import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canLoadMoreAuthorizedPublic} from '../src/ui/echo/publicLoadMoreEligibility.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('empty currently visible items cannot strand remaining verified-public pages',()=>{
 assert.equal(canLoadMoreAuthorizedPublic('empty',true,true),true);
 assert.equal(canLoadMoreAuthorizedPublic('ready',true,true),true);
 assert.equal(canLoadMoreAuthorizedPublic('empty',false,true),false);
 assert.equal(canLoadMoreAuthorizedPublic('failed',true,true),false);
 assert.equal(canLoadMoreAuthorizedPublic('loading',true,true),false);
 assert.equal(canLoadMoreAuthorizedPublic('empty',true,false),false);
 assert.equal(canLoadMoreAuthorizedPublic('ready',true,false),false);
});

test('home search/rank/hidden filters may hide first page but still offer next approved page',()=>{
 const home=read('app/index.tsx');
 assert.match(home,/canLoadMoreAuthorizedPublic\(currentDisplay,tracksQuery\.hasNextPage,ready\)&&<Pressable/);
 assert.match(home,/tracksQuery\.hasNextPage\?'目前已載入的作品沒有符合條件的資料，仍可繼續載入其他已核准公開作品。'/);
 assert.match(home,/currentCatalogDisplayState\(ready,query,debouncedQuery,catalogDisplay\)/);
 assert.match(home,/getPublicTracks\(signal,\{\s*query:debouncedQuery,category:category\?\?undefined,offset:pageParam/);
 assert.match(home,/!dislikedIds\.includes\(t\.id\)&&!isSpeakerHidden\(t\.speaker,hiddenSpeakers\)/);
 assert.match(home,/getGuestPreviewTracks\(signal\)/);
});

test('hot rankings can page when every current public card is hidden; private member tabs remain gated',()=>{
 const stats=read('app/stats.tsx');
 assert.match(stats,/canLoadMoreAuthorizedPublic\(display,catalog\.hasNextPage,preferences\.ready\)&&<Pressable/);
 assert.match(stats,/catalog\.hasNextPage\?'目前載入的作品沒有符合條件的結果，仍可載入更多核准公開作品。'/);
 assert.match(stats,/gatedRankingCopy\[tab\]/);
 assert.match(stats,/getPublicTracks\(signal,\{offset:pageParam\}\)/);
});

test('speaker page can load later approved cards after all first-page cards were locally hidden',()=>{
 const speaker=read('app/speaker/[name].tsx');
 assert.match(speaker,/!speakerHidden&&section==='audio'&&canLoadMoreAuthorizedPublic\(display,q\.hasNextPage,ready\)&&<Pressable/);
 assert.match(speaker,/q\.hasNextPage\?'目前已載入的作品皆被本裝置篩選或隱藏，可以繼續載入後續核准公開錄音。'/);
 assert.match(speaker,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(speaker,/getPublicTracks\(signal,\{speaker:speaker!,offset:pageParam\}\)/);
 assert.doesNotMatch(speaker,/getPublicStreamUrl|R2\.get|\/api\/speaker-profiles\/view/);
});
