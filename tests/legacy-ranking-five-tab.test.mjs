import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyRankingTabs,gatedRankingCopy} from '../src/ui/echo/legacyRankingTabs.ts';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original leaderboard five tabs are preserved in their source order',()=>{
 assert.deepEqual(legacyRankingTabs.map(t=>t.id),
  ['model','hot-tracks','members','stickers','hot-keywords']);
 assert.deepEqual(legacyRankingTabs.map(t=>t.label),
  ['模範生排行榜','熱門音檔排行榜','會員排行榜','貼紙排位賽','熱門關鍵字']);
 assert.equal(Object.keys(gatedRankingCopy).length,4);
 for(const [id,copy] of Object.entries(gatedRankingCopy)){
  assert.notEqual(id,'hot-tracks');
  assert.ok(copy.length>=25);
 }
});

test('ranking route is reachable from menu and Expo Router stack',()=>{
 const layout=read('app/_layout.tsx');
 const menu=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(layout,/<Stack.Screen name="stats" \/>/);
 assert.match(menu,/\['排行榜',\(\)=>go\('\/stats'\)\]/);
 assert.doesNotMatch(menu,/\['通知','我的貼紙','音檔管理','統計中心'\]/);
});

test('popular ranking only touches current approved guest/public catalog with local exclusions',()=>{
 const page=read('app/stats.tsx');
 assert.match(page,/getPublicTracks\(signal\)/);
 assert.match(page,/getGuestPreviewTracks\(signal\)/);
 assert.match(page,/mergeAuthorizedCards\(catalog\.data\?\?\[\],previews\.data\?\?\[\]\)/);
 assert.match(page,/!preferences\.dislikedIds\.includes\(track\.id\)/);
 assert.match(page,/!isSpeakerHidden\(track\.speaker,preferences\.hiddenSpeakers\)/);
 assert.match(page,/sortEchoCards\(visible,metric\)\.slice\(0,10\)/);
 assert.match(page,/getCatalogDisplayState\(publicSource,previewSource,visible\.length\)/);
 assert.match(page,/LegacyTrackCard track=\{track\}/);
 assert.doesNotMatch(page,/private\/copied|R2\.get|SELECT \* FROM|fetch\('https:\/\/.*\/members/);
});

test('unavailable member, sticker and keyword rankings cannot pretend to show public statistics',()=>{
 const page=read('app/stats.tsx');
 assert.match(page,/gatedRankingCopy\[tab\]/);
 assert.match(page,/tab!=='hot-tracks'/);
 assert.match(page,/此頁目前為介面移植階段/);
 assert.match(page,/display==='failed'/);
 assert.match(page,/display==='empty'/);
 assert.match(page,/目前沒有符合公開條件的作品資料/);
 assert.match(page,/歷史唯讀紀錄/);
});
