import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyAudioCardSizing} from '../src/ui/echo/legacyAudioCardSizing.ts';

const card=readFileSync(new URL('../src/ui/echo/LegacyTrackCard.tsx',import.meta.url),'utf8');

test('original audio card is 112px on phone, 128px from Tailwind sm=640px',()=>{
 assert.deepEqual(legacyAudioCardSizing(390),{cover:112,titleFont:16,titleLineHeight:17});
 assert.equal(legacyAudioCardSizing(639).cover,112);
 assert.deepEqual(legacyAudioCardSizing(640),{cover:128,titleFont:18,titleLineHeight:19});
 assert.equal(legacyAudioCardSizing(1440).cover,128);
 assert.equal(legacyAudioCardSizing(Number.NaN).cover,112);
});
test('new card applies original cover/title sizing without loosening audio gating',()=>{
 assert.match(card,/legacyAudioCardSizing\(viewport\.width\)/);
 assert.match(card,/\[styles\.mediaSide,\{width:cardSizing\.cover\}\]/);
 assert.match(card,/\[styles\.portrait,\{width:cardSizing\.cover,height:cardSizing\.cover\}/);
 assert.match(card,/numberOfLines=\{1\} style=\{\[styles\.title,/);
 assert.match(card,/color:t\.ink,fontSize:fontSize\(cardSizing\.titleFont\),lineHeight:fontSize\(cardSizing\.titleLineHeight\)/);
 assert.match(card,/if\(!track\.playable\)/);
 assert.match(card,/approvedPublicTrackShareMessage\(track,track\.id,apiOrigin\)/);
});
