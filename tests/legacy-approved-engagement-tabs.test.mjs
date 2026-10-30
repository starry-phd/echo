import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readHistoricalEngagement,historicalCountLabel} from '../src/ui/echo/legacyEngagementSnapshot.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base={id:'approved-a',title:'Approved',speaker:'Speaker',description:null,durationSeconds:0,categories:[],playable:false};

test('legacy aggregate truth is unavailable unless explicitly sourced from a public legacy snapshot',()=>{
 assert.equal(readHistoricalEngagement({...base,rating:4.5,ratingCount:3}),null);
 assert.equal(readHistoricalEngagement({...base,legacySnapshot:false,rating:4.5,ratingCount:3}),null);
 assert.deepEqual(readHistoricalEngagement({...base,legacySnapshot:true}),{
  rating:null,ratingCount:null,commentsCount:null,likes:null
 });
});
test('approved historical counts allow true zero, but not absent, negative or invalid values',()=>{
 assert.deepEqual(readHistoricalEngagement({...base,legacySnapshot:true,rating:4.3,ratingCount:0,commentsCount:7,likes:99}),{
  rating:4.3,ratingCount:0,commentsCount:7,likes:99
 });
 for(const bad of [NaN,Infinity,-2,Number.MAX_SAFE_INTEGER+1]){
  const result=readHistoricalEngagement({...base,legacySnapshot:true,
   rating:bad,ratingCount:bad,commentsCount:bad,likes:bad});
  assert.deepEqual(result,{rating:null,ratingCount:null,commentsCount:null,likes:null});
 }
 const fractional=readHistoricalEngagement({...base,legacySnapshot:true,
  rating:1.5,ratingCount:1.5,commentsCount:1.5,likes:1.5});
 assert.deepEqual(fractional,{rating:1.5,ratingCount:null,commentsCount:null,likes:null});
 assert.equal(historicalCountLabel(null),'未提供');
 assert.equal(historicalCountLabel(0),'0');
});
test('both detail routes mount actual accessible two-tab historical content without private member APIs',()=>{
 const widget=read('src/ui/echo/LegacyEngagementDetail.tsx');
 assert.match(widget,/accessibilityRole="tablist"/);
 assert.match(widget,/accessibilityRole="tab"/);
 assert.match(widget,/onPress=\{\(\)=>setTab\(item.id\)\}/);
 assert.match(widget,/readHistoricalEngagement\(track\)/);
 assert.match(widget,/舊版歷史統計（唯讀）/);
 assert.match(widget,/須等 Starry ID 身分及 Echo 業務 API/);
 assert.doesNotMatch(widget,/fetch\(|AsyncStorage|\/api\/members|\/api\/comments|\/api\/ratings/);
 for(const path of ['app/track/[id].tsx','app/preview/[id].tsx']){
  assert.match(read(path),/LegacyEngagementDetail track=\{track\}/);
 }
 const preview=read('app/preview/[id].tsx');
 assert.match(preview,/getGuestPreviewTracks\(signal\)/);
 assert.doesNotMatch(preview,/useAudioPlayer|getPublicStreamUrl|LegacyPlaybackTimeline|setPlaybackRate|AudioPlayback/);
});
