import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedPublicTrackShareMessage} from '../src/ui/echo/publicTrackSharing.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const track={id:'public-uuid_123',title:'健康學習',speaker:'甲 & 乙',playable:true};

test('approved verified public detail generates a stable HTTPS PAGE link, not stream or token',()=>{
 assert.equal(approvedPublicTrackShareMessage(track,track.id,'https://echo-starry.starry-phd.workers.dev'),
  '健康學習 · 甲 & 乙\nhttps://echo-starry.starry-phd.workers.dev/track/public-uuid_123');
 assert.equal(approvedPublicTrackShareMessage(track,track.id,'http://localhost:8787'),
  '健康學習 · 甲 & 乙\nhttp://localhost:8787/track/public-uuid_123');
});
test('guest-only, wrong ID and malformed public origin fail closed',()=>{
 for(const t of [null,undefined,{...track,playable:false},{...track,id:'../private'},
  {...track,id:'a/b'},{...track,id:'%2F'},{...track,id:'a?secret=1'},
  {...track,id:''},{...track,id:'x'.repeat(201)}, {...track,title:' '},
  {...track,legacySnapshot:true}])
  assert.equal(approvedPublicTrackShareMessage(t,track.id,'https://example.com'),null);
 assert.equal(approvedPublicTrackShareMessage(track,'other','https://example.com'),null);
 for(const origin of [null,'','http://example.com','https://user:secret@example.com',
  'https://example.com/private','https://example.com?token=secret','javascript:alert(1)','https://example.com#fragment'])
  assert.equal(approvedPublicTrackShareMessage(track,track.id,origin),null,String(origin));
});
test('share text cleans control characters, only title/speaker and public detail are exported',()=>{
 assert.equal(approvedPublicTrackShareMessage({...track,title:'講座\nhttps://evil.example',speaker:'說話\r者'},track.id,'https://echo.example'),
  '講座 https://evil.example · 說話 者\nhttps://echo.example/track/public-uuid_123');
});
test('share action is mounted only in individually verified public detail, after lecture notes and before comments',()=>{
 const detail=read('app/track/[id].tsx');
 const preview=read('app/preview/[id].tsx');
 const component=read('src/ui/echo/LegacyVerifiedTrackShare.tsx');
 assert.match(detail,/getPublicTrack\(trackId!,signal\)/);
 assert.match(detail,/LegacyVerifiedTrackShare track=\{track\} routeId=\{trackId\}/);
 assert.ok(detail.indexOf('<LegacyLectureNotes track={track}/>')<detail.indexOf('<LegacyVerifiedTrackShare'));
 assert.ok(detail.indexOf('<LegacyVerifiedTrackShare')<detail.indexOf('<LegacyEngagementDetail'));
 assert.doesNotMatch(preview,/LegacyVerifiedTrackShare|Share\.share|approvedPublicTrackShareMessage/);
 assert.match(component,/approvedPublicTrackShareMessage\(track,routeId,getApiBaseUrl\(\)\)/);
 assert.match(component,/if\(!message\|\|!routeId\|\|busy\)return/);
 assert.match(component,/const latest=await getPublicTrack\(routeId\)/);
 assert.match(component,/const currentMessage=approvedPublicTrackShareMessage\(latest,routeId,getApiBaseUrl\(\)\)/);
 assert.match(component,/if\(!currentMessage\|\|!latest\)/);
 assert.match(component,/Share\.share\(\{message:currentMessage,title:latest.title\}\)/);
 assert.doesNotMatch(component,/Share\.share\(\{message,title:track.title\}\)/);
 assert.match(component,/disabled=\{!message\|\|busy\}/);
 assert.doesNotMatch(component,/getPublicStreamUrl|\/api\/v1\/tracks|\/api\/v1\/previews|R2|\/private\//);
});
