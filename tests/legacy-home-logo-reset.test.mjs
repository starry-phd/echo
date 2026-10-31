import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original logo contract resets already-mounted catalog instead of trusting same-path navigation',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const home=read('app/index.tsx');
 const context=read('src/ui/echo/HomeResetSignal.tsx');
 const layout=read('app/_layout.tsx');
 assert.ok(context.includes('createContext<HomeResetSignal|null>(null)'));
 assert.ok(context.includes('setRevision(value=>value+1)'));
 assert.ok(layout.includes('<HomeResetProvider><DevicePreferencesProvider><AppShell/>'));
 assert.ok(header.includes("if(path==='/'){"));
 assert.ok(header.includes("requestReset();"));
 assert.ok(header.includes("router.replace('/');"));
 assert.ok(home.includes('seenHomeResetRevision.current===homeResetRevision'));
 assert.ok(home.includes('seenHomeResetRevision.current=homeResetRevision'));
});

test('brand/title, menu home and pinned home shortcut share the same navigation reset',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.ok(header.includes("['首頁',()=>go('/')]"));
 assert.ok(header.includes("home:{label:'首頁',glyph:'⌂',run:()=>go('/')}"));
 assert.ok(header.includes("onPress={()=>go('/')} style={styles.brand}"));
 assert.ok(header.includes("onPress={()=>go('/')}"));
});

test('reset clears all safe local filter state, lucky animation and scroll position',()=>{
 const home=read('app/index.tsx');
 const start=home.indexOf('// Original home logo and main-menu home action');
 const end=home.indexOf(' const dislikeTrack=',start);
 assert.ok(start>0&&end>start);
 const s=home.slice(start,end);
 for(const key of ["setQuery('')","setDebouncedQuery('')","setCategory(null)",
  "setSpeakerRank(null)","setOrder('newest')","setAdvanced(false)","setNotice('')",
  "setLuckySpinId(null)","setLuckyPreviewId(null)","setLuckyPhase('idle')",
  "searchSuggestionBlurGuard.dismiss()",
  "luckyGeneration.current++",
  "clearTimeout(luckyTimer.current)",
  "homeScrollRef.current?.scrollTo({y:0,animated:true})"]){
  assert.ok(s.includes(key),key);
 }
 assert.ok(home.includes('categoryFromRoute(linkedCategory)'));
 assert.ok(home.includes('speakerRankFromRoute(linkedSpeakerRank)'));
});

test('new reset signal contains no private-media, billing or central-membership side effects',()=>{
 const code=read('src/ui/echo/HomeResetSignal.tsx');
 for(const unsafe of ['R2.get','D1','fetch(','AudioPlayback','RevenueCat']){
  assert.equal(code.includes(unsafe),false,unsafe);
 }
 const home=read('app/index.tsx');
 assert.ok(home.includes('getGuestPreviewTracks(signal)'));
 assert.ok(home.includes('getPublicTracks(signal,'));
});
