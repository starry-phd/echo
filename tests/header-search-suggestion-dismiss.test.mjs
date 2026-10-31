import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original Echo search closes on outside clicks; header events reach catalog without a DOM listener',()=>{
 const ctx=read('src/ui/echo/HomeResetSignal.tsx');
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const home=read('app/index.tsx');
 assert.ok(ctx.includes('dismissSearchRevision:number;requestDismissSearch:()=>void'));
 assert.ok(ctx.includes('setDismissSearchRevision(value=>value+1)'));
 assert.ok(ctx.includes('useMemo(()=>({revision,requestReset,dismissSearchRevision,requestDismissSearch})'));
 assert.ok(header.includes('const {requestReset,requestDismissSearch}=useHomeResetSignal();'));
 assert.ok(home.includes('const {revision:homeResetRevision,dismissSearchRevision}=useHomeResetSignal();'));
 assert.ok(home.includes('seenDismissSearchRevision.current===dismissSearchRevision'));
 assert.ok(home.includes('seenDismissSearchRevision.current=dismissSearchRevision'));
 assert.ok(home.includes('searchSuggestionBlurGuard.dismiss();\n  Keyboard.dismiss();'));
 assert.ok(home.includes('},[dismissSearchRevision,searchSuggestionBlurGuard]);'));
 assert.doesNotMatch(ctx,/document\.addEventListener|window\.addEventListener/);
 assert.doesNotMatch(header,/document\.addEventListener|window\.addEventListener/);
});

test('non-navigation header actions dismiss search without resetting category, ranking, or query',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.ok(header.includes('onPress={()=>{requestDismissSearch();decrease();}}'));
 assert.ok(header.includes('onPress={()=>{requestDismissSearch();increase();}}'));
 assert.ok(header.includes('onPress={()=>{requestDismissSearch();setOpen(x=>!x);}}'));
 assert.ok(header.includes('onPress={()=>{requestDismissSearch();quickActions[id].run();}}'));
 assert.ok(header.includes('onPress={()=>{requestDismissSearch();setOpen(true);}}'));
 const home=read('app/index.tsx');
 const start=home.indexOf('// Original src/App.tsx closes the suggestion drawer');
 const end=home.indexOf(' const [debouncedQuery',start);
 assert.ok(start>0&&end>start);
 const dismiss=home.slice(start,end);
 for(const expression of ['setQuery(', 'setCategory(', 'setSpeakerRank(', 'setOrder(', 'router.replace(', 'getPublicTracks(']){
  assert.equal(dismiss.includes(expression),false,expression);
 }
});

test('existing home navigation resets filters while non-home links only dismiss suggestions',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const start=header.indexOf(" const go=(path:'/'");
 const end=header.indexOf(' const activeColor',start);
 assert.ok(start>0&&end>start);
 const go=header.slice(start,end);
 assert.ok(go.includes('requestDismissSearch();'));
 assert.ok(go.includes('closeMenu();'));
 assert.ok(go.includes("if(path==='/'){"));
 assert.ok(go.includes('requestReset();'));
 assert.ok(go.includes("router.replace('/');"));
 assert.ok(go.includes('router.push(path);'));
 const layout=read('app/_layout.tsx');
 assert.ok(layout.includes('<HomeResetProvider><DevicePreferencesProvider><AppShell/>'));
});
