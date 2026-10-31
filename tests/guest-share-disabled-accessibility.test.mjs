import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedPublicTrackShareMessage} from '../src/ui/echo/publicTrackSharing.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('curated guest information cards cannot obtain a public share page',()=>{
 const track={id:'guest-1',title:'原版核准資訊卡',speaker:'訪客講師',playable:false};
 assert.equal(approvedPublicTrackShareMessage(track,track.id,
  'https://echo-starry.starry-phd.workers.dev'),null);
 assert.equal(approvedPublicTrackShareMessage({...track,playable:true},'different-id',
  'https://echo-starry.starry-phd.workers.dev'),null);
});

test('share helper only emits a verified-public information page, never a stream URL',()=>{
 const approved={id:'public-1',title:'核准公開錄音',speaker:'公開講師',playable:true};
 const message=approvedPublicTrackShareMessage(approved,approved.id,
  'https://echo-starry.starry-phd.workers.dev');
 assert.ok(message?.includes('https://echo-starry.starry-phd.workers.dev/track/public-1'));
 assert.doesNotMatch(message??'',/\/stream|\/api\/v1\/tracks\//);
});

test('legacy card sharing is really disabled, not merely labelled inaccessible',()=>{
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 assert.match(card,/const publicShareMessage=approvedPublicTrackShareMessage\(track,track\.id,apiOrigin\)/);
 assert.match(card,/disabled=\{!publicShareMessage\} onPress=\{\(\)=>void share\(\)\}/);
 assert.match(card,/accessibilityState=\{\{disabled:!publicShareMessage\}\}/);
 assert.match(card,/accessibilityLabel=\{publicShareMessage\?'分享已核准公開音檔頁面':'分享尚未開放'\}/);
 assert.match(card,/accessibilityHint=\{publicShareMessage\?'只分享公開資訊頁面，不提供音檔網址':'僅取得公開分享授權的作品可分享'\}/);
 assert.match(card,/if\(!publicShareMessage\)\{onNotice\(/);
 assert.match(card,/Share\.share\(\{message:publicShareMessage,title:track\.title\}\)/);
 assert.doesNotMatch(card,/Share\.share\(\{.*streamUrl/);
});
