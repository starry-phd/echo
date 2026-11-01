import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {persistGuestTutorialOptOut} from '../src/ui/echo/legacyTutorialPreferencePersistence.ts';
import {GUEST_TUTORIAL_KEY,LEGACY_TUTORIAL_KEYS}
 from '../src/ui/echo/legacyGuestTutorialPolicy.ts';

const guide=readFileSync(new URL('../src/ui/echo/LegacyGuestTutorial.tsx',import.meta.url),'utf8');

function createStorage(){
 const data=new Map();
 const calls=[];
 const primary={
  async setItem(key,value){calls.push(['primary-set',key,value]);data.set(key,value);},
  async removeItem(key){calls.push(['primary-remove',key]);data.delete(key);}
 };
 const mirror={
  setItem(key,value){calls.push(['legacy-set',key,value]);data.set(key,value);},
  removeItem(key){calls.push(['legacy-remove',key]);data.delete(key);}
 };
 return {data,calls,primary,mirror};
}

test('checking remembers preference immediately in primary and all original browser keys',async()=>{
 const s=createStorage();
 assert.deepEqual(await persistGuestTutorialOptOut(true,s.primary,s.mirror),{legacySynced:true});
 assert.equal(s.data.get(GUEST_TUTORIAL_KEY),'1');
 for(const key of LEGACY_TUTORIAL_KEYS)assert.equal(s.data.get(key),'1');
 assert.equal(s.calls[0][0],'primary-set');
});

test('unchecking immediately removes the new preference and all three original keys',async()=>{
 const s=createStorage();
 await persistGuestTutorialOptOut(true,s.primary,s.mirror);
 assert.deepEqual(await persistGuestTutorialOptOut(false,s.primary,s.mirror),{legacySynced:true});
 for(const key of [GUEST_TUTORIAL_KEY,...LEGACY_TUTORIAL_KEYS])assert.equal(s.data.has(key),false);
 assert.equal(s.calls[4][0],'primary-remove');
});

test('failed primary storage must not mirror or tell caller the choice was saved',async()=>{
 const seen=[];
 const primary={setItem:async()=>{throw Error('storage locked');},
  removeItem:async()=>{throw Error('storage locked');}};
 const mirror={setItem:key=>seen.push(key),removeItem:key=>seen.push(key)};
 await assert.rejects(persistGuestTutorialOptOut(true,primary,mirror),/storage locked/);
 await assert.rejects(persistGuestTutorialOptOut(false,primary,mirror),/storage locked/);
 assert.deepEqual(seen,[]);
});

test('legacy browser mirror failure does not misreport already-saved primary preference',async()=>{
 const s=createStorage();
 const blocked={setItem:()=>{throw Error('blocked');},removeItem:()=>{throw Error('blocked');}};
 assert.deepEqual(await persistGuestTutorialOptOut(true,s.primary,blocked),{legacySynced:false});
 assert.equal(s.data.get(GUEST_TUTORIAL_KEY),'1');
 assert.deepEqual(await persistGuestTutorialOptOut(false,s.primary,blocked),{legacySynced:false});
 assert.equal(s.data.has(GUEST_TUTORIAL_KEY),false);
});

test('both guide variants persist at checkbox interaction; dismissal waits for pending write',()=>{
 assert.match(guide,/const changeNeverAgain=async\(\)=>/);
 assert.match(guide,/persistGuestTutorialOptOut\(next,AsyncStorage,mirror\)/);
 assert.match(guide,/preferenceWriteInFlight\.current=true/);
 assert.match(guide,/if\(preferenceWriteInFlight\.current\)return/);
 assert.match(guide,/disabled=\{saving\} onPress=\{\(\)=>void changeNeverAgain\(\)\}/);
 assert.match(guide,/const dismiss=\(\)=>\{/);
 const dismiss=guide.slice(guide.indexOf(' const dismiss=()=>{'),guide.indexOf(' const visible='));
 assert.doesNotMatch(dismiss,/AsyncStorage\.|persistGuestTutorialOptOut\(/);
 assert.match(guide,/已維持原本選擇/);
});
