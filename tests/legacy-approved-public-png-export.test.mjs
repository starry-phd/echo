import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildApprovedPublicInfoCard,downloadPublicInfoCardPng}
 from '../src/ui/echo/publicInfoCardExport.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const approved={id:'verified-123',title:'公開講座',speaker:'公開講師',
 playable:true,description:'學習營養實例',categories:['新人','健康飲水'],durationSeconds:361,uploadDate:'2026-10-01T12:34:56Z'};

test('real PNG card builder uses only verified-public fields, no private members',()=>{
 const card=buildApprovedPublicInfoCard(approved,approved.id,'https://echo-starry.starry-phd.workers.dev');
 assert.deepEqual(card,{
  title:'公開講座',speaker:'公開講師',description:'學習營養實例',
  categories:['新人','健康飲水'],duration:'7 分鐘',uploadDate:'2026-10-01',
  publicPageUrl:'https://echo-starry.starry-phd.workers.dev/track/verified-123'
 });
 assert.equal(JSON.stringify(card).includes('private'),false);
});

test('private, preview, stale route, invalid origin or malformed metadata cannot export',()=>{
 for(const [track,id,origin] of [
  [null,approved.id,'https://echo.example'],
  [{...approved,playable:false},approved.id,'https://echo.example'],
  [approved,'not-the-same','https://echo.example'],
  [{...approved,id:'../private'},'../private','https://echo.example'],
  [approved,approved.id,'http://random.example'],
  [approved,approved.id,null],
  [{...approved,title:''},approved.id,'https://echo.example'],
 ])assert.equal(buildApprovedPublicInfoCard(track,id,origin),null);
});

test('optional metadata is sanitized and absent values are not invented',()=>{
 const card=buildApprovedPublicInfoCard({
  ...approved,title:'講座\n  說明',speaker:'甲\r\n乙',description:null,
  categories:['健康\n管理','', '專題', '新人', '其餘','多餘'],
  durationSeconds:0,uploadDate:'not-a-date'
 },approved.id,'https://echo.example');
 assert.equal(card.title,'講座 說明');
 assert.equal(card.speaker,'甲 乙');
 assert.equal(card.description,'');
 assert.equal(card.duration,'未提供');
 assert.equal(card.uploadDate,null);
 assert.deepEqual(card.categories,['健康 管理','專題','新人','其餘']);
 assert.equal(downloadPublicInfoCardPng instanceof Function,true);
 assert.throws(()=>downloadPublicInfoCardPng(card),/Web export only/);
});

test('web-only PNG export is mounted only after public-by-ID revalidation and never for guest preview',()=>{
 const share=read('src/ui/echo/LegacyVerifiedTrackShare.tsx');
 const exporter=read('src/ui/echo/publicInfoCardExport.ts');
 const detail=read('app/track/[id].tsx');
 const preview=read('app/preview/[id].tsx');
 assert.match(detail,/LegacyVerifiedTrackShare track=\{track\} routeId=\{trackId\}/);
 assert.match(share,/Platform\.OS==='web'\?buildApprovedPublicInfoCard/);
 assert.match(share,/const latest=await getPublicTrack\(routeId\)/);
 assert.match(share,/buildApprovedPublicInfoCard\(latest,routeId,getApiBaseUrl\(\)\)/);
 assert.match(share,/if\(!currentCard\)/);
 assert.match(share,/downloadPublicInfoCardPng\(currentCard\)/);
 assert.match(share,/匯出公開資訊圖卡 PNG/);
 assert.match(exporter,/document\.createElement\('canvas'\)/);
 assert.match(exporter,/canvas\.toDataURL\('image\/png'\)/);
 assert.match(exporter,/anchor\.download='繁星回聲_公開演講資訊圖卡\.png'/);
 assert.doesNotMatch(exporter,/fetch\(|audio|streamUrl|getPublicStreamUrl|uploader|externalVideos|externalPpts|comments\.map/);
 assert.doesNotMatch(preview,/LegacyVerifiedTrackShare|buildApprovedPublicInfoCard|downloadPublicInfoCardPng|canvas|Share\.share/);
});
