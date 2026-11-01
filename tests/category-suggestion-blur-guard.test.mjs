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

test('other handled home actions explicitly close hints on native where TextInput may stay focused',()=>{
 const home=read('app/index.tsx');
 // The old Web app closes on outside mousedown, but in React Native handled
 // Pressable actions do not guarantee a TextInput blur with this ScrollView.
 assert.match(home,/keyboardShouldPersistTaps="handled"/);
 assert.match(home,/onPress=\{\(\)=>\{searchSuggestionBlurGuard\.dismiss\(\);draw\(\);\}\}/);
 assert.match(home,/onPress=\{\(\)=>\{searchSuggestionBlurGuard\.dismiss\(\);setAdvanced\(value=>!value\);\}\}/);
 assert.match(home,/onRank=\{value=>\{searchSuggestionBlurGuard\.dismiss\(\);setSpeakerRank\(value\);\}\}/);
 assert.match(home,/onPress=\{clearAllHomeFilters\}/);
 assert.match(home,/const clearAllHomeFilters=\(\)=>\{\s*searchSuggestionBlurGuard\.dismiss\(\)/);
 // Keep chip selection on onPress, not on pressStart.
 assert.match(home,/onPress=\{\(\)=>selectSuggestedCategory\(label\)\}/);
});

test('original clear-search action returns focus to TextInput for the next query',()=>{
 const home=read('app/index.tsx');
 assert.match(home,/const searchInputRef=useRef<ComponentRef<typeof TextInput>>\(null\)/);
 assert.match(home,/<TextInput ref=\{searchInputRef\}/);
 assert.match(home,/accessibilityLabel="清除搜尋"[\s\S]*?onPress=\{\(\)=>\{[\s\S]*?setQuery\(''\);[\s\S]*?setDebouncedQuery\(''\);[\s\S]*?searchSuggestionBlurGuard\.focus\(\);[\s\S]*?setSearchSuggestionsOpen\(true\);[\s\S]*?searchInputRef\.current\?\.focus\(\);[\s\S]*?\}\} style=\{styles\.clear\}/);
 // The approved category suggestion gate is unchanged: empty text never
 // opens a full suggestion catalogue or a private community-keyword search.
 const suggestions=read('src/ui/echo/categorySuggestions.ts');
 assert.match(suggestions,/focused&&typedQuery\.trim\(\)\.length>0&&suggestions\.length>0/);
 assert.doesNotMatch(home,/getPrivateTracks|legacyUserKeywords|\/api\/private/);
});

test('clearing while a native TextInput blur timeout is pending cancels the stale dismissal',()=>{
 const clock=fakeClock();let closes=0;
 const guard=createCategorySuggestionBlurGuard(()=>closes++,clock);
 guard.focus();guard.blur();
 assert.equal(clock.size,1);
 guard.focus(); // Clear-search handler refocuses the input before next typing.
 clock.tick();
 assert.equal(closes,0,'stale blur may not dismiss newly focused search');
 guard.blur();clock.tick();
 assert.equal(closes,1,'real later outside blur still dismisses');
 guard.dispose();
});
