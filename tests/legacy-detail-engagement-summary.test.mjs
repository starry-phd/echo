import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readHistoricalEngagement,historicalCountLabel} from '../src/ui/echo/legacyEngagementSnapshot.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base={id:'approved-a',title:'Approved',speaker:'Speaker',description:null,durationSeconds:0,categories:[],playable:false};

test('the compact detail summary is sourced only from explicitly approved legacy snapshots',()=>{
 const source=read('src/ui/echo/LegacyDetailEngagementSummary.tsx');
 assert.match(source,/readHistoricalEngagement\(track\)/);
 assert.match(source,/if\(!snapshot\)return null/);
 assert.match(source,/舊版統計（唯讀）/);
 assert.equal(readHistoricalEngagement({...base,rating:4.5,ratingCount:9}),null);
 assert.equal(readHistoricalEngagement({...base,legacySnapshot:true})?.ratingCount,null);
});

test('the summary preserves real zeroes and labels missing historical values instead of inventing counts',()=>{
 const source=read('src/ui/echo/LegacyDetailEngagementSummary.tsx');
 assert.match(source,/historicalCountLabel\(snapshot\.ratingCount\)/);
 assert.match(source,/historicalCountLabel\(snapshot\.commentsCount\)/);
 assert.match(source,/historicalCountLabel\(snapshot\.likes\)/);
 assert.equal(historicalCountLabel(0),'0');
 assert.equal(historicalCountLabel(null),'未提供');
 const snapshot=readHistoricalEngagement({...base,legacySnapshot:true,rating:4.2,ratingCount:0,commentsCount:0,likes:0});
 assert.deepEqual(snapshot,{rating:4.2,ratingCount:0,commentsCount:0,likes:0});
});

test('only the historical comments affordance jumps to the existing read-only engagement section',()=>{
 const source=read('src/ui/echo/LegacyDetailEngagementSummary.tsx');
 assert.match(source,/onPress=\{onViewEngagement\}/);
 assert.match(source,/accessibilityLabel=\{'查看歷史心得統計，共 '\+historicalCountLabel\(snapshot\.commentsCount\)\+' 篇'\}/);
 assert.match(source,/♡ \{historicalCountLabel\(snapshot\.likes\)\}/);
 assert.doesNotMatch(source,/fetch\(|\/api\/members|\/api\/comments|\/api\/ratings|toggleLike|onLike|setLikes/);
});

test('guest detail restores the original rating, comments and likes summary below speaker details',()=>{
 const preview=read('app/preview/[id].tsx');
 const summary=preview.indexOf('<LegacyDetailEngagementSummary track={track}');
 assert.ok(summary>=0);
 assert.ok(summary>preview.indexOf('styles.heroSpeakers'));
 assert.ok(summary<preview.indexOf('錄音長度：'));
 assert.match(preview,/onViewEngagement=\{\(\)=>sections\.jumpTo\('engagement'\)\}/);
 assert.match(preview,/LegacyEngagementDetail track=\{track\}/);
 assert.doesNotMatch(preview,/useAudioPlayer|getPublicStreamUrl|LegacyPlaybackTimeline|AudioPlayback|LegacyVerifiedTrackShare/);
});
