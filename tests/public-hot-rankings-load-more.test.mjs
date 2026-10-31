import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('approved hot recordings ranking pages the verified public API only, preserving 28 guest cards',()=>{
 const page=read('app/stats.tsx');
 assert.match(page,/useInfiniteQuery\(\{queryKey:\['echo','ranking-public-catalog'\]/);
 assert.match(page,/getPublicTracks\(signal,\{offset:pageParam\}\)/);
 assert.match(page,/initialPageParam:0/);
 assert.match(page,/getNextPageParam:\(lastPage,allPages\)=>lastPage\.length===100\?allPages\.length\*100:undefined/);
 assert.match(page,/catalog\.data\?\.pages\.flat\(\)\?\?\[\]/);
 assert.match(page,/mergeAuthorizedCards\(verifiedPublicTracks,previews\.data\?\?\[\]\)/);
 assert.match(page,/getGuestPreviewTracks\(signal\)/);
 assert.match(page,/!preferences\.dislikedIds\.includes\(track\.id\)/);
 assert.match(page,/!isSpeakerHidden\(track\.speaker,preferences\.hiddenSpeakers\)/);
 assert.match(page,/sortEchoCards\(visible,metric\)\.slice\(0,10\)/);
 assert.doesNotMatch(page,/getGuestPreviewTracks\(signal,\{offset|R2\.get|privateAudio/);
});

test('ranking never claims global completeness if more verified-public pages remain',()=>{
 const page=read('app/stats.tsx');
 assert.match(page,/目前已載入的 \{visible\.length\} 張核准作品/);
 assert.match(page,/catalog\.hasNextPage\?'（尚有公開作品未載入，名次非全量）':''/);
 assert.match(page,/canLoadMoreAuthorizedPublic\(display,catalog\.hasNextPage,preferences\.ready\)&&<Pressable/);
 assert.match(page,/accessibilityLabel="載入更多已驗證公開作品供排行榜排序"/);
 assert.match(page,/catalog\.isFetchingNextPage/);
 assert.match(page,/catalog\.fetchNextPage\(\)/);
 assert.match(page,/catalog\.isError\|\|catalog\.isFetchNextPageError/);
 assert.match(page,/void catalog\.refetch\(\)/);
 assert.match(page,/gatedRankingCopy\[tab\]/);
 assert.match(page,/歷史唯讀紀錄/);
});
