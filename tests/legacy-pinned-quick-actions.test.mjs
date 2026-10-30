import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {QUICK_PIN_KEY,allowedQuickActions,quickDeviceForWidth,quickLimits,normalizeQuickChoices,
 createQuickActionStore,quickDragTargetIndex} from '../src/ui/echo/quickActionStore.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('original mobile/tablet/desktop quick action limits preserved for the safe authorized subset',()=>{
 assert.deepEqual(quickLimits,{mobile:3,tablet:5,desktop:7});
 assert.deepEqual([320,390,599,600,820,899,900,1440].map(quickDeviceForWidth),
  ['mobile','mobile','mobile','tablet','tablet','tablet','desktop','desktop']);
 assert.deepEqual(allowedQuickActions,['home','palette','stats','favorites','profile','theme']);
});
test('untrusted saved IDs, duplicates and over-capacity items are dropped',()=>{
 const choices=normalizeQuickChoices({
  mobile:['home','home','hacker','palette','speakers','profile','stats'],
  tablet:['stats','profile','favorites','speakers','palette','theme'],
  desktop:['theme','stats','favorites']
 });
 assert.deepEqual(choices.mobile,['home','palette','profile']);
 assert.deepEqual(choices.tablet,['stats','profile','favorites','palette','theme']);
 assert.deepEqual(choices.desktop,['theme','stats','favorites']);
});
test('pin/unpin at capacity and up/down reorder persist in separate device configurations',async()=>{
 const storage=new Map();
 const api={getItem:async key=>storage.get(key)??null,setItem:async(key,value)=>{storage.set(key,value);}};
 const store=createQuickActionStore(api);
 assert.equal(store.togglePinned('mobile','stats'),false,'changes disabled before hydration');
 await store.hydrate();
 assert.deepEqual(store.getSnapshot().choices.mobile,['home','palette']);
 assert.equal(store.togglePinned('mobile','stats'),true,'mobile has a free slot');
 assert.equal(store.togglePinned('mobile','profile'),false,'mobile reaches the original three-slot limit');
 assert.equal(store.togglePinned('mobile','palette'),true);
 assert.equal(store.togglePinned('mobile','profile'),true);
 assert.deepEqual(store.getSnapshot().choices.mobile,['home','stats','profile']);
 assert.equal(store.movePinned('mobile','stats',-1),true);
 assert.equal(store.movePinned('mobile','stats',-1),false);
 assert.deepEqual(store.getSnapshot().choices.mobile,['stats','home','profile']);
 assert.deepEqual(store.getSnapshot().choices.desktop,['home','palette','profile']);
 await store.flush();
 const next=createQuickActionStore(api);await next.hydrate();
 assert.deepEqual(next.getSnapshot().choices.mobile,['stats','home','profile']);
 assert.deepEqual(next.getSnapshot().choices.desktop,['home','palette','profile']);
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
 assert.match(header,/quickEditorOrder\.map\(id=><View/);
 assert.match(header,/quick\.togglePinned\(quickDevice,id\)/);
 assert.match(header,/quick\.movePinned\(quickDevice,id,-1\)/);
 assert.match(header,/quick\.movePinned\(quickDevice,id,1\)/);
 assert.match(header,/<QuickDragHandle id=\{id\}/);
 assert.match(header,/quick\.reorderPinned\(quickDevice,dragId,target\)/);
 assert.match(header,/scrollEnabled=\{draggingQuickId===null\}/);
 assert.match(header,/accessibilityLabel=\{'置頂'\+quickActions\[id\]\.label\}/);
 assert.match(header,/accessibilityLabel="設定置頂快捷功能"/);
 assert.match(header,/quick\.storageError/);
 assert.doesNotMatch(header,/\/admin|\/audio-admin|\/stickers\/spend/);
 assert.doesNotMatch(read('src/ui/echo/quickActionStore.ts'),/['\"]notifications['\"]/);
});

test('drag displacement maps to valid pinned slots and clamps at both ends',()=>{
 assert.equal(quickDragTargetIndex(1,0,3),1);
 assert.equal(quickDragTargetIndex(1,25,3),2);
 assert.equal(quickDragTargetIndex(2,-49,3),1);
 assert.equal(quickDragTargetIndex(0,-900,3),0);
 assert.equal(quickDragTargetIndex(2,900,3),2);
 assert.equal(quickDragTargetIndex(1,Number.NaN,3),1);
 assert.equal(quickDragTargetIndex(-1,48,3),-1);
});
test('drag reorders only pinned items, persisting once without changing other device kinds',async()=>{
 const storage=new Map([[QUICK_PIN_KEY,JSON.stringify({
  mobile:['home','palette','stats'],tablet:['home','palette','profile'],desktop:['home','palette','profile']
 })]]),writes=[];
 const api={getItem:async k=>storage.get(k)??null,setItem:async(k,v)=>{writes.push(v);storage.set(k,v);}};
 const store=createQuickActionStore(api);
 assert.equal(store.reorderPinned('mobile','stats',0),false);
 await store.hydrate();
 assert.equal(store.reorderPinned('mobile','stats',0),true);
 assert.deepEqual(store.getSnapshot().choices.mobile,['stats','home','palette']);
 assert.equal(store.reorderPinned('mobile','stats',0),false);
 assert.equal(store.reorderPinned('mobile','speakers',0),false);
 assert.equal(store.reorderPinned('mobile','stats',9),false);
 assert.equal(store.reorderPinned('mobile','stats',1.5),false);
 assert.equal(store.reorderPinned('mobile','admin',0),false);
 assert.deepEqual(store.getSnapshot().choices.tablet,['home','palette','profile']);
 await store.flush();assert.equal(writes.length,1);
 const restored=createQuickActionStore(api);await restored.hydrate();
 assert.deepEqual(restored.getSnapshot().choices.mobile,['stats','home','palette']);
});
test('dedicated drag responder has long-press cancel and retains accessible arrow controls',()=>{
 const source=read('src/ui/echo/QuickDragHandle.tsx');
 assert.match(source,/PanResponder\.create/);
 assert.match(source,/HOLD_MS=260/);
 assert.match(source,/CANCEL_DISTANCE=10/);
 assert.match(source,/onPanResponderTerminationRequest/);
 assert.match(source,/quickDragTargetIndex/);
 assert.match(source,/clearTimeout/);
 assert.doesNotMatch(source,/fetch\(|\/api\/|Audio\.|R2|localStorage/);
});
