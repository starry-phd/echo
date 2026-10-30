import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryFromRoute} from '../src/ui/echo/publicCategoryNavigation.ts';
import {approvedPublicTrackShareMessage} from '../src/ui/echo/publicTrackSharing.ts';
import {readHistoricalEngagement,historicalCountLabel} from '../src/ui/echo/legacyEngagementSnapshot.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const approved={id:'pub_123',playable:true,title:'合法講座',speaker:'公開講師'};

test('list category chips preserve approved exact label and reject dangerous filter values',()=>{
 assert.equal(categoryFromRoute(' 新人 '),'新人');
 assert.equal(categoryFromRoute('健康管理'),'健康管理');
 for(const bad of ['',' '.repeat(9),'<secret>','test\nitem','x'.repeat(81)]){
  assert.equal(categoryFromRoute(bad),null);
 }
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 assert.match(card,/track\.categories\.slice\(0,3\)\.map/);
 assert.match(card,/categoryFromRoute\(c\)/);
 assert.match(card,/accessibilityLabel=\{'瀏覽同分類已核准作品：'\+selected\}/);
 assert.match(card,/router\.push\(\{pathname:'\/',params:\{category:selected\}\}\)/);
 assert.match(card,/minHeight:44/);
 const home=read('app/index.tsx');
 assert.match(home,/categoryFromRoute\(linkedCategory\)/);
 assert.match(home,/matchesCardFilters\(t,/);
});
test('list and verified detail share the same fail-closed public PAGE sharing rules',()=>{
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 const detail=read('src/ui/echo/LegacyVerifiedTrackShare.tsx');
 const preview=read('app/preview/[id].tsx');
 assert.match(card,/approvedPublicTrackShareMessage\(track,track.id,apiOrigin\)/);
 assert.match(card,/if\(!publicShareMessage\)/);
 assert.match(card,/Share\.share\(\{message:publicShareMessage,title:track.title\}\)/);
 assert.match(detail,/approvedPublicTrackShareMessage\(track,routeId,getApiBaseUrl\(\)\)/);
 assert.doesNotMatch(card,/apiOrigin\+'\/track\/|encodeURIComponent\(track.id\)/);
 assert.doesNotMatch(preview,/Share\.share|approvedPublicTrackShareMessage/);
 assert.equal(approvedPublicTrackShareMessage(approved,approved.id,'https://example.org'),
  '合法講座 · 公開講師\nhttps://example.org/track/pub_123');
 for(const invalid of [{...approved,playable:false},{...approved,id:'../private'},{...approved,id:'%2F'}])
  assert.equal(approvedPublicTrackShareMessage(invalid,invalid.id,'https://example.org'),null);
});
test('card aggregates never forge absent member counts as zero or promise unavailable rewards',()=>{
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 assert.match(card,/readHistoricalEngagement\(track\)/);
 assert.match(card,/historicalCountLabel\(historical\.ratingCount\)/);
 assert.match(card,/historicalCountLabel\(historical\.commentsCount\)/);
 assert.match(card,/historicalCountLabel\(historical\.likes\)/);
 assert.doesNotMatch(card,/track\.ratingCount\?\?0|track\.commentsCount\?\?0|track\.likes\?\?0/);
 assert.doesNotMatch(card,/寫心得可得獎勵/);
 const snapshot=readHistoricalEngagement({...approved,legacySnapshot:true,rating:4.1});
 assert.equal(snapshot.rating,4.1);
 assert.equal(historicalCountLabel(snapshot.ratingCount),'未提供');
 assert.equal(historicalCountLabel(snapshot.commentsCount),'未提供');
 assert.equal(historicalCountLabel(snapshot.likes),'未提供');
 assert.equal(historicalCountLabel(0),'0');
 assert.equal(readHistoricalEngagement({...approved,legacySnapshot:false,rating:4.1}),null);
});
