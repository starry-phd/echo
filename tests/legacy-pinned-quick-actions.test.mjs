import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {QUICK_PIN_KEY,allowedQuickActions,quickDeviceForWidth,quickLimits,normalizeQuickChoices,
 createQuickActionStore} from '../src/ui/echo/quickActionStore.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('original mobile/tablet/desktop quick action limits preserved for the safe authorized subset',()=>{
 assert.deepEqual(quickLimits,{mobile:3,tablet:5,desktop:7});
 assert.deepEqual([320,390,599,600,820,899,900,1440].map(quickDeviceForWidth),
  ['mobile','mobile','mobile','tablet','tablet','tablet','desktop','desktop']);
 assert.deepEqual(allowedQuickActions,['home','palette','speakers','stats','favorites','profile','theme']);
});
test('untrusted saved IDs, duplicates and over-capacity items are dropped',()=>{
 const choices=normalizeQuickChoices({
  mobile:['home','home','hacker','palette','speakers','profile','stats'],
  tablet:['stats','profile','favorites','speakers','palette','theme'],
  desktop:['theme','stats','favorites']
 });
 assert.deepEqual(choices.mobile,['home','palette','speakers']);
 assert.deepEqual(choices.tablet,['stats','profile','favorites','speakers','palette']);
 assert.deepEqual(choices.desktop,['theme','stats','favorites']);
});
test('pin/unpin at capacity and up/down reorder persist in separate device configurations',async()=>{
 const storage=new Map();
 const api={getItem:async key=>storage.get(key)??null,setItem:async(key,value)=>{storage.set(key,value);}};
 const store=createQuickActionStore(api);
 assert.equal(store.togglePinned('mobile','stats'),false,'changes disabled before hydration');
 await store.hydrate();
 assert.deepEqual(store.getSnapshot().choices.mobile,['home','palette','speakers']);
 assert.equal(store.togglePinned('mobile','stats'),false,'mobile already has three');
 assert.equal(store.togglePinned('mobile','palette'),true);
 assert.equal(store.togglePinned('mobile','stats'),true);
 assert.deepEqual(store.getSnapshot().choices.mobile,['home','speakers','stats']);
 assert.equal(store.movePinned('mobile','stats',-1),true);
 assert.equal(store.movePinned('mobile','stats',-1),true);
 assert.equal(store.movePinned('mobile','stats',-1),false);
 assert.deepEqual(store.getSnapshot().choices.mobile,['stats','home','speakers']);
 assert.deepEqual(store.getSnapshot().choices.desktop,['home','palette','speakers','profile']);
 await store.flush();
 const next=createQuickActionStore(api);await next.hydrate();
 assert.deepEqual(next.getSnapshot().choices.mobile,['stats','home','speakers']);
 assert.deepEqual(next.getSnapshot().choices.desktop,['home','palette','speakers','profile']);
 assert.ok(storage.get(QUICK_PIN_KEY));
});
test('a failed AsyncStorage read never overwrites a possibly recoverable preferences file',async()=>{
 const writes=[];const store=createQuickActionStore({
  getItem:async()=>{throw Error('unavailable');},
  setItem:async(k,v)=>{writes.push([k,v]);}
 });
 await store.hydrate();assert.equal(store.getSnapshot().storageError,true);
 assert.equal(store.togglePinned('desktop','favorites'),true);
 await store.flush();assert.deepEqual(writes,[]);
});
test('empty quick-bar remains recoverable through main menu, without privileged routes',async()=>{
 const state=new Map([[QUICK_PIN_KEY,JSON.stringify({
  mobile:[],tablet:['home'],desktop:[]
 })]]);
 const store=createQuickActionStore({getItem:async k=>state.get(k)??null,setItem:async(k,v)=>{state.set(k,v);}});
 await store.hydrate();
 assert.deepEqual(store.getSnapshot().choices.mobile,[]);
 assert.equal(store.togglePinned('mobile','profile'),true);
 assert.deepEqual(store.getSnapshot().choices.mobile,['profile']);
 await store.flush();
});
test('quick toolbar and editor are actual accessible navigation wired to root state',()=>{
 const layout=read('app/_layout.tsx'),header=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(layout,/<QuickActionProvider><DevicePreferencesProvider><AppShell/);
 assert.match(header,/chosenQuickActions\.map\(id=><Pressable/);
 assert.match(header,/onPress=\{quickActions\[id\]\.run\}/);
 assert.match(header,/allowedQuickActions\.map\(id=><View/);
 assert.match(header,/quick\.togglePinned\(quickDevice,id\)/);
 assert.match(header,/quick\.movePinned\(quickDevice,id,-1\)/);
 assert.match(header,/quick\.movePinned\(quickDevice,id,1\)/);
 assert.match(header,/accessibilityLabel=\{'置頂'\+quickActions\[id\]\.label\}/);
 assert.match(header,/accessibilityLabel="設定置頂快捷功能"/);
 assert.match(header,/quick\.storageError/);
 assert.doesNotMatch(header,/\/admin|\/audio-admin|\/stickers\/spend/);
 assert.doesNotMatch(read('src/ui/echo/quickActionStore.ts'),/['\"]notifications['\"]/);
});
