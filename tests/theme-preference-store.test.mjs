import test from 'node:test';
import assert from 'node:assert/strict';
import {createThemePreferenceStore,THEME_PALETTE_KEY,THEME_DARK_KEY} from '../src/ui/echo/themePreferenceStore.ts';
const ids=['rose','forest','sky','charcoal'];

test('appearance restores existing Web keys and legacy dark preference without writing defaults',async()=>{
 const values=new Map([[THEME_PALETTE_KEY,'forest'],['sq_theme_dark','true']]);let writes=0;
 const store=createThemePreferenceStore({async getItem(key){return values.get(key)??null;},async setItem(){writes++;}},ids);
 assert.equal(store.getServerSnapshot().id,'rose');
 await store.hydrate();
 assert.equal(store.getSnapshot().id,'forest');assert.equal(store.getSnapshot().dark,true);assert.equal(writes,0);
});
test('new dark setting overrides old setting and invalid palette falls back safely',async()=>{
 const store=createThemePreferenceStore({async getItem(key){return key===THEME_DARK_KEY?'0':key==='sq_theme_dark'?'true':'unknown';},async setItem(){}},ids);
 await store.hydrate();assert.equal(store.getSnapshot().id,'rose');assert.equal(store.getSnapshot().dark,false);
 store.setPalette('unknown');assert.equal(store.getSnapshot().id,'rose');
});
test('a choice during slow native hydration wins and rapid saves remain in order',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});const saved=new Map();
 const store=createThemePreferenceStore({async getItem(key){await gate;return key===THEME_PALETTE_KEY?'forest':'0';},async setItem(key,value){
  await new Promise(resolve=>setTimeout(resolve,2));saved.set(key,value);
 }},ids);
 const loading=store.hydrate();store.setPalette('sky');store.toggleDark();release();await loading;
 assert.equal(store.getSnapshot().id,'sky');assert.equal(store.getSnapshot().dark,true);
 store.setPalette('forest');store.setPalette('charcoal');store.toggleDark();await store.flush();
 assert.equal(saved.get(THEME_PALETTE_KEY),'charcoal');assert.equal(saved.get(THEME_DARK_KEY),'0');
});
test('good mood randomly selects another palette rather than stepping through the list',async()=>{
 const store=createThemePreferenceStore({async getItem(){return null;},async setItem(){}},ids,()=>0.99);
 await store.hydrate();store.cyclePalette();assert.equal(store.getSnapshot().id,'charcoal');
 store.cyclePalette();assert.equal(store.getSnapshot().id,'sky');
});
test('failed storage keeps appearance usable without overwriting unread settings',async()=>{
 let writes=0;
 const store=createThemePreferenceStore({async getItem(){throw Error('denied');},async setItem(){writes++;}},ids);
 await store.hydrate();store.setPalette('sky');store.toggleDark();await store.flush();
 assert.equal(store.getSnapshot().id,'sky');assert.equal(store.getSnapshot().dark,true);
 assert.equal(store.getSnapshot().storageError,true);assert.equal(writes,0);
});
