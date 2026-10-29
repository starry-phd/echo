import test from 'node:test';
import assert from 'node:assert/strict';
import {createDevicePreferenceStore} from '../src/ui/echo/devicePreferenceStore.ts';
import {DEVICE_FAVORITES_KEY} from '../src/ui/echo/deviceFavorites.ts';
import {DISLIKED_STORAGE_KEY} from '../src/ui/echo/dislikedTracks.ts';

test('hydration preserves prior web keys and ignores actions until loading completes',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 const store=createDevicePreferenceStore({
  async getItem(key){await gate;return key===DEVICE_FAVORITES_KEY?'["old","old",null]':'["hidden"]';},
  async setItem(){throw Error('No writes expected');}
 });
 const loading=store.hydrate();
 store.toggleFavorite('too-early');store.dislike('too-early');
 release();await loading;
 assert.deepEqual(store.getSnapshot(),{favoriteIds:['old'],dislikedIds:['hidden'],ready:true,storageError:false});
});
test('rapid changes serialize storage and all subscribers see shared current preferences',async()=>{
 const saved=new Map();const observations=[];
 const store=createDevicePreferenceStore({async getItem(){return null;},async setItem(key,value){
  await new Promise(resolve=>setTimeout(resolve,2));saved.set(key,value);
 }});
 await store.hydrate();
 const unsubscribe=store.subscribe(()=>observations.push(store.getSnapshot()));
 store.toggleFavorite('a');store.toggleFavorite('b');store.toggleFavorite('a');
 store.dislike('b');store.restoreHidden();
 await store.flush();unsubscribe();
 assert.deepEqual(JSON.parse(saved.get(DEVICE_FAVORITES_KEY)),['b']);
 assert.deepEqual(JSON.parse(saved.get(DISLIKED_STORAGE_KEY)),[]);
 assert.deepEqual(observations.at(-1).favoriteIds,['b']);
 assert.deepEqual(observations.at(-1).dislikedIds,[]);
});
test('failed reads keep memory functional without overwriting unknown saved data',async()=>{
 let writes=0;
 const store=createDevicePreferenceStore({async getItem(){throw Error('Storage denied');},async setItem(){writes++;}});
 await store.hydrate();store.toggleFavorite('safe');await store.flush();
 assert.equal(store.getSnapshot().storageError,true);
 assert.deepEqual(store.getSnapshot().favoriteIds,['safe']);assert.equal(writes,0);
});
test('a failed save reports persistence limits without losing current selection',async()=>{
 const store=createDevicePreferenceStore({async getItem(){return 'invalid json';},async setItem(){throw Error('Full');}});
 await store.hydrate();store.toggleFavorite('safe');await store.flush();
 assert.deepEqual(store.getSnapshot().favoriteIds,['safe']);assert.equal(store.getSnapshot().storageError,true);
});
