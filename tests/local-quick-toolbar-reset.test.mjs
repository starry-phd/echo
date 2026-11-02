import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createQuickActionStore,QUICK_PIN_KEY} from '../src/ui/echo/quickActionStore.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('old current-device reset restores font/theme and never modifies other viewport preferences',async()=>{
 const previous={mobile:['home','favorites','stats'],tablet:['stats','palette','profile'],desktop:['home','palette','favorites','stats']};
 const values=new Map([[QUICK_PIN_KEY,JSON.stringify(previous)]]);
 const writes=[];
 const storage={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{writes.push([key,value]);values.set(key,value);}};
 const store=createQuickActionStore(storage);
 assert.equal(store.resetPinned('mobile'),false,'unhydrated reset must not overwrite storage');
 await store.hydrate();
 assert.equal(store.resetPinned('mobile'),true);
 assert.deepEqual(store.getSnapshot().choices.mobile,['font','theme']);
 assert.deepEqual(store.getSnapshot().choices.tablet,previous.tablet);
 assert.deepEqual(store.getSnapshot().choices.desktop,previous.desktop);
 await store.flush();
 assert.equal(writes.length,1,'one explicit reset, one serialized storage write');
 const next=createQuickActionStore(storage);await next.hydrate();
 assert.deepEqual(next.getSnapshot().choices.mobile,['font','theme']);
 assert.deepEqual(next.getSnapshot().choices.tablet,previous.tablet);
 assert.deepEqual(next.getSnapshot().choices.desktop,previous.desktop);
});

test('tablet/desktop reset affects only the selected layout, with no private shortcut IDs',async()=>{
 const values=new Map([[QUICK_PIN_KEY,JSON.stringify({
  mobile:['favorites','stats'],tablet:['stats','favorites'],desktop:['profile','home','palette']
 })]]);
 const store=createQuickActionStore({getItem:async k=>values.get(k)??null,setItem:async(k,v)=>values.set(k,v)});
 await store.hydrate();
 assert.equal(store.resetPinned('tablet'),true);
 assert.deepEqual(store.getSnapshot().choices.tablet,['font','theme']);
 assert.deepEqual(store.getSnapshot().choices.mobile,['favorites','stats']);
 assert.deepEqual(store.getSnapshot().choices.desktop,['profile','home','palette']);
 assert.equal(store.resetPinned('desktop'),true);
 assert.deepEqual(store.getSnapshot().choices.desktop,['font','theme']);
 await store.flush();
 assert.deepEqual(JSON.parse(values.get(QUICK_PIN_KEY)),{
  mobile:['favorites','stats'],tablet:['font','theme'],desktop:['font','theme']
 });
});

test('failed hydration must not wipe possibly recoverable saved local preferences',async()=>{
 const writes=[];
 const store=createQuickActionStore({getItem:async()=>{throw Error('unavailable');},
  setItem:async(k,v)=>{writes.push([k,v]);}});
 await store.hydrate();
 assert.equal(store.getSnapshot().storageError,true);
 assert.equal(store.resetPinned('desktop'),false);
 await store.flush();
 assert.deepEqual(writes,[]);
});

test('reset control is accessible and wired only to current viewport local store',()=>{
 const ui=read('src/ui/echo/LegacyHeader.tsx');
 const provider=read('src/ui/echo/QuickActions.tsx');
 const store=read('src/ui/echo/quickActionStore.ts');
 assert.match(ui,/accessibilityLabel="恢復目前版型的預設置頂快捷功能"/);
 assert.match(ui,/disabled=\{!quick\.ready\}/);
 assert.match(ui,/quick\.resetPinned\(quickDevice\)/);
 assert.match(ui,/已恢復目前版型的預設快捷功能/);
 assert.match(provider,/resetPinned:store\.resetPinned/);
 assert.match(store,/resetPinned:\(device:QuickDeviceKind\)=>/);
 assert.match(store,/if\(!state\.ready\|\|!writable\)return false/);
 assert.doesNotMatch(ui,/\/admin|\/billing|\/private\/|\/stickers\/spend/);
 assert.doesNotMatch(store,/fetch\(|\bR2\b|\bD1\b|\/api\/|\bAuth\b/);
});
