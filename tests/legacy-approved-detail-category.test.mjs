import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryFromRoute} from '../src/ui/echo/publicCategoryNavigation.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('category links accept only short, exact, human-readable public labels',()=>{
 assert.equal(categoryFromRoute(' 健康管理 '),'健康管理');
 assert.equal(categoryFromRoute('Ａ類'),'Ａ類'); // keep exact label for matchesCardFilters()
 assert.equal(categoryFromRoute('新人'),'新人');
 for(const value of [null,undefined,[],['新人'],42,'',' ', 'x'.repeat(81),'<private>','a\nb','a\u007fb']){
  assert.equal(categoryFromRoute(value),null,String(value));
 }
});
test('both source-authorized detail routes offer true clickable category links',()=>{
 for(const path of ['app/preview/[id].tsx','app/track/[id].tsx']){
  const src=read(path);
  assert.match(src,/LegacyLectureNotes track=\{track\}/);
  assert.match(src,/accessibilityLabel=\{'瀏覽同分類已核准作品：'\+category\}/);
  assert.match(src,/router\.push\(\{pathname:'\/',params:\{category\}\}\)/);
 }
 const home=read('app/index.tsx');
 assert.match(home,/useLocalSearchParams<\{category\?:string;rank\?:string\}>\(\)/);
 assert.match(home,/categoryFromRoute\(linkedCategory\)/);
 assert.match(home,/setCategory\(linkedRank\?null:categoryFromRoute\(linkedCategory\)\)/);
 assert.match(home,/getPublicTracks\(signal,/);
 assert.match(home,/getGuestPreviewTracks\(signal\)/);
 assert.match(home,/matchesCardFilters\(t,/);
});
test('lecture notes only use published OpenAPI fields and never infer old private details',()=>{
 const notes=read('src/ui/echo/LegacyLectureNotes.tsx');
 assert.match(notes,/track\.description/);
 assert.match(notes,/track\.uploadDate/);
 assert.match(notes,/演講資訊與備註/);
 assert.match(notes,/目前沒有經核准公開的演講介紹或備註/);
 assert.match(notes,/上傳者、演講日期、系列及參考資料尚未有經核准公開的欄位/);
 assert.doesNotMatch(notes,/fetch\(|AsyncStorage|R2|track\.uploader|track\.speechDate|track\.series|externalVideos|externalPpts/);
 const preview=read('app/preview/[id].tsx');
 assert.doesNotMatch(preview,/useAudioPlayer|getPublicStreamUrl|LegacyPlaybackTimeline|setPlaybackRate|AudioPlayback/);
 assert.match(preview,/getGuestPreviewTracks\(signal\)/);
 assert.match(preview,/這張卡片僅展示演講資訊/);
});
