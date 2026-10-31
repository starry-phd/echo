import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCategorySuggestionBlurGuard} from '../src/ui/echo/categorySuggestionBlurGuard.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

function fakeClock(){
 let next=1;
 const pending=new Map();
 return {
  schedule(fn){const id=next++;pending.set(id,fn);return id;},
  cancel(id){pending.delete(id);},
  tick(){for(const [id,fn] of [...pending]){if(!pending.has(id))continue;pending.delete(id);fn();}},
  get size(){return pending.size;}
 };
}

test('outside blur closes focused search suggestions; refocus cancels pending dismissal',()=>{
 let closes=0;const clock=fakeClock();
 const guard=createCategorySuggestionBlurGuard(()=>closes++,clock);
 guard.focus();guard.blur();
 assert.equal(clock.size,1);
 guard.focus();clock.tick();assert.equal(closes,0);
 guard.blur();clock.tick();assert.equal(closes,1);
 guard.dispose();
});

test('chip press starting before blur cannot unmount suggestion before onPress',()=>{
 let closes=0;const clock=fakeClock();
 const guard=createCategorySuggestionBlurGuard(()=>closes++,clock);
 guard.focus();guard.pressStart();guard.blur();
 clock.tick();assert.equal(closes,0,'long press remains selectable');
 guard.pressEnd();assert.equal(clock.size,1);
 // Simulate the Pressable onPress arriving after onPressOut.
 guard.dismiss();assert.equal(closes,1);
 clock.tick();assert.equal(closes,1,'stale scheduled dismissal cancelled');
 guard.dispose();
});

test('chip pointer starting after blur also keeps suggestions open; cancelled presses close',()=>{
 let closes=0;const clock=fakeClock();
 const guard=createCategorySuggestionBlurGuard(()=>closes++,clock);
 guard.focus();guard.blur();guard.pressStart();clock.tick();
 assert.equal(closes,0);
 guard.pressEnd();clock.tick();
 assert.equal(closes,1,'cancelled press with no onPress must eventually dismiss');
 guard.dispose();
});

test('pending blur cleanup does not call setState after component unmount',()=>{
 let closes=0;const clock=fakeClock();
 const guard=createCategorySuggestionBlurGuard(()=>closes++,clock);
 guard.focus();guard.blur();guard.dispose();clock.tick();
 assert.equal(closes,0);
});

test('home wires TextInput blur and suggestion press handlers without early chip activation',()=>{
 const home=read('app/index.tsx');
 assert.match(home,/onBlur=\{\(\)=>searchSuggestionBlurGuard\.blur\(\)\}/);
 assert.match(home,/onPressIn=\{\(\)=>searchSuggestionBlurGuard\.pressStart\(\)\}/);
 assert.match(home,/onPressOut=\{\(\)=>searchSuggestionBlurGuard\.pressEnd\(\)\}/);
 assert.match(home,/onPress=\{\(\)=>selectSuggestedCategory\(label\)\}/);
 assert.match(home,/searchSuggestionBlurGuard\.dismiss\(\)/);
 assert.match(home,/searchSuggestionBlurGuard\.dispose\(\)/);
 assert.doesNotMatch(home,/onPressIn=\{\(\)=>selectSuggestedCategory\(label\)\}/);
});
