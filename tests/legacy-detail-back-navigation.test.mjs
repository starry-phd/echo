import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const backControl=/onPress=\{\(\)=>router\.canGoBack\(\)\?router\.back\(\):router\.replace\('\/'\)\} style=\{styles\.back\}/;

test('verified-public detail returns to the originating screen, matching original DetailView onBack behavior',()=>{
 const detail=read('app/track/[id].tsx');
 const preview=read('app/preview/[id].tsx');
 assert.match(detail,backControl);
 assert.match(preview,backControl);
 assert.match(detail,/‹ 返回音檔列表/);
 assert.doesNotMatch(detail,/onPress=\{\(\)=>router\.push\('\/'\)\} style=\{styles\.back\}/);
});

test('back navigation never changes playback or guest authorization gates',()=>{
 const detail=read('app/track/[id].tsx');
 const preview=read('app/preview/[id].tsx');
 assert.match(detail,/getPublicTrack\(trackId!,signal\)/);
 assert.match(detail,/const available=track\.playable&&Boolean\(source\)/);
 assert.match(detail,/if\(!available\|\|!source\)return/);
 assert.match(preview,/Independent metadata-only detail route\. No media source or audio player exists here/);
 assert.doesNotMatch(preview,/getPublicStreamUrl|useAudioPlayer/);
});
