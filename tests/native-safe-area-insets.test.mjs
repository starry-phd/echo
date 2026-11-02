import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LEGACY_BACK_TO_TOP_BOTTOM,legacyBackToTopBottom,legacyHeaderMenuTop,
 legacyHeaderPaddingTop,safeInset} from '../src/ui/echo/legacySafeArea.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Web without viewport-fit=cover (all insets 0) keeps the original 60+44 header and 24px button',()=>{
 assert.equal(legacyHeaderPaddingTop(0),0);
 assert.equal(legacyHeaderMenuTop(0),104);
 assert.equal(LEGACY_BACK_TO_TOP_BOTTOM,24);
 assert.equal(legacyBackToTopBottom(0),24);
 assert.doesNotMatch(read('app/+html.tsx'),/viewport-fit=cover/);
});

test('notch / Dynamic Island / Android edge-to-edge insets push the header, menu and button clear',()=>{
 assert.equal(legacyHeaderPaddingTop(59),59);
 assert.equal(legacyHeaderMenuTop(59),163);
 assert.equal(legacyBackToTopBottom(34),58);
 assert.equal(legacyHeaderMenuTop(24),128);
});

test('invalid insets never produce negative or NaN layout',()=>{
 for(const bad of [undefined,null,NaN,-5,Infinity])assert.equal(safeInset(bad),0);
 assert.equal(legacyHeaderMenuTop(NaN),104);
});

test('root layout provides safe-area metrics; header, menu, status bar and back-to-top consume them',()=>{
 const layout=read('app/_layout.tsx');
 assert.match(layout,/<SafeAreaProvider initialMetrics=\{initialWindowMetrics\}>/);
 assert.match(layout,/<\/QueryClientProvider><\/SafeAreaProvider>/);
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(header,/const insets=useSafeAreaInsets\(\);/);
 assert.match(header,/paddingTop:legacyHeaderPaddingTop\(insets\.top\)/);
 assert.match(header,/top:menuTop,maxHeight:headerMenuMaxHeight\(height,menuTop\)/);
 assert.match(header,/<StatusBar barStyle=\{colors\.dark\?'light-content':'dark-content'\}/);
 const back=read('src/ui/echo/LegacyBackToTop.tsx');
 assert.match(back,/bottom:legacyBackToTopBottom\(insets\.bottom\)/);
});
