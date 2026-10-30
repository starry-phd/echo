import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FONT_ZOOM_KEY,FONT_ZOOM_MIN,FONT_ZOOM_MAX,normalizedFontZoom,scaledFontSize,
 createFontZoomPreferenceStore
} from '../src/ui/echo/fontZoomPreferenceStore.ts';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('old A−/A＋ zoom range is bounded 100-140% with 10% increments',async()=>{
 const writes=[];
 const storage={getItem:async()=>null,setItem:async(k,v)=>{writes.push([k,v]);}};
 const store=createFontZoomPreferenceStore(storage);
 await store.hydrate();
 assert.equal(FONT_ZOOM_MIN,1);assert.equal(FONT_ZOOM_MAX,1.4);
 store.decrease();assert.equal(store.getSnapshot().zoom,1);
 for(let i=0;i<9;i++)store.increase();
 assert.equal(store.getSnapshot().zoom,1.4);
 for(let i=0;i<9;i++)store.decrease();
 assert.equal(store.getSnapshot().zoom,1);
 await store.flush();
 assert.deepEqual(writes[0],[FONT_ZOOM_KEY,'1.1']);
 assert.deepEqual(writes.at(-1),[FONT_ZOOM_KEY,'1']);
});
test('saved preference loads and survives across recreated stores and screens',async()=>{
 const cache=new Map([[FONT_ZOOM_KEY,'1.3']]);
 const storage={getItem:async k=>cache.get(k)??null,setItem:async(k,v)=>{cache.set(k,v);}};
 const one=createFontZoomPreferenceStore(storage);
 assert.equal(one.getSnapshot().zoom,1);
 await one.hydrate();
 assert.equal(one.getSnapshot().zoom,1.3);
 one.increase();await one.flush();
 const two=createFontZoomPreferenceStore(storage);await two.hydrate();
 assert.equal(two.getSnapshot().zoom,1.4);
 assert.equal(scaledFontSize(20,two.getSnapshot().zoom),28);
 assert.equal(scaledFontSize(14,1.3),18.2);
});
test('hydrating asynchronously never erases font size selected before native read completes',async()=>{
 let resolve;
 const saved=new Promise(r=>{resolve=r;});
 const writes=[];
 const store=createFontZoomPreferenceStore({getItem:()=>saved,setItem:async(k,v)=>{writes.push([k,v]);}});
 const waiting=store.hydrate();
 store.increase();
 resolve('1.4');
 await waiting;await store.flush();
 assert.equal(store.getSnapshot().zoom,1.1);
 assert.deepEqual(writes,[[FONT_ZOOM_KEY,'1.1']]);
});
test('failed native reads never overwrite unverified saved font preference',async()=>{
 const writes=[];
 const store=createFontZoomPreferenceStore({
  getItem:async()=>{throw Error('storage unavailable');},
  setItem:async(k,v)=>{writes.push([k,v]);}
 });
 await store.hydrate();
 assert.equal(store.getSnapshot().storageError,true);
 store.increase();await store.flush();
 assert.equal(store.getSnapshot().zoom,1.1);
 assert.deepEqual(writes,[]);
});
test('bad/oversized storage is clamped, malformed input does not create NaN sizes',async()=>{
 for(const [raw,expected] of [['bogus',1],['',1],['-12',1],['30',1.4],['1.26',1.3]]){
  const store=createFontZoomPreferenceStore({getItem:async()=>raw,setItem:async()=>{}});
  await store.hydrate();assert.equal(store.getSnapshot().zoom,expected);
 }
 assert.equal(normalizedFontZoom(NaN),1);
 assert.equal(normalizedFontZoom(Infinity),1);
 assert.equal(scaledFontSize(20,NaN),20);
 assert.equal(scaledFontSize(22,1.4),30.8);
});
test('old font controls are accessible, saved once and applied across home and deep pages',()=>{
 const layout=read('app/_layout.tsx'),header=read('src/ui/echo/LegacyHeader.tsx');
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 assert.match(layout,/<FontZoomProvider><DevicePreferencesProvider><AppShell/);
 assert.match(header,/accessibilityLabel="縮小字體"/);
 assert.match(header,/accessibilityLabel="放大字體"/);
 assert.match(header,/onPress=\{increase\}/);
 assert.match(header,/onPress=\{decrease\}/);
 assert.match(header,/zoom>=1\.4/);
 assert.match(header,/zoom<=1/);
 assert.match(card,/fontSize:fontSize\(20\),lineHeight:fontSize\(24\)/);
 for(const file of ['app/index.tsx','app/speaker/[name].tsx','app/stats.tsx','app/preview/[id].tsx']){
  const code=read(file);
  assert.match(code,/useFontZoom\(\)/,file);
  assert.match(code,/fontSize:fontSize\(/,file);
 }
});
