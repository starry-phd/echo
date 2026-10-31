import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedPublicTrackShareMessage} from '../src/ui/echo/publicTrackSharing.ts';
import {buildApprovedPublicInfoCard} from '../src/ui/echo/publicInfoCardExport.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const origin='https://echo-starry.starry-phd.workers.dev';
const publicTrack={id:'published-1',playable:true,title:'合法公開演講',speaker:'公開講者',
 categories:['新人'],durationSeconds:600};
test('guest preview remains nonshareable and nonexportable even if playable flag is inconsistent',()=>{
 const preview={...publicTrack,legacySnapshot:true};
 assert.equal(approvedPublicTrackShareMessage(preview,preview.id,origin),null);
 assert.equal(buildApprovedPublicInfoCard(preview,preview.id,origin),null);
 assert.ok(approvedPublicTrackShareMessage(publicTrack,publicTrack.id,origin));
});
test('verified detail rechecks the current public-by-ID contract before system sharing',()=>{
 const component=read('src/ui/echo/LegacyVerifiedTrackShare.tsx');
 const shareBody=component.slice(component.indexOf('const doShare='),component.indexOf('const doExport='));
 const fetch=shareBody.indexOf('const latest=await getPublicTrack(routeId)');
 const guard=shareBody.indexOf('if(!currentMessage||!latest)');
 const share=shareBody.indexOf('await Share.share({message:currentMessage,title:latest.title})');
 assert.ok(fetch>=0&&guard>fetch&&share>guard,'must verify latest before any share side effect');
 assert.match(shareBody,/approvedPublicTrackShareMessage\(latest,routeId,getApiBaseUrl\(\)\)/);
 assert.match(shareBody,/公開授權已變更，無法分享/);
 assert.match(shareBody,/catch\{setError\('目前無法確認最新公開權限/);
 assert.doesNotMatch(shareBody,/await Share.share\(\{message,title:track.title\}\)/);
 assert.doesNotMatch(shareBody,/getPublicStreamUrl|R2|privateAudio|\/api\/v1\/previews/);
 const guestDetail=read('app/preview/[id].tsx');
 assert.doesNotMatch(guestDetail,/LegacyVerifiedTrackShare|Share.share|buildApprovedPublicInfoCard/);
});
