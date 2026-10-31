import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('home loads unlimited verified-public catalog pages without requesting private or guest pagination',()=>{
 const page=read('app/index.tsx');
 assert.match(page,/useInfiniteQuery\(\{/);
 assert.match(page,/queryKey:\['echo','public-tracks',debouncedQuery,category\]/);
 assert.match(page,/getPublicTracks\(signal,\{\s*query:debouncedQuery,category:category\?\?undefined,offset:pageParam/);
 assert.match(page,/initialPageParam:0/);
 assert.match(page,/getNextPageParam:\(lastPage,allPages\)=>lastPage\.length===100\?allPages\.length\*100:undefined/);
 assert.match(page,/tracksQuery\.data\?\.pages\.flat\(\)\?\?\[\]/);
 assert.match(page,/mergeAuthorizedCards\(\s*verifiedPublicTracks,previewsQuery\.data\?\?\[\]/);
 assert.match(page,/getGuestPreviewTracks\(signal\)/);
 assert.doesNotMatch(page,/getGuestPreviewTracks\(signal,\{.*offset|R2\.get|legacyDb|memberProfiles/);
});

test('home shows only loaded counts, safely filters all pages, and allows retry after page fetch errors',()=>{
 const page=read('app/index.tsx');
 assert.match(page,/matchesCardFilters\(t,\{/);
 assert.match(page,/!dislikedIds\.includes\(t\.id\)&&!isSpeakerHidden\(t\.speaker,hiddenSpeakers\)/);
 assert.match(page,/tracksQuery\.isError\|\|tracksQuery\.isFetchNextPageError/);
 assert.match(page,/void tracksQuery\.refetch\(\)/);
 assert.match(page,/tracksQuery\.hasNextPage\?'（仍有更多公開作品）':''/);
 assert.match(page,/canLoadMoreAuthorizedPublic\(currentDisplay,tracksQuery\.hasNextPage,ready\)&&<Pressable/);
 assert.match(page,/accessibilityLabel="載入更多已核准公開音檔"/);
 assert.match(page,/disabled=\{tracksQuery\.isFetchingNextPage\}/);
 assert.match(page,/tracksQuery\.fetchNextPage\(\)/);
 assert.match(page,/載入更多公開音檔/);
 assert.match(page,/chooseSafeLuckyCard\(visibleTracks,luckyPreviewId\)/);
 assert.match(page,/visibleTracks\.filter\(isApprovedPreview\)/);
 assert.doesNotMatch(page,/getPublicStreamUrl|privateAudio|downloadPrivateAudio/);
});

test('home still uses currently authorized preview list but never claims all pages are loaded',()=>{
 const page=read('app/index.tsx');
 assert.match(page,/訪客目前已載入/);
 assert.match(page,/資訊卡不代表播放授權/);
 assert.doesNotMatch(page,/訪客可瀏覽 <Text/);
 const sdk=read('packages/echo-api-sdk/src/index.ts');
 assert.match(sdk,/offset:filters\.offset/);
 const spec=JSON.parse(read('openapi/echo-public.v1.json'));
 assert.equal(spec.paths['/api/v1/catalog'].get.parameters.some(x=>x.name==='offset'),true);
 assert.equal(spec.paths['/api/v1/previews'].get.parameters.some(x=>x.name==='offset'),false);
});
