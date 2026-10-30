import test from 'node:test';
import assert from 'node:assert/strict';
import {createDevicePreferenceStore} from '../src/ui/echo/devicePreferenceStore.ts';
import {DEVICE_FAVORITES_KEY} from '../src/ui/echo/deviceFavorites.ts';
import {DISLIKED_STORAGE_KEY} from '../src/ui/echo/dislikedTracks.ts';
import {HIDDEN_SPEAKERS_KEY} from '../src/ui/echo/hiddenSpeakers.ts';

test('hydration preserves prior web keys and ignores actions until loading completes',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 const store=createDevicePreferenceStore({
  async getItem(key){await gate;return key===DEVICE_FAVORITES_KEY?'["old","old",null]':key===DISLIKED_STORAGE_KEY?'["hidden"]':null;},
  async setItem(){throw Error('No writes expected');}
 });
 const loading=store.hydrate();
 store.toggleFavorite('too-early');store.dislike('too-early');
 release();await loading;
 assert.deepEqual(store.getSnapshot(),{favoriteIds:['old'],dislikedIds:['hidden'],hiddenSpeakers:[],ready:true,storageError:false});
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
test('unparseable saved preferences remain untouched while memory changes are allowed',async()=>{
 let writes=0;
 const store=createDevicePreferenceStore({async getItem(){return 'invalid json';},async setItem(){writes++;}});
 await store.hydrate();store.toggleFavorite('safe');await store.flush();
 assert.deepEqual(store.getSnapshot().favoriteIds,['safe']);
 assert.equal(store.getSnapshot().storageError,true);
 assert.equal(writes,0);
});

test('restoreHiddenTrack removes only one stored local dislike and preserves favorites',async()=>{
 const saved=new Map([[DEVICE_FAVORITES_KEY,'["a"]'],[DISLIKED_STORAGE_KEY,'["x","y","z"]']]);
 const store=createDevicePreferenceStore({
  async getItem(key){return saved.get(key)??null;},
  async setItem(key,value){saved.set(key,value);}
 });
 assert.equal(store.restoreHiddenTrack('x'),false);
 await store.hydrate();
 assert.equal(store.restoreHiddenTrack('not-hidden'),false);
 assert.equal(store.restoreHiddenTrack(''),false);
 assert.equal(store.restoreHiddenTrack('y'),true);
 await store.flush();
 assert.deepEqual(store.getSnapshot().dislikedIds,['x','z']);
 assert.deepEqual(store.getSnapshot().favoriteIds,['a']);
 assert.deepEqual(JSON.parse(saved.get(DISLIKED_STORAGE_KEY)),['x','z']);
 store.restoreHiddenTrack('x');store.dislike('k');store.restoreHiddenTrack('z');
 await store.flush();
 assert.deepEqual(JSON.parse(saved.get(DISLIKED_STORAGE_KEY)),['k']);
});

test('local speaker hides preserve old keys and serialize rapid restores',async()=>{
 const saved=new Map([[DEVICE_FAVORITES_KEY,'["fav"]'],[DISLIKED_STORAGE_KEY,'["card"]'],[HIDDEN_SPEAKERS_KEY,'["王小明"]']]);
 const store=createDevicePreferenceStore({
  async getItem(key){return saved.get(key)??null;},
  async setItem(key,value){await new Promise(resolve=>setTimeout(resolve,2));saved.set(key,value);}
 });
 assert.equal(store.hideSpeaker('early'),false);
 await store.hydrate();
 assert.deepEqual(store.getSnapshot().hiddenSpeakers,['王小明']);
 assert.equal(store.hideSpeaker('王小明'),false);
 assert.equal(store.hideSpeaker('林美麗 & 李小華'),true);
 assert.equal(store.restoreHiddenSpeaker('missing'),false);
 assert.equal(store.restoreHiddenSpeaker('王小明'),true);
 await store.flush();
 assert.deepEqual(JSON.parse(saved.get(HIDDEN_SPEAKERS_KEY)),['林美麗 & 李小華']);
 assert.deepEqual(JSON.parse(saved.get(DEVICE_FAVORITES_KEY)),['fav']);
 assert.deepEqual(JSON.parse(saved.get(DISLIKED_STORAGE_KEY)),['card']);
 store.restoreAllSpeakers();
 await store.flush();
 assert.deepEqual(JSON.parse(saved.get(HIDDEN_SPEAKERS_KEY)),[]);
});
test('speaker hiding still works in memory when storage cannot be read',async()=>{
 let writes=0;
 const store=createDevicePreferenceStore({async getItem(){throw Error('denied');},async setItem(){writes++;}});
 await store.hydrate();
 assert.equal(store.hideSpeaker('安全講師'),true);
 await store.flush();
 assert.deepEqual(store.getSnapshot().hiddenSpeakers,['安全講師']);
 assert.equal(store.getSnapshot().storageError,true);
 assert.equal(writes,0);
});

test('one new speaker-key read failure does not wipe previously saved favorites or dislikes',async()=>{
 const saved=new Map([
  [DEVICE_FAVORITES_KEY,'["favorite-old"]'],
  [DISLIKED_STORAGE_KEY,'["disliked-old"]'],
  [HIDDEN_SPEAKERS_KEY,'["unknown-private-local-value"]']
 ]);
 const writes=[];
 const store=createDevicePreferenceStore({
  async getItem(key){if(key===HIDDEN_SPEAKERS_KEY)throw Error('speaker key unreadable');return saved.get(key)??null;},
  async setItem(key,value){writes.push(key);saved.set(key,value);}
 });
 await store.hydrate();
 assert.deepEqual(store.getSnapshot(),{
  favoriteIds:['favorite-old'],dislikedIds:['disliked-old'],hiddenSpeakers:[],ready:true,storageError:true
 });
 store.toggleFavorite('new-favorite');
 store.dislike('new-dislike');
 store.hideSpeaker('新講師');
 await store.flush();
 assert.deepEqual(JSON.parse(saved.get(DEVICE_FAVORITES_KEY)),['favorite-old','new-favorite']);
 assert.deepEqual(JSON.parse(saved.get(DISLIKED_STORAGE_KEY)),['disliked-old','new-dislike']);
 assert.equal(saved.get(HIDDEN_SPEAKERS_KEY),'["unknown-private-local-value"]');
 assert.deepEqual(writes,[DEVICE_FAVORITES_KEY,DISLIKED_STORAGE_KEY]);
});
test('invalid stored JSON/type blocks only its own key, preserving other valid keys',async()=>{
 const saved=new Map([
  [DEVICE_FAVORITES_KEY,'{"unexpected":"object"}'],
  [DISLIKED_STORAGE_KEY,'["old-hidden"]'],
  [HIDDEN_SPEAKERS_KEY,'["王小明"]']
 ]);
 const store=createDevicePreferenceStore({
  async getItem(key){return saved.get(key)??null;},
  async setItem(key,value){saved.set(key,value);}
 });
 await store.hydrate();
 assert.equal(store.getSnapshot().storageError,true);
 assert.deepEqual(store.getSnapshot().favoriteIds,[]);
 assert.deepEqual(store.getSnapshot().dislikedIds,['old-hidden']);
 assert.deepEqual(store.getSnapshot().hiddenSpeakers,['王小明']);
 store.toggleFavorite('memory-only');
 store.restoreHiddenTrack('old-hidden');
 store.hideSpeaker('林美麗');
 await store.flush();
 assert.equal(saved.get(DEVICE_FAVORITES_KEY),'{"unexpected":"object"}');
 assert.deepEqual(JSON.parse(saved.get(DISLIKED_STORAGE_KEY)),[]);
 assert.deepEqual(JSON.parse(saved.get(HIDDEN_SPEAKERS_KEY)),['王小明','林美麗']);
});
