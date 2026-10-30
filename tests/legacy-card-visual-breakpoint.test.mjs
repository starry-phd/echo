import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyAudioCardSizing} from '../src/ui/echo/legacyAudioCardSizing.ts';

const card=readFileSync(new URL('../src/ui/echo/LegacyTrackCard.tsx',import.meta.url),'utf8');

test('original audio card is 112px on phone, 128px from Tailwind sm=640px',()=>{
 assert.deepEqual(legacyAudioCardSizing(390),{cover:112,titleFont:16,titleLineHeight:17,speakerFont:14,durationFont:9,tagFont:9,bodyGap:12,bodyPadding:10,detailsRightPadding:28,starFont:18,engagementFont:14});
 assert.equal(legacyAudioCardSizing(639).cover,112);
 assert.deepEqual(legacyAudioCardSizing(640),{cover:128,titleFont:18,titleLineHeight:19,speakerFont:16,durationFont:10,tagFont:10,bodyGap:16,bodyPadding:12,detailsRightPadding:32,starFont:20,engagementFont:14});
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

test('legacy card responsive metadata and feedback-first order are preserved',()=>{
 assert.match(card,/\[styles\.body,\{padding:cardSizing\.bodyPadding,gap:cardSizing\.bodyGap\}\]/);
 assert.match(card,/\[styles\.details,\{paddingRight:cardSizing\.detailsRightPadding\}\]/);
 assert.match(card,/fontSize:fontSize\(cardSizing\.speakerFont\)/);
 assert.match(card,/fontSize:fontSize\(cardSizing\.durationFont\)/);
 assert.match(card,/fontSize:fontSize\(cardSizing\.tagFont\)/);
 assert.match(card,/fontSize:fontSize\(cardSizing\.starFont\)/);
 assert.match(card,/fontSize:fontSize\(cardSizing\.engagementFont\)/);
 // Original AudioCard.tsx uses order-1 on reactions and order-2 on stars.
 assert.ok(card.indexOf('style={styles.statRow}')<card.indexOf('style={styles.ratingRow}'));
 assert.ok(card.indexOf('style={styles.ratingRow}')<card.indexOf('style={[styles.snapshot,'));
 assert.match(card,/historicalCountLabel\(historical\.commentsCount\)/);
 assert.match(card,/historicalCountLabel\(historical\.likes\)/);
 assert.doesNotMatch(card,/track\.ratingCount\?\?0|track\.commentsCount\?\?0/);
});
